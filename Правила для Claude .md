# Правила проєкту: Next.js 16 + React 19 + Strapi v5 + PostgreSQL для ресторанної системи

Це ультрадетальний, готовий до продакшну набір правил і стандартів. Він перевіряє на актуальність попередні пункти, усуває суперечності та додає відсутні критично важливі частини: транзакційність списання інгредієнтів, аудит подій, KPI, конфіг PostgreSQL, GraphQL стандарти, безпеку, деплой і відновлення.

---

## Обсяг і версії стеку

- **Strapi v5:** headless CMS, GraphQL API як основний, REST — лише для системних інтеграцій та healthcheck.
- **Next.js 16 / React 19:** App Router, серверні компоненти, сучасні хуки.
- **PostgreSQL:** основна БД в dev/prod; без SQLite; з SSL і пулінгом.
- **Ресторанний домен:** меню, рецепти, інгредієнти, партії, замовлення, кухонні тікети, рухи інвентаря, повна історія подій.
- **Головний принцип:** всі бізнес-операції з інвентарем та статусами виконуються транзакційно, з аудитом і відкатом.

> Узгодження з попередніми правилами: ми залишаємо GraphQL як основний протокол. REST не заборонений повністю — дозволений для технічних ендпоінтів (healthcheck, webhooks), без CRUD над бізнес-даними.

---

## Архітектура даних і транзакційні правила

#### Базові колекції Strapi v5

- **MenuItem:** позиція меню; зв’язок 1–1 з Recipe; категорії, ціна, активність.
- **Recipe:** техкарта; версії; статуси draft/approved/archived; інгредієнти та кроки.
- **RecipeIngredient (collection):** інгредієнт + кількість + unit + waste_factor; повна історія.
- **RecipeStep (collection):** впорядковані кроки з очікуваним часом.
- **Ingredient:** первинна одиниця зберігання, конверсії одиниць, поріг мінімальних запасів, алергени.
- **StockBatch:** партії інгредієнтів; FIFO/FEFO; собівартість; залишок.
- **Order:** замовлення; статусний ланцюжок new → in_kitchen → ready → served → canceled.
- **OrderItem:** позиція замовлення; ціна на момент продажу; модифікатори; зв’язок з KitchenTicket.
- **KitchenTicket:** виробнича картка; статуси queued → started → paused/resumed → ready/failed; призначений кухар; індикатор inventory_locked.
- **TicketEvent:** повний аудит дій (created/started/inventory_debit/ready/failed/canceled); actor; payload.
- **InventoryMovement:** рухи запасів (debit/credit/adjustment/waste); причина; посилання на батч і тікет.
- **MenuCategory, Table, Supplier (optional):** структурування меню, зали, постачальники.

#### Ключові транзакційні правила

- **Списання при “Почати”:** лише через сервіс StartTicket в одній транзакції:
  - **Кроки:** нормалізація одиниць → множення на кількість порцій → врахування waste_factor → підбір батчів FIFO/FEFO → створення дебіт-рухів по кожному батчу → оновлення remaining_quantity → фіксація TicketEvent inventory_debit → встановлення inventory_locked.
  - **Заборона:** повторне списання якщо inventory_locked = true.
  - **Відмова:** транзакція відхиляється при недостатньому залишку (atomic fail).
- **FEFO/FIFO вибір:** конфігується прапором useExpiryPriority; якщо true — спершу списуємо з найранішим expiry_at.
- **Одиниці:** всі обміри приводяться до Ingredient.unit_primary згідно Ingredient.conversion.
- **Коригування:** будь-які manual adjustments в інвентарі — тільки з reason та note; audit-лог обов’язковий.
- **Готовність:** KitchenTicket.ready не дозволений без попереднього started; Order.status → ready лише якщо всі OrderItem.ready.

#### Валідації і індекси

- **Валідації:** Recipe.approved — редагується лише через нову версію; неможливі нелогічні переходи статусів; конверсії одиниць узгоджені; negative stock — заборонено.
- **Індекси:** KitchenTicket.status, Order.status, StockBatch.expiry_at, InventoryMovement.created_at, MenuItem.slug, RecipeIngredient.recipe+ingredient.

---

## PostgreSQL: продакшн конфіг і середовища

#### Конфіг Strapi v5

