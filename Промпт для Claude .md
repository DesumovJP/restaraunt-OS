# Ультра детальний промпт для Claude: Реалізація ресторанної системи на Strapi v5 + PostgreSQL + Next.js 16 (GraphQL)

Це повний промпт-маніфест. Побудуй обширний план, архітектуру, схеми, сервіси, GraphQL контракти, ролі/права, інвентарні транзакції, аналітику/KPI, тест-кейси, CI/CD, деплой і документацію. Всі артефакти — готові до продакшн, audit-ready, reproducible, без “моків”, тільки реальні дані та транзакційна логіка.

---

## 1. Цілі, домен і обсяг робіт

- **Ціль:**  
  - Побудувати продакшн систему ресторану: реальні меню, рецептури, інгредієнти, партії, замовлення, кухонні тікети, рухи інвентаря, повна історія дій, аналітика та KPI.
- **Обов’язково:**  
  - **Транзакційність:** списання інгредієнтів по кнопці “Почати” в одній атомарній транзакції.  
  - **Аудит:** кожна дія в TicketEvent; кожен рух інвентаря в InventoryMovement з reason, unit, batch, reference.  
  - **Реальні дані:** PostgreSQL для dev/prod; без SQLite; жодних моків у проді.
- **Вихідні артефакти:**  
  - **Структура даних:** JSON schema для всіх content-types Strapi v5.  
  - **Сервіси:** StartTicket (транзакційний), утиліти нормалізації одиниць, вибір батчів FIFO/FEFO, рухи інвентаря.  
  - **GraphQL:** типи, queries, mutations, fragments, persisted queries, приклади відповідей.  
  - **Next.js:** серверні компоненти, Zustand store, хуки даних, приклади сторінок (кухонна черга, офіціант).  
  - **RBAC:** ролі Waiter, Chef, Manager, System з матрицею прав.  
  - **Аналітика/KPI:** розрахунки, запити, звіти.  
  - **DevOps:** Dockerfile, docker-compose, CI/CD, healthchecks, pg_dump backup, DR-скрипти.  
  - **Документація:** операційні інструкції, rollback-плани, тест-кейси, runbooks.

---

## 2. Архітектура даних: контент-тайпи і зв’язки

Побудуй і надай JSON schema для Strapi v5 (content-types, components, relations, enums, indexes). Використовуй documentId/slug, не id. Дотримуйся draftAndPublish залежно від сценарію.

- **MenuItem (collection):**  
  - **Поля:** name, slug, category (→ MenuCategory), type [dish, drink, side], price, cost_method [recipe_cost, fixed_cost], active, recipe (1–1 → Recipe), media, tags.  
  - **Індекси:** slug, active+category.
- **Recipe (collection):**  
  - **Поля:** menu_item (1–1 → MenuItem), portion_size (component: value, unit), yield_per_recipe, version (auto-increment), status [draft, approved, archived], steps (→ RecipeStep), ingredients (→ RecipeIngredient), notes.  
  - **Версіонування:** редагування approved — тільки через нову версію.
- **RecipeIngredient (collection):**  
  - **Поля:** recipe (→ Recipe), ingredient (→ Ingredient), quantity, unit [g, kg, ml, l, pcs, tsp, tbsp], waste_factor (%), optional (bool).  
  - **Валідація:** узгоджені одиниці з Ingredient.unit_primary через conversion.
- **RecipeStep (collection):**  
  - **Поля:** recipe (→ Recipe), order_index, description, expected_duration_sec, equipment[].
- **Ingredient (collection):**  
  - **Поля:** name, sku, unit_primary (enum), conversion (JSON: правила конверсій), min_stock_level, current_stock (virtual, розрахунок з InventoryMovement), allergens[], active.
- **StockBatch (collection):**  
  - **Поля:** ingredient (→ Ingredient), batch_code, received_at, expiry_at, quantity (primary unit), cost_per_unit, remaining_quantity, supplier (→ Supplier?).  
  - **Правило:** FEFO/FIFO вибір батчів за конфігом.
- **Order (collection):**  
  - **Поля:** code (унікальний), table (→ Table), status [new, in_kitchen, ready, served, canceled], items (→ OrderItem), total_price, notes, placed_at.
