# Глибокий аналіз системи стилів Restaurant OS

## 📋 Зміст

1. [Архітектура стилів](#архітектура-стилів)
2. [Шари стилізації](#шари-стилізації)
3. [Design Tokens](#design-tokens)
4. [Tailwind CSS конфігурація](#tailwind-css-конфігурація)
5. [Паттерни стилізації компонентів](#паттерни-стилізації-компонентів)
6. [Стилізація сторінок](#стилізація-сторінок)
7. [Гнучкість та можливості змін](#гнучкість-та-можливості-змін)

---

## Архітектура стилів

### Загальна структура

Проект використовує **гібридний підхід** до стилізації, що поєднує:

1. **Design Tokens** (TypeScript) - єдине джерело правди для дизайн-значень
2. **CSS Custom Properties** - для runtime theming та динамічних змін
3. **Tailwind CSS** - utility-first підхід для швидкої розробки
4. **Global CSS** - базові стилі та утиліти
5. **Component-level стилі** - через className та CVA (Class Variance Authority)

### Файлова структура

```
src/
├── styles/
│   ├── design-system.css          # Глобальні CSS змінні та базові стилі
│   ├── theme/
│   │   └── theme-provider.tsx     # React контекст для теми
│   └── tokens/
│       ├── index.ts               # Експорт всіх токенів
│       ├── colors.ts               # Кольорові токени
│       ├── typography.ts           # Типографічні токени
│       ├── spacing.ts              # Відступи
│       ├── radius.ts               # Радіуси
│       ├── shadows.ts              # Тіні
│       └── motion.ts               # Анімації
├── app/
│   ├── globals.css                 # Tailwind directives + базові стилі
│   └── layout.tsx                  # Глобальний layout з шрифтом
└── components/
    └── ui/                         # Базові UI компоненти з CVA
```

---

## Шари стилізації

### 1. Глобальний рівень (Global Layer)

#### `src/app/globals.css`
- **Tailwind directives**: `@tailwind base`, `@tailwind components`, `@tailwind utilities`
- **CSS Custom Properties** для Tailwind theme (HSL формат)
- **Base styles** для body, html, focus states
- **Component layer** з утилітарними класами (`.btn-touch`, `.card-elevated`, `.status-dot`)
- **Utilities layer** з кастомними утилітами (`.focus-ring`, `.active-scale`, `.gradient-fade-*`)

**Ключові особливості:**
```css
@layer base {
  :root {
    --background: 30 25% 96%;  /* HSL формат для Tailwind */
    --foreground: 0 0% 10%;
    --primary: 125 26% 39%;
    /* ... */
  }
  
  body {
    @apply bg-background text-foreground antialiased;
  }
}
```

#### `src/styles/design-system.css`
- **CSS Custom Properties** згенеровані з design tokens
- **Базові reset стилі**
- **Типографічні утиліти** (`.text-display-lg`, `.text-heading-md`, `.text-body-*`)
- **Анімації** з підтримкою `prefers-reduced-motion`

**Два джерела CSS змінних:**
1. `globals.css` - для Tailwind (HSL формат)
2. `design-system.css` - для прямих CSS використань (hex формат)

### 2. Рівень Design Tokens

#### Структура токенів

**Примітивні токени** (Primitive Tokens):
- Базові значення без семантики
- Приклад: `cream[200]`, `sage[600]`, `ink[950]`

**Семантичні токени** (Semantic Tokens):
- Значення з контекстом використання
- Приклад: `colors.background.primary`, `colors.brand.primary`, `colors.semantic.success`

**Типи токенів:**
- `colors` - кольори (примітивні + семантичні)
- `typography` - шрифти, розміри, ваги
- `spacing` - відступи (4px base grid)
- `radius` - радіуси закруглень
- `shadows` - тіні з теплими відтінками
- `motion` - тривалість, easing, анімації

### 3. Рівень Tailwind конфігурації

#### `tailwind.config.ts`

**Розширення теми:**
- Кольори з семантичними назвами (`primary`, `secondary`, `success`, `warning`, `danger`, `info`)
- Spacing з safe-area підтримкою
- Touch-friendly розміри (`min-h-touch`, `min-w-touch`)
- Responsive типографія (`mobile-xs`, `mobile-sm`, etc.)
- Кастомні анімації (`slide-in-right`, `pulse-soft`, `shake`)
- Border radius та box shadows

**Особливості:**
- Mobile-first підхід
- Dark mode через `class` стратегію
- Контент сканування для всіх компонентів

### 4. Рівень компонентів

#### Паттерни стилізації компонентів

**A. UI компоненти з CVA (Class Variance Authority)**

Приклад: `src/components/ui/button.tsx`

```typescript
const buttonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center...",
  {
    variants: {
      variant: { default, destructive, outline, ... },
      size: { default, sm, lg, xl, icon, touch }
    }
  }
);
```

**Переваги:**
- Типобезпечні варіанти
- Автоматичне об'єднання класів через `cn()` utility
- Легко додавати нові варіанти

**B. Feature компоненти з комбінацією підходів**

Приклад: `src/features/menu/menu-item-card.tsx`

```typescript
<Card
  className={cn(
    "relative overflow-hidden transition-all duration-200",
    "hover:shadow-card-hover flex flex-col h-full",
    !item.available && "opacity-60",
    quantity > 0 && "ring-2 ring-primary",
    className
  )}
>
```

**Паттерни:**
- Комбінація Tailwind utilities
- Умовні класи через `cn()`
- Використання семантичних кольорів (`ring-primary`, `bg-card`)
- Responsive класи (`md:text-base`, `md:p-6`)

**C. Атомарні компоненти**

Приклад: `src/components/atoms/button/button.tsx`

- Більш детальна реалізація з hardcoded кольорами
- Використовує прямі hex значення замість токенів
- Більше варіантів та функціональності

### 5. Рівень сторінок

#### Паттерни стилізації сторінок

**Приклад: `src/app/page.tsx`**

```typescript
<div className="min-h-screen bg-background flex flex-col">
  <header className="border-b px-4 py-6 text-center safe-top">
    <h1 className="text-3xl font-bold text-primary mb-2">
```

**Характеристики:**
- Використання семантичних кольорів (`bg-background`, `text-primary`)
- Safe area підтримка (`safe-top`, `safe-bottom`)
- Responsive spacing (`px-4`, `md:p-8`)
- Layout utilities (`flex`, `flex-col`, `grid`)

**Приклад: `src/app/dashboard/admin/page.tsx`**

```typescript
<div className="flex flex-col min-h-screen bg-background">
  <header className="sticky top-0 z-40 bg-background border-b...">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
```

**Паттерни:**
- Композиція з feature компонентів
- Grid layouts з responsive breakpoints
- Умовні стилі на основі стану (`isLoading`)

---

## Design Tokens

### Кольори (Colors)

#### Структура

```typescript
colors = {
  background: { primary, secondary, tertiary, inverse, disabled },
  foreground: { primary, secondary, tertiary, inverse, disabled },
  brand: { primary, primaryHover, primaryActive, primaryLight, ... },
  semantic: { success, warning, error, info, ... },
  border: { primary, secondary, focus, error },
  interactive: { hover, active, selected, disabled },
  overlay: { light, dark, heavy }
}
```

#### Філософія кольорів

- **Тепла палітра**: кремові фони замість холодних сірих
- **М'які акценти**: sage green та blush pink замість агресивних кольорів
- **Семантика**: чіткі кольори для статусів (success, warning, error)

#### Використання

**В Tailwind:**
```typescript
className="bg-primary text-primary-foreground"
className="border-danger text-danger"
```

**В CSS:**
```css
background-color: var(--color-brand-primary);
color: var(--color-fg-primary);
```

**В компонентах:**
```typescript
// Прямі значення (не рекомендовано, але іноді використовується)
className="bg-[#4A7C4E]"
```

### Типографія (Typography)

#### Структура

```typescript
typography = {
  fontFamily: { sans, mono },
  fontWeight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
  fontSize: {
    display: { "2xl", xl, lg },
    heading: { xl, lg, md, sm },
    body: { lg, md, sm, xs },
    ui: { lg, md, sm, xs }
  },
  lineHeight: { none, tight, snug, normal, relaxed, loose },
  letterSpacing: { tighter, tight, normal, wide, wider, widest },
  textStyles: { displayLarge, headingXL, bodyMedium, ... }
}
```

#### Fluid Typography

Використовується `clamp()` для responsive типографії:

```typescript
fontSize.display["2xl"] = "clamp(2.5rem, 5vw, 4rem)"  // 40-64px
fontSize.heading.lg = "clamp(1.25rem, 2vw, 1.5rem)"    // 20-24px
```

#### Використання

**В Tailwind:**
```typescript
className="text-mobile-xl font-semibold"
className="text-heading-lg"
```

**В CSS:**
```css
.text-display-lg {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: var(--font-weight-bold);
}
```

### Відступи (Spacing)

#### 4px Base Grid

```typescript
spacing = {
  1: "0.25rem",   // 4px
  2: "0.5rem",    // 8px
  4: "1rem",      // 16px - base unit
  8: "2rem",      // 32px
  11: "2.75rem",  // 44px - minimum touch target
  // ...
}
```

#### Семантичні відступи

```typescript
semanticSpacing = {
  component: { xs, sm, md, lg, xl },
  gap: { xs, sm, md, lg, xl, "2xl" },
  section: { xs, sm, md, lg, xl },
  touch: { minTarget: 44px, comfortable: 48px, large: 56px },
  safe: { top, bottom, left, right }
}
```

#### Використання

**В Tailwind:**
```typescript
className="p-4 gap-2"
className="min-h-touch"  // 44px
className="safe-top"
```

### Тіні (Shadows)

#### Теплі тіні

Використовується теплий коричнево-сірий замість чорного:

```typescript
shadowColor = "45 40 35"  // HSL-compatible RGB

shadows = {
  xs: "0 1px 2px rgba(45, 40, 35, 0.04)",
  sm: "0 1px 3px rgba(45, 40, 35, 0.06)...",
  md: "0 4px 6px rgba(45, 40, 35, 0.05)...",
  // ...
}
```

#### Семантичні тіні

```typescript
semanticShadows = {
  card: { flat, raised, floating },
  interactive: { default, hover, active },
  overlay: { dropdown, modal, tooltip },
  input: { default, focus, error }
}
```

#### Використання

**В Tailwind:**
```typescript
className="shadow-card"
className="hover:shadow-card-hover"
```

**В CSS:**
```css
box-shadow: var(--shadow-md);
```

### Анімації (Motion)

#### Тривалість та easing

```typescript
duration = {
  instant: "0ms",
  fast: "150ms",
  normal: "200ms",
  slow: "300ms"
}

easing = {
  out: "cubic-bezier(0.0, 0.0, 0.2, 1)",
  in: "cubic-bezier(0.4, 0.0, 1, 1)",
  inOut: "cubic-bezier(0.4, 0.0, 0.2, 1)",
  spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)"
}
```

#### Keyframes

```typescript
keyframes = {
  fadeIn, fadeOut,
  slideInFromRight, slideInFromBottom,
  scaleIn, pulse, shake, spin, shimmer
}
```

#### Підтримка reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Tailwind CSS конфігурація

### Розширення теми

#### Кольори

```typescript
colors: {
  background: "#F8F4F2",
  foreground: "#1A1A1A",
  primary: {
    DEFAULT: "#4A7C4E",
    light: "#CDE4C1",
    foreground: "#FFFFFF"
  },
  // Семантичні кольори
  success: { DEFAULT: "#22C55E", light: "#DCFCE7" },
  warning: { DEFAULT: "#F59E0B", light: "#FEF3C7" },
  danger: { DEFAULT: "#EF4444", light: "#FEE2E2" },
  info: { DEFAULT: "#3B82F6", light: "#DBEAFE" }
}
```

#### Spacing

```typescript
spacing: {
  "safe-bottom": "env(safe-area-inset-bottom)",
  "safe-top": "env(safe-area-inset-top)"
}
```

#### Touch-friendly розміри

```typescript
minHeight: { "touch": "44px" },
minWidth: { "touch": "44px" }
```

#### Responsive типографія

```typescript
fontSize: {
  "mobile-xs": ["0.75rem", { lineHeight: "1rem" }],
  "mobile-sm": ["0.875rem", { lineHeight: "1.25rem" }],
  // ...
}
```

#### Анімації

```typescript
keyframes: {
  "slide-in-right": { "0%": { transform: "translateX(100%)" }, ... },
  "pulse-soft": { "0%, 100%": { opacity: "1" }, ... }
},
animation: {
  "slide-in-right": "slide-in-right 0.3s ease-out",
  // ...
}
```

#### Box shadows

```typescript
boxShadow: {
  "card": "0 2px 8px rgba(0, 0, 0, 0.08)",
  "card-hover": "0 4px 16px rgba(0, 0, 0, 0.12)",
  "floating": "0 8px 32px rgba(0, 0, 0, 0.16)"
}
```

---

## Паттерни стилізації компонентів

### 1. CVA (Class Variance Authority) компоненти

**Структура:**

```typescript
const componentVariants = cva(
  // Base classes (завжди застосовуються)
  "base-class-1 base-class-2",
  {
    variants: {
      variant: {
        option1: "variant-classes",
        option2: "other-variant-classes"
      },
      size: {
        sm: "size-small-classes",
        lg: "size-large-classes"
      }
    },
    defaultVariants: {
      variant: "option1",
      size: "sm"
    }
  }
);

// Використання
<Component className={cn(componentVariants({ variant, size, className }))} />
```

**Приклади:**
- `src/components/ui/button.tsx` - базовий UI компонент
- `src/components/atoms/button/button.tsx` - розширений компонент

### 2. Композиція класів через `cn()`

**Утиліта `cn()`:**
```typescript
// src/lib/utils.ts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Використання:**
```typescript
className={cn(
  "base-classes",
  condition && "conditional-classes",
  variant === "primary" && "variant-classes",
  className  // Дозволяє перевизначити ззовні
)}
```

### 3. Умовна стилізація

**Паттерни:**

```typescript
// Бінарні умови
!item.available && "opacity-60"
quantity > 0 && "ring-2 ring-primary"

// Тернарні оператори
status === "ready" ? "bg-success" : "bg-warning"

// Об'єкти конфігурації
const statusColors = {
  good: "border-l-success",
  normal: "border-l-info",
  warning: "border-l-warning"
};
className={statusColors[status]}
```

### 4. Responsive стилізація

**Паттерни:**

```typescript
// Mobile-first
className="p-4 md:p-6 lg:p-8"
className="text-sm md:text-base lg:text-lg"
className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4"

// Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
```

### 5. Семантичні класи

**Використання семантичних назв:**

```typescript
// Замість конкретних кольорів
className="bg-primary text-primary-foreground"  // ✅
className="bg-[#4A7C4E]"  // ❌ (тільки якщо немає токену)

// Семантичні статуси
className="bg-success text-white"
className="border-danger"
```

---

## Стилізація сторінок

### Структура сторінки

**Типова структура:**

```typescript
export default function Page() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-3 safe-top">
        {/* ... */}
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 space-y-6">
        {/* Sections */}
      </main>

      {/* Footer */}
      <footer className="border-t px-4 py-4 safe-bottom">
        {/* ... */}
      </footer>
    </div>
  );
}
```

### Паттерни layout

**Flexbox layouts:**
```typescript
className="flex flex-col min-h-screen"
className="flex items-center justify-between"
```

**Grid layouts:**
```typescript
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
```

**Spacing:**
```typescript
className="space-y-6"  // Vertical spacing між дітьми
className="gap-4"      // Grid/Flex gap
```

### Safe areas

**Підтримка notched devices:**
```typescript
className="safe-top"     // padding-top: env(safe-area-inset-top)
className="safe-bottom"  // padding-bottom: env(safe-area-inset-bottom)
```

---

## Гнучкість та можливості змін

### Рівні змін стилів

#### 1. Глобальні зміни (Design Tokens)

**Зміна кольорової палітри:**

```typescript
// src/styles/tokens/colors.ts
export const colors = {
  brand: {
    primary: "#NEW_COLOR",  // Зміна тут вплине на весь проект
    // ...
  }
};
```

**Потрібно оновити:**
- `src/styles/tokens/colors.ts` - токени
- `tailwind.config.ts` - Tailwind кольори
- `src/app/globals.css` - CSS змінні для Tailwind
- `src/styles/design-system.css` - CSS змінні (якщо використовуються)

#### 2. Зміни в Tailwind конфігурації

**Додавання нових утиліт:**

```typescript
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      newColor: "#HEX_VALUE"
    },
    spacing: {
      custom: "3.5rem"
    }
  }
}
```

#### 3. Зміни в компонентах

**Модифікація існуючого компонента:**

```typescript
// src/components/ui/button.tsx
const buttonVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        // Додати новий варіант
        newVariant: "new-variant-classes"
      }
    }
  }
);
```

**Створення нового компонента:**

```typescript
// Використовувати існуючі токени
className="bg-primary text-primary-foreground"
// Або створити новий через CVA
```

#### 4. Зміни на рівні сторінки

**Перевизначення стилів:**

```typescript
<Component className="custom-override-classes" />
```

### Стратегії змін

#### A. Зміна кольорової теми

**Крок 1:** Оновити примітивні кольори в `colors.ts`
**Крок 2:** Оновити семантичні токени
**Крок 3:** Оновити Tailwind конфігурацію
**Крок 4:** Оновити CSS змінні в `globals.css` та `design-system.css`

#### B. Додавання нової анімації

**Крок 1:** Додати keyframes в `motion.ts`
**Крок 2:** Додати в `tailwind.config.ts` keyframes та animation
**Крок 3:** Використати в компонентах: `className="animate-new-animation"`

#### C. Зміна типографії

**Крок 1:** Оновити `typography.ts` токени
**Крок 2:** Оновити CSS класи в `design-system.css`
**Крок 3:** Оновити Tailwind fontSize якщо потрібно

#### D. Зміна spacing scale

**Крок 1:** Оновити `spacing.ts` токени
**Крок 2:** Оновити Tailwind spacing (якщо потрібно)
**Крок 3:** Перевірити компоненти на сумісність

### Рекомендації для гнучких змін

#### ✅ DO (Рекомендовано)

1. **Використовувати токени замість hardcoded значень**
   ```typescript
   // ✅
   className="bg-primary"
   // ❌
   className="bg-[#4A7C4E]"
   ```

2. **Використовувати семантичні назви**
   ```typescript
   // ✅
   className="bg-success text-white"
   // ❌
   className="bg-green-500"
   ```

3. **Використовувати `cn()` для об'єднання класів**
   ```typescript
   className={cn("base", condition && "conditional", className)}
   ```

4. **Додавати нові варіанти через CVA**
   ```typescript
   variants: {
     variant: {
       existing: "...",
       new: "..."  // Додати тут
     }
   }
   ```

5. **Використовувати responsive класи**
   ```typescript
   className="p-4 md:p-6 lg:p-8"
   ```

#### ❌ DON'T (Не рекомендовано)

1. **Не використовувати inline styles**
   ```typescript
   // ❌
   <div style={{ color: "#4A7C4E" }}>
   ```

2. **Не hardcode кольори без токенів**
   ```typescript
   // ❌
   className="bg-[#4A7C4E]"
   // ✅ (якщо токен не існує, спочатку додати токен)
   ```

3. **Не створювати дублікати стилів**
   ```typescript
   // ❌ Створювати новий компонент з такими ж стилями
   // ✅ Використовувати існуючий компонент або створити варіант
   ```

4. **Не ігнорувати accessibility**
   ```typescript
   // ✅ Завжди додавати focus states
   className="focus-visible:ring-2 focus-visible:ring-ring"
   ```

### Точки входу для змін

#### Швидкі зміни (без зміни токенів)

1. **Tailwind конфігурація** - додати нові утиліти
2. **Компонентні класи** - модифікувати через `className` prop
3. **Умовні класи** - додати логіку в компоненті

#### Середні зміни (з оновленням токенів)

1. **Оновити токени** в `src/styles/tokens/`
2. **Оновити CSS змінні** в `design-system.css`
3. **Оновити Tailwind конфігурацію** якщо потрібно

#### Глобальні зміни (редизайн)

1. **Оновити всі токени**
2. **Оновити Tailwind конфігурацію**
3. **Оновити CSS файли**
4. **Перевірити всі компоненти на сумісність**

---

## Висновки

### Сильні сторони системи

1. **Єдине джерело правди** - Design Tokens
2. **Гнучкість** - кілька рівнів абстракції
3. **Типобезпека** - TypeScript токени
4. **Консистентність** - семантичні назви
5. **Accessibility** - вбудована підтримка
6. **Mobile-first** - оптимізація для touch

### Потенційні покращення

1. **Уніфікація** - деякі компоненти використовують hardcoded кольори
2. **Документація** - додати Storybook або аналог
3. **Тестування** - visual regression тести
4. **Автоматизація** - генерація CSS з токенів

### Рекомендації для майбутніх змін

1. Завжди починати з токенів
2. Використовувати семантичні назви
3. Тестувати на різних пристроях
4. Дотримуватися mobile-first підходу
5. Підтримувати accessibility стандарти

---

## Додаткові ресурси

### Ключові файли для редагування

- **Кольори**: `src/styles/tokens/colors.ts`, `tailwind.config.ts`, `src/app/globals.css`
- **Типографія**: `src/styles/tokens/typography.ts`, `src/styles/design-system.css`
- **Spacing**: `src/styles/tokens/spacing.ts`, `tailwind.config.ts`
- **Компоненти**: `src/components/ui/*.tsx`, `src/components/atoms/*/*.tsx`
- **Глобальні стилі**: `src/app/globals.css`, `src/styles/design-system.css`

### Утиліти

- `cn()` - об'єднання класів (`src/lib/utils.ts`)
- `getToken()` - отримання токенів в runtime (`src/styles/theme/theme-provider.tsx`)

---

*Документ створено: 2024*
*Версія системи: v0.1.0*






