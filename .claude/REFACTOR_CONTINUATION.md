# План продовження рефакторингу Restaurant OS

> **Створено:** 2026-01-11
> **Контекст:** Після завершення Phase 7, залишились Phase 2 та частина Phase 3
> **Оригінальний план:** `.claude/plans/polymorphic-weaving-mango.md`
> **Архітектура:** `.claude/ARCHITECTURE.md` (v4.1)

---

## Статус фаз

| Фаза | Опис | Статус | Примітки |
|------|------|--------|----------|
| 1 | Конфігурації | ✅ Done | station-config, action-type-config, i18n-labels, formatters |
| 2 | Storage duplicates | ❌ TODO | 3 пари дублікатів |
| 3 | Split components | 🔄 Partial | history done, 2 компоненти залишились |
| 4 | GraphQL | ✅ Done | 8 domain files |
| 5 | Types | ✅ Done | 7 domain files |
| 6 | Hooks | ⏭️ Skip | Добре структуровані |
| 7 | Backend | ✅ Done | enums.ts, lifecycle-helpers.ts |
| 8 | Docs | ✅ Done | Architecture.md v4.1 |

---

## TODO: Phase 2 - Storage Duplicates

### 2.1 batches-list consolidation

**Файли:**
- `frontend/src/features/storage/batches-list.tsx` (~580 LOC)
- `frontend/src/features/storage/batches-list-optimized.tsx` (~580 LOC) - ВИДАЛИТИ

**Завдання:**
1. Порівняти обидва файли, визначити різницю
2. Створити єдиний компонент з props для різних режимів
3. Оновити імпорти в інших файлах
4. Видалити `batches-list-optimized.tsx`

**Структура після рефакторингу:**
```
features/storage/components/
├── batches-list/
│   ├── index.tsx           # Головний компонент
│   ├── batch-row.tsx       # Рядок таблиці
│   ├── batch-filters.tsx   # Фільтри
│   └── types.ts            # Типи
```

### 2.2 storage-history consolidation

**Файли:**
- `frontend/src/features/storage/storage-history-list.tsx` (~330 LOC)
- `frontend/src/features/storage/storage-history-optimized.tsx` (~330 LOC) - ВИДАЛИТИ

**Завдання:**
1. Об'єднати в один компонент
2. Видалити дублікат

### 2.3 category-filter consolidation

**Файли:**
- `frontend/src/features/storage/category-filter.tsx` (~350 LOC)
- `frontend/src/features/storage/category-filter-minimal.tsx` (~350 LOC) - ВИДАЛИТИ

**Завдання:**
1. Створити єдиний компонент з варіантами (horizontal/dropdown)
2. Можливо створити hook `useCategoryFilter()` для логіки
3. Видалити дублікат

---

## TODO: Phase 3 - Split Large Components

### 3.1 station-queue.tsx (~1465 LOC → ~500 LOC)

**Файл:** `frontend/src/features/kitchen/station-queue.tsx`

**Вже зроблено:**
- `station-queue-config.ts` - типи, константи ✅
- `hooks/use-task-timers.ts` - таймери ✅
- `components/table-session-timer.tsx` ✅

**Залишилось створити:**
```
features/kitchen/components/
├── task-item-row.tsx       # Рядок задачі в черзі
├── table-group-card.tsx    # Картка групи по столу
├── station-header.tsx      # Заголовок станції
├── station-stats.tsx       # Статистика станції
└── all-kitchen-view.tsx    # Вигляд "Вся кухня"
```

**Кроки:**
1. Витягнути `TaskItemRow` компонент (~150 LOC)
2. Витягнути `TableGroupCard` компонент (~200 LOC)
3. Витягнути `StationHeader` та `StationStats` (~100 LOC)
4. Витягнути `AllKitchenView` (~200 LOC)
5. Оновити головний компонент для використання sub-components

### 3.2 planned-orders-view.tsx (~1585 LOC → ~600 LOC)