- **OrderItem (collection):**  
  - **Поля:** order (→ Order), menu_item (→ MenuItem), quantity, modifiers (JSON), price_at_sale, status [queued, cooking, ready, canceled], kitchen_ticket (1–1 → KitchenTicket).
- **KitchenTicket (collection):**  
  - **Поля:** order_item (→ OrderItem), status [queued, started, paused, ready, failed], assigned_to (→ User, роль Chef), started_at, ready_at, events (→ TicketEvent), inventory_locked (bool).
- **TicketEvent (collection):**  
  - **Поля:** kitchen_ticket (→ KitchenTicket), type [created, started, paused, resumed, inventory_debit, ready, failed, canceled], actor (→ User), payload (JSON), created_at.
- **InventoryMovement (collection):**  
  - **Поля:** ingredient (→ Ingredient), stock_batch (→ StockBatch, nullable), type [debit, credit, adjustment, waste], quantity, unit (enum), reason [recipe_use, supplier_delivery, correction, spoilage, return], reference_ticket (→ KitchenTicket, nullable), note, created_at.
- **MenuCategory (collection):**  
  - **Поля:** name, slug, order_index.
- **Table (collection):**  
  - **Поля:** code, zone, capacity.
- **Supplier (optional, collection):**  
  - **Поля:** name, contact (JSON), rating.

- **Індекси та продуктивність:**  
  - **Обов’язково:** KitchenTicket.status, Order.status, InventoryMovement.created_at, StockBatch.expiry_at, MenuItem.slug, RecipeIngredient.recipe+ingredient.

---

## 3. Бізнес-процес: статуси, транзакції, сервіс StartTicket

Реалізуй state-machines і сервіс StartTicket з атомарністю. Дай код сервісу, lifecycle hooks, валідації, помилки.

- **Потік “замовлення → кухня → видача”:**  
  - **Order.new:** створення OrderItem з quantity, price_at_sale; генеруються KitchenTicket зі статусом queued; TicketEvent.created.  
  - **Chef натискає “Почати”:** KitchenTicket.status → started, started_at; TicketEvent.started; транзакційне списання інгредієнтів: InventoryMovement.debit reason=recipe_use з прив’язкою до батчів (FIFO/FEFO), множення на OrderItem.quantity, врахування waste_factor; TicketEvent.inventory_debit з деталізацією; inventory_locked=true.  
  - **“Готово”:** KitchenTicket.status → ready, ready_at; TicketEvent.ready; OrderItem.status → ready; якщо всі готові — Order.status → ready; надсилання webhook офіціанту.  
  - **“Видано”:** Order.status → served.  
  - **Скасування/збій:** KitchenTicket.failed або OrderItem.canceled; InventoryMovement.adjustment/waste (повернення або втрати); TicketEvent.failed/canceled.
- **Статусні правила:**  
  - **Order:** new → in_kitchen → ready → served → canceled.  
  - **OrderItem:** queued → cooking → ready → canceled.  
  - **KitchenTicket:** queued → started → paused/resumed → ready/failed.  
  - **Валідації:** ready без started — заборонено; повторне списання при inventory_locked — заборонено; negative stock — транзакція відхиляється.
- **Логіка одиниць та батчів:**  
  - **Одиниці:** нормалізуй до Ingredient.unit_primary за rules у Ingredient.conversion.  
  - **Waste factor:** списання = рецепт × порції × (1 + waste_factor).  
  - **FEFO/FIFO:** керується прапором useExpiryPriority; fallback — списання без батча з поміткою.
- **Lifecycle hooks (Strapi v5):**  
  - **KitchenTicket.beforeUpdate:** при переході в started і inventory_locked=false — виклик StartTicket у транзакції.  
  - **OrderItem.afterUpdate:** якщо всі items ready — Order.status → ready.  
- **Сервіс StartTicket:**  
  - Дай повний каркас з утилітами normalizeToPrimaryUnit, pickBatchesFIFO_FEFO, createInventoryMovementDebit, оновлення StockBatch.remaining_quantity, створення TicketEvent.inventory_debit, встановлення inventory_locked.  
  - Обробка помилок: недостатній залишок, відсутні конверсії, заблокований тікет, некоректний статус.  
  - Повернення payload: деталізація списаних інгредієнтів із батчами та кількостями.