```js
// config/database.js
module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      host: env('DATABASE_HOST', 'localhost'),
      port: env.int('DATABASE_PORT', 5432),
      database: env('DATABASE_NAME', 'mydb'),
      user: env('DATABASE_USERNAME', 'myuser'),
      password: env('DATABASE_PASSWORD', 'mypassword'),
      ssl: env.bool('DATABASE_SSL', true)
        ? { rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', true) }
        : false,
    },
    pool: { min: env.int('DATABASE_POOL_MIN', 2), max: env.int('DATABASE_POOL_MAX', 10) },
  },
});
```

```bash
# .env (prod)
DATABASE_HOST=prod-db-host
DATABASE_PORT=5432
DATABASE_NAME=mydb
DATABASE_USERNAME=myuser
DATABASE_PASSWORD=mypassword
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=false
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=15
```

- **SSL:** увімкнено в продакшн, з параметром rejectUnauthorized для керування self-signed.
- **Пулінг:** налаштувати PgBouncer або збільшити pool у пікові години; тримати connection limits під контролем.
- **Розділення середовищ:** окремі dev/staging/prod бази; ніколи не мігрувати дані через SQLite.

#### Бекапи і міграції

- **Бекапи:** щоденні dumps (pg_dump) і журналування WAL; тест відновлення щонайменше раз на місяць.
- **Міграції контенту:** Strapi content-type schema під контролем версій; зміни — через PR, з описом rollback.

---

## API протоколи: GraphQL як норма, REST для системних задач

#### Узгоджена позиція

- **GraphQL:** основний для CRUD, складних реляцій і аналітики. Використовуємо variables, fragments, persisted queries, @include/@skip; не запитуємо зайві поля.
- **REST:** дозволено для healthcheck, webhooks, інфраструктурних сигналів; не використовуємо для бізнес CRUD (окрім винятків, описаних у сервісній інтеграції).

#### GraphQL стандарти

- **Документи:** використовуємо documentId або slug для адресації; не покладаємось на числові id.
- **Draft & Publish:** якщо потрібен чистий CRUD без редакційного потоку — draftAndPublish: false у schema; якщо увімкнено — уважно тестуємо mutations, щоб не створювали драфти замість оновлення.
- **Persisted queries:** реєструємо для критичних маршрутів (меню, кухонна черга, аналітика).
- **Приклад фрагмента:**
```graphql
fragment MenuItemCore on MenuItem {
  documentId
  name
  slug
  price
  active
  category { name slug }
}
```

---

## Ролі, доступи і аудит

#### RBAC

- **Waiter:** створює Order/OrderItem; читає MenuItem/Recipe; змінює Order.status → served.
- **Chef:** змінює KitchenTicket.status; читає Recipe/Ingredients; тригерить StartTicket; редагує Recipe лише в draft/approved з контролем версій.
- **Manager:** повний CRUD на MenuItem/Recipe/Ingredient/StockBatch/MenuCategory/Table/Supplier; читає аналітику; затверджує рецепти.
- **System (service):** єдиний доступ до InventoryMovement і транзакційних операцій через сервісні ключі.

#### Аудит і події

- **TicketEvent:** всі виробничі дії фіксуються з actor і payload; неприпустимо виконання “тихих” операцій.
- **InventoryMovement:** кожен рух має reason, unit, batch, reference_ticket; будь-які коригування — тільки з поясненням.
- **Логи доступу:** зберігаємо хто, коли і що змінював (адмін-панель Strapi + власні події).

---

## Логіка ресторану: стейт-машини, KPI та інструменти

#### Статуси і переходи

- **Order:** new → in_kitchen → ready → served → canceled.
- **OrderItem:** queued → cooking → ready → canceled.
- **KitchenTicket:** queued → started → paused/resumed → ready/failed.

> **Валідація:** переходи лише згідно таблиці дозволених; готовність без старту — заборонена; повторне списання — блоковане.

#### KPI та аналітика

- **Prep time:** ready_at − started_at.
- **Queue time:** started_at − created_at.
- **Service time:** served_at − ready_at.
- **Собівартість:** середньозважена або остання партія; фіксована для MenuItem, якщо cost_method = fixed_cost.
- **Маржа:** price_at_sale − собівартість.
- **Запаси:** stock coverage = current_stock / середнє добове списання.
- **Alerts:** min_stock_level перетини; батчі, що наближаються до expiry.

#### Webhooks і нотифікації

- **Кухня → офіціант:** подія KitchenTicket.ready шле webhook у фронт черги.
- **Запаси:** досягнення порогів — подія для Manager.