**Файл:** `frontend/src/features/orders/planned-orders-view.tsx`

**Вже зроблено:**
- `planned-orders-config.ts` - типи, константи ✅
- `components/view-order-dialog.tsx` ✅

**Залишилось створити:**
```
features/orders/components/
├── planned-order-card.tsx    # Картка замовлення
├── planned-order-item.tsx    # Елемент в картці
├── event-dialog.tsx          # Діалог створення події
├── timeline-view.tsx         # Вигляд таймлайну
├── date-picker-strip.tsx     # Вибір дати
└── order-filters.tsx         # Фільтри
```

**Кроки:**
1. Витягнути `PlannedOrderCard` (~250 LOC)
2. Витягнути `PlannedOrderItem` (~100 LOC)
3. Витягнути `CreateOrderDialog` / `EventDialog` (~200 LOC)
4. Витягнути `TimelineView` (~150 LOC)
5. Оновити головний компонент

---

## TODO: Fix Pre-existing TypeScript Errors

### Error 1: API Routes (Next.js 15 async params)

**Файли:**
```
src/app/api/storage/batches/[documentId]/consume/route.ts
src/app/api/storage/batches/[documentId]/lock/route.ts
src/app/api/storage/batches/[documentId]/process/route.ts
src/app/api/storage/batches/[documentId]/unlock/route.ts
src/app/api/storage/batches/[documentId]/write-off/route.ts
```

**Проблема:**
```typescript
// Старий синтаксис (Next.js 14)
export async function POST(
  request: Request,
  { params }: { params: { documentId: string } }
)

// Новий синтаксис (Next.js 15)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;
  // ...
}
```

### Error 2: Type naming in use-storage.tsx

**Файл:** `src/hooks/use-storage.tsx:56`

**Проблема:**
```typescript
// Неправильно
import type { StorageBatchStatus } from "@/types/fsm";

// Правильно
import type { StorageBatchState } from "@/types/fsm";
```

---

## Порядок виконання

```
1. [15 хв] Fix TypeScript errors
   ├── API routes async params (5 файлів)
   └── StorageBatchStatus → StorageBatchState

2. [2 год] Phase 2: Storage duplicates
   ├── batches-list consolidation
   ├── storage-history consolidation
   └── category-filter consolidation

3. [2 год] Phase 3.1: station-queue.tsx
   ├── TaskItemRow
   ├── TableGroupCard
   ├── StationHeader + StationStats
   └── AllKitchenView

4. [2 год] Phase 3.2: planned-orders-view.tsx
   ├── PlannedOrderCard
   ├── PlannedOrderItem
   ├── EventDialog
   └── TimelineView

5. [30 хв] Final review
   ├── Architecture.md update
   ├── TypeScript check
   └── Build verification
```

**Загальний час:** ~7 годин

---

## Команди для перевірки

```bash
# TypeScript check
cd frontend && npx tsc --noEmit

# Build check
cd frontend && yarn build

# Backend check
cd backend && npx tsc --noEmit
```

---

## Файли створені в Phase 7 (для контексту)

**Backend:**
- `backend/src/utils/enums.ts` (~580 LOC) - всі enum'и
- `backend/src/utils/lifecycle-helpers.ts` (~350 LOC) - factory functions

**Оптимізовані lifecycle файли:**
- `ingredient/lifecycles.ts` (83→8 LOC)
- `supplier/lifecycles.ts` (103→20 LOC)
- `recipe/lifecycles.ts` (120→18 LOC)
- `menu-item/lifecycles.ts` (83→10 LOC)
- `menu-category/lifecycles.ts` (101→24 LOC)

---

## Quick Start для наступної сесії

```
Прочитай .claude/REFACTOR_CONTINUATION.md та продовж рефакторинг:
1. Виправ TypeScript помилки
2. Phase 2: консолідуй storage duplicates
3. Phase 3: розбий station-queue.tsx та planned-orders-view.tsx
```