---

## 4. API контракти: GraphQL як основний, REST — лише системний

Використовуй Strapi v5 GraphQL. CRUD-операції тільки через GraphQL. Заборона id; використовуй documentId/slug. Persisted queries і fragments обов’язкові для ключових сценаріїв.

- **GraphQL правила:**  
  - **Використовуй:** variables, fragments, persisted queries, @include/@skip.  
  - **Не запитуй:** зайві поля (__typename, id).  
  - **Populate:** для зв’язків обов’язково.  
  - **Draft & Publish:**  
    - Якщо потрібен чистий CRUD: draftAndPublish=false.  
    - Якщо увімкнено draftAndPublish: перевіряй, що update не створює draft; контролюй beforeUpdate; не використовуй REST PUT /api/:documentId.
- **Persisted queries:**  
  - Для меню, кухонної черги, інвентарних звітів, KPI. Дай файли *.graphql і опис їх реєстрації.
- **Приклади:**  
  - **Fragments:** MenuItemCore, KitchenTicketCore, InventoryMovementCore.  
  - **Queries:** getKitchenQueue(status), getOrderDetails(code), getStockAlerts(), getMenuByCategory(slug).  
  - **Mutations:** startKitchenTicket(ticketDocumentId, actorDocumentId), setKitchenTicketReady(ticketDocumentId), adjustInventory(ingredientDocumentId, payload).  
  - **Відповіді:** приклади JSON з реальними полями.

- **REST (дозволено):**  
  - **Лише:** healthcheck, webhooks для нотифікацій офіціанту.  
  - **Без:** бізнес CRUD.

---

## 5. Next.js 16 / React 19 фронтенд: дані, стан, UI правила

Будуй App Router, Server Components, хуки, Zustand store. Без прямих fetch у компонентах. Без pages/ і getInitialProps.

- **Дані та стан:**  
  - **Zustand:** всі бізнес-дані з GraphQL через store; persist для auth/profile; pre-computed selectors (useKitchenQueue, useStockAlerts, useOrderSummary).  
  - **Кешування:** адаптивне; очищення при зміні ролі/логіна; batching запитів; rate limiting на публічні API.  
  - **Організація запитів:** *.graphql файли або окремі хуки; заборонено inline GraphQL у JSX.
- **React/Next:**  
  - **Server Components:** для первинного рендера; **Suspense**, **useTransition**, **useOptimistic**, **useActionState**.  
  - **dynamic():** lazy loading важких модулів.
- **UI продуктивність:**  
  - **Анімації:** лише transform/opacity; заборонено анімувати box-shadow.  
  - **GPU-оптимізації:** will-change, translate3d; adaptive blur/backdrop-filter з контролем FPS і мобільним fallback.  
  - **Design tokens:** централізовані; заборонено хардкод стилів у компонентах.

- **Приклади сторінок:**  
  - **Kitchen Queue:** список тікетів, дії “Почати”/“Готово”, статуси, таймінги.  
  - **Waiter Orders:** створення замовлення, моніторинг готовності, нотифікації.  
  - **Inventory Dashboard:** залишки, батчі, alerts, рухи.  
  - **Menu Management:** CRUD MenuItem/Recipe (за ролями), версії Recipe.

---

## 6. Безпека, помилки, комплаєнс, PostgreSQL конфіг

Забезпеч безпеку і стабільність. Дай готові конфіги. Реалізуй error-handling на клієнті/сервері.

- **Аутентифікація:**  
  - JWT Bearer токени, короткий TTL для публічних терміналів; ротація токенів.  
  - RBAC: Waiter/Chef/Manager/System; перевірка прав перед кожним запитом.
- **CORS:**  
  - Строгий allowlist доменів у проді; без wildcard.
- **Rate limiting і batching:**  
  - Впровадь rate limiting для публічних GraphQL; batching для зменшення запитів.
- **Error handling:**  
  - try/catch у хука/запитах; експоненційний retry (до 3 спроб); дружні повідомлення користувачу; error boundaries на рівні маршрутів.