---

## Фронтенд правила: Next.js 16, React 19, Zustand

#### Next.js і React

- **App Router:** без pages/ та getInitialProps.
- **Server Components:** для первинних даних; **Suspense** для асинхронності; **useTransition/useOptimistic/useActionState** для UX.
- **dynamic():** для лінивого завантаження важких модулів; обережно з клієнтськими залежностями.

#### Дані і стан

- **Zustand:** всі бізнес-дані з GraphQL проходять через store; **persist** для auth та профілю; селектори типу useKitchenQueue(), useStockAlerts().
- **Заборона:** прямі fetch у компонентах.
- **Кешування:** адаптивне; очищення при зміні ролі або логіна.
- **Persisted queries:** з Apollo/urql або власний транспорт; не хардкодимо запити в JSX — окремі .graphql файли або хуки.

#### UI продуктивність

- **Анімації:** transform/opacity; **заборонено:** анімувати box-shadow.
- **GPU hints:** will-change, translate3d; adaptive blur/backdrop-filter з контролем FPS.
- **Design tokens:** централізовано (кольори, spacing, типографіка); заборонено хардкод стилів.

---

## Обробка помилок, безпека і комплаєнс

#### Помилки

- **try/catch:** у всіх хука/запитах; експоненційний retry (до 3 спроб).
- **Fallback UI:** для критичних секцій; error boundaries на рівні маршрутів.
- **Повідомлення:** користувач завжди отримує дружнє пояснення; логи — без чутливих даних.

#### Безпека

- **JWT:** Bearer у headers; ротація; короткий TTL для публічних терміналів.
- **Rate limiting:** для публічних API; GraphQL batching для ефективності.
- **CORS:** чіткі allowlist доменів; заборона wildcard у проді.
- **Secrets:** лише через .env; без витоків у клієнт; перевірка CI.

#### Комплаєнс і аудит

- **Audit-ready:** логи TicketEvent/InventoryMovement; контроль доступу; опис rollback.
- **PII і чекові дані:** мінімізуємо зберігання; шифруємо, якщо потрібно.
- **Відновлення:** документована процедура disaster recovery.

---

## Стандарти розробки, деплой і відновлення

#### Version enforcement

- **Strapi v5 API:** без синтаксису v3/v4; populate для зв’язків; documentId/slug, а не id; без залежності від publishedAt.
- **React 19:** без класових компонентів; сучасні хуки тільки.
- **Next.js 16:** App Router; без legacy pages.

#### Draft & Publish

- **CRUD-only сценарії:** draftAndPublish: false у schema JSON.
- **Редакційний потік:** якщо увімкнено — тестуємо життєві цикли (beforeUpdate замість beforeCreate/delete), перевіряємо, що mutations не створюють драфти несподівано.

#### Деплой

- **Контейнери:** Docker для Strapi + PostgreSQL; чіткі healthcheck-и; readiness/liveness.
- **CI/CD:** перевірка схем, міграцій, інтеграційних тестів; manual approval для прод.
- **Навантаження:** налаштування пулів, PgBouncer; скейл по CPU/RAM; моніторинг метрик.

#### Відновлення і rollback

- **Rollback інструкції:** для Strapi schema і БД змін; на кожен реліз — план відкату.
- **Restore тести:** регулярні, сценарій на вибірку найбільш критичних таблиць (Order, InventoryMovement, StockBatch).

---

## Розширення попередніх правил: що змінено і додано

- **REST vs GraphQL:** замість повної заборони REST — дозволено для системних ендпоінтів; CRUD бізнес-даних — через GraphQL.
- **documentId/slug:** суворо; відмова від id зменшує ризики колізій і міграційних помилок.
- **Транзакційність інвентаря:** додано обов’язкову транзакцію StartTicket з atomic fail при дефіциті запасів; індикатор inventory_locked.
- **FEFO/FIFO:** конфігурабельний режим списання батчів.
- **Собівартість:** вибір між середньозваженою та останньою партією; фіксована собівартість для окремих MenuItem за потреби.
- **RBAC уточнення:** System роль має монопольний доступ до InventoryMovement сервісів; Manager затверджує рецепти.
- **Аудит:** обов’язкові TicketEvent/InventoryMovement з деталями; заборона “тихих” операцій.
- **Design tokens і продуктивність:** додані вимоги до UI, GPU-оптимізацій, адаптивних ефектів.
- **Бекапи/DR:** конкретизовано періодичність і тестування відновлення.
- **Документація:** на кожен хук/запит — приклади відповіді; rollback інструкції; persisted queries реєстрація.