- **PostgreSQL конфіг:**  
  - **config/database.js** з SSL, pool min/max, опцією rejectUnauthorized.  
  - **.env (prod):** DATABASE_HOST/PORT/NAME/USERNAME/PASSWORD, SSL=true, REJECT_UNAUTHORIZED=false, POOL_MIN, POOL_MAX.  
  - PgBouncer — рекомендовано.  
  - Розділення dev/staging/prod; бекапи pg_dump + WAL; щомісячні тести відновлення.
- **Комплаєнс і аудит:**  
  - Audit-ready логи (TicketEvent, InventoryMovement, доступи в адмінці), мінімізація PII, disaster recovery runbook.

---

## 7. Тестування, якості даних, аналітика і KPI

Сформуй тест-план із покриттям транзакцій, статусів, інвентаря, аналітики, фронтенду.

- **Тест-кейси транзакцій:**  
  - **StartTicket успіх:** нормалізація одиниць, вибір батчів, створення debit рухів, payload у TicketEvent, inventory_locked=true.  
  - **StartTicket дефіцит:** atomic fail, rollback, без змін у StockBatch/InventoryMovement, повідомлення “Недостатньо інгредієнтів”.  
  - **Повторний старт:** заблоковано, помилка, без повторного списання.  
  - **Ready без started:** заблоковано; перевірка валідацій.  
  - **Adjustments:** обов’язкові reason+note; аудит.
- **Дані/конверсії:**  
  - Перевірка conversion rules (kg↔g, l↔ml); rounding; edge cases: pcs vs g.  
  - Waste_factor коректно додається до списання.
- **Аналітика/KPI:**  
  - Розрахунок Prep/Queue/Service time; SLA % у межах очікуваного; маржа: price_at_sale − собівартість; stock coverage; min_stock alerts; звіти по waste.  
  - Перевірка persisted queries для звітів.
- **Фронтенд:**  
  - Zustand persist, селектори, fallback UI, Suspense; дії Waiter/Chef; динамічні оновлення черги; нотифікації.

---

## 8. DevOps, деплой, CI/CD, інфраструктура

Підготуй інфраструктуру, скрипти, пайплайни, healthchecks.

- **Docker:**  
  - Dockerfile для Strapi; docker-compose.yml: Strapi + PostgreSQL + PgBouncer; secrets із .env; volumes для БД; healthcheck-и (readiness/liveness).  
- **CI/CD:**  
  - Перевірка schema змін (content-types), інтеграційні тести сервісу StartTicket, lint/format, збірка Next.js.  
  - Manual approval на прод; міграції схеми — через PR; rollback-план додається до кожного релізу.  
- **Моніторинг:**  
  - Метрики: CPU/RAM, connection pool, запити GraphQL, час транзакцій; алерти на помилки StartTicket, min_stock перетини.
- **Backup/DR:**  
  - pg_dump щодня; збереження в S3/Spaces; документований restore; щомісячний DR-тест.

---

## 9. Документація, артефакти, acceptance criteria

Збери повний пакет артефактів і критерії прийняття роботи. Все — у форматі md/JSON/код.

- **Артефакти, які треба надати:**  
  - **Content-type JSON:** всі колекції/компоненти з полями, зв’язками, enums, індексами.  
  - **Сервіси:** StartTicket (з кодом), утиліти одиниць/батчів/рухів; lifecycle hooks.  
  - **GraphQL:** *.graphql файли (queries/mutations/fragments), приклади відповідей; реєстрація persisted queries.  
  - **RBAC:** матриця прав (таблиця), role policies.  
  - **Next.js:** приклади сторінок/серверних компонентів, Zustand store, хуки.  
  - **PostgreSQL:** config/database.js, .env приклади, README по SSL/pool.  
  - **DevOps:** Dockerfile, docker-compose, CI/CD yaml, healthchecks, backup/restore скрипти.  
  - **Документація:** операційні runbooks (StartTicket, adjustments, FEFO/FIFO), rollback-плани, тест-план, disaster recovery, аналітика/KPI гайд.