---

## Готові артефакти для інтеграції

#### Приклад Next.js запиту GraphQL (серверний компонент)

```tsx
// app/kitchen/page.tsx (Server Component)
import { graphqlClient } from '@/lib/graphql';
import { GET_KITCHEN_QUEUE } from '@/graphql/kitchenQueue.gql';

export default async function KitchenQueuePage() {
  const data = await graphqlClient.request(GET_KITCHEN_QUEUE, { status: 'queued' });
  return <KitchenQueue data={data} />;
}
```

```graphql
# graphql/kitchenQueue.gql
query GetKitchenQueue($status: KitchenTicketStatus!) {
  kitchenTickets(filters: { status: { eq: $status } }) {
    data {
      documentId
      attributes {
        status
        started_at
        order_item {
          data {
            attributes {
              quantity
              menu_item {
                data { attributes { name slug price } }
              }
            }
          }
        }
      }
    }
  }
}
```

#### Скелет сервісу StartTicket у Strapi v5

```js
// src/api/kitchen-ticket/services/start-ticket.js
module.exports = ({ strapi }) => ({
  async start(ticketDocumentId, actorDocumentId) {
    return await strapi.db.connection.transaction(async (trx) => {
      const ticket = await strapi.entityService.findOne('api::kitchen-ticket.kitchen-ticket', ticketDocumentId, {
        populate: { order_item: { populate: { menu_item: { populate: { recipe: { populate: { ingredients: true } } } } } } },
        transacting: trx,
      });

      if (!ticket || ticket.status !== 'queued' || ticket.inventory_locked) {
        throw new Error('Invalid ticket state');
      }

      const orderItem = ticket.order_item;
      const recipeIngredients = orderItem.menu_item.recipe.ingredients;

      const debitPayload = [];
      for (const ri of recipeIngredients) {
        const targetQtyPrimary = normalizeToPrimaryUnit(ri, orderItem.quantity);
        const batches = await pickBatchesFIFO_FEFO(ri.ingredient, targetQtyPrimary, trx);
        for (const b of batches) {
          await createInventoryMovementDebit(ri.ingredient, b, targetQtyPrimaryPart(b), ticketDocumentId, trx);
          debitPayload.push({ ingredient: ri.ingredient.documentId, batch: b.documentId, qty: targetQtyPrimaryPart(b) });
        }
      }

      await strapi.entityService.update('api::kitchen-ticket.kitchen-ticket', ticketDocumentId, {
        data: { status: 'started', started_at: new Date(), inventory_locked: true },
        transacting: trx,
      });

      await strapi.entityService.create('api::ticket-event.ticket-event', {
        data: { kitchen_ticket: ticketDocumentId, type: 'inventory_debit', actor: actorDocumentId, payload: debitPayload },
        transacting: trx,
      });

      return { ok: true, payload: debitPayload };
    });
  },
});
```

> **Примітка:** normalizeToPrimaryUnit, pickBatchesFIFO_FEFO, createInventoryMovementDebit — утиліти/сервіси з перевіркою конверсій, залишків і оновленням remaining_quantity.

---

## Checklists для рев’ю і продакшн-готовності

- **Дані:**
  - **Перевірено:** всі контент-типи і зв’язки створені.
  - **Узгоджено:** unit_primary і conversion для кожного Ingredient.
  - **Рецепти:** статуси/версії, waste_factor заповнено.
- **Транзакції:**
  - **StartTicket:** атомарне списання; заборона повторного дебету.
  - **Валідації:** нелогічні переходи статусів блокуються.
- **GraphQL:**
  - **Persisted queries:** для критичних маршрутів.
  - **Fragments:** спільні структури; без зайвих полів.
- **Безпека:**
  - **JWT:** ротація; короткий TTL.
  - **CORS:** allowlist; без wildcard у проді.
  - **Rate limiting:** увімкнено для публічних ендпоінтів.
- **Бекапи:**
  - **pg_dump:** щоденно; DR тест пройдено.
- **UI/UX:**
  - **Design tokens:** є; без інлайн стилів.
  - **Анімації:** transform/opacity; без box-shadow.
- **Документація:**
  - **Hooks:** параметри + приклади відповіді.
  - **Rollback:** для кожної зміни схеми.

---