- **Acceptance criteria (без компромісів):**  
  - **Транзакційність:** StartTicket атомарний, без повторного списання, з індикатором inventory_locked.  
  - **Аудит:** кожна дія — в TicketEvent; кожен рух — в InventoryMovement із reason/unit/batch/reference.  
  - **Статуси:** нелогічні переходи блокуються; готовність без старту — неможлива.  
  - **Одиниці:** коректні конверсії; waste_factor враховано; negative stock — транзакція відхиляється.  
  - **GraphQL:** без id; documentId/slug; populate; persisted queries; без зайвих полів.  
  - **Next.js:** App Router, Server Components, без pages/; Zustand; без прямих fetch у компонентах.  
  - **Безпека:** CORS allowlist, JWT Bearer, RBAC перевірка, rate limiting/batching.  
  - **PostgreSQL:** SSL у проді; пулінг налаштовано; розділення dev/staging/prod; бекапи/DR тести.  
  - **Перфоманс:** індекси на ключові таблиці; GPU-оптимізації в UI; мінімум overfetch.  
  - **Документація:** повні приклади, runbooks, rollback-плани, тест-кейси — надані.

---

## 10. Version enforcement і додаткові правила (суворо)

Впровадь і перевір compliance по цих пунктах на кожному етапі.

- **version_enforcement:**  
  - **Заборонено:** синтаксис Strapi v3/v4.  
  - **Обов’язково:** Strapi v5 GraphQL API; documentId або slug; populate для зв’язків; не покладатися на publishedAt або ?status=published.  
  - **React 19:** без класових компонентів.  
  - **Next.js 16:** App Router; без pages/ та getInitialProps.
- **draft_and_publish:**  
  - Якщо потрібен лише CRUD → **draftAndPublish=false**.  
  - Не покладатися на mutations, що створюють драфти замість оновлення.  
  - Перевірити lifecycle hooks: при update має викликатися beforeUpdate; не використовувати REST PUT /api/:documentId коли draftAndPublish=true.
- **strapi_graphql:**  
  - CRUD-операції тільки через GraphQL; persisted queries; fragments; variables; @include/@skip; не запитувати __typename, id.
- **permissions_roles:**  
  - Завжди перевіряти права доступу; RBAC: admin/editor/viewer мапиться на Manager/Chef/Waiter; якщо роль не визначена — доступ заборонено.
- **react_next:**  
  - Використовувати useOptimistic, useActionState, useTransition; Server Components; Suspense; dynamic() для lazy.  
  - Заборонено inline GraphQL у компонентах.
- **zustand:**  
  - Всі GraphQL дані — через Zustand store; persist для auth/profile; селектори типу useUserProfile/useCartTotal; adaptive caching з очищенням при зміні ролі.
- **ui_performance:**  
  - transform замість top/left; заборонено анімувати box-shadow; GPU-акселерація; adaptive blur і мобільний fallback; CSS variables для контролю ефектів.
- **business_logic:**  
  - Заборонено складні фільтри/сортування на клієнті; бізнес-логіка в резольверах/сервісах; компоненти — тільки UI; утиліти — в окремих модулях.
- **error_handling:**  
  - try/catch, fallback UI, error boundaries; retry 3 спроби з експоненційною затримкою; не кидати “сирі” помилки користувачу.
- **documentation_audit:**  
  - Кожен хук — документований: параметри, дані, приклад відповіді; кожен GraphQL-запит — з прикладом; централізовані design tokens; audit-логи для CRUD; rollback-інструкції для Strapi при деплойменті.
- **additional_optimizations:**  
  - GraphQL batching; rate limiting; lazy loading модалок/важких компонентів; adaptive caching у Zustand.

---

Як результат, згенеруй:

- Повний md-док з планом робіт, структурою даних, сервісами, GraphQL контрактами, фронтендом, безпекою, DevOps, тестами, аналітикою, KPI.
- Готові JSON-схеми для Strapi content-types і компонентів.
- Код каркасу сервісу StartTicket та утиліт.
- *.graphql файли (queries/mutations/fragments) з прикладами відповідей.
- Next.js сторінки/серверні компоненти/хуки даних і Zustand store.
- Dockerfile, docker-compose.yml, CI/CD yaml, backup/DR скрипти.
- Матрицю RBAC, runbooks, rollback-плани, тест-план.

Створюй без зайвих пояснень — тільки готові артефакти та чіткий план виконання.