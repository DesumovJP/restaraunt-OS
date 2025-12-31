# Project Coding Standards

## Structure / Структура

### Hooks and Utilities
- Organize all reusable logic into hooks (`/hooks`) and utilities (`/utils`)
- Each hook should be in its own file with clear naming: `use[Feature].ts`
- Utilities should be pure functions, grouped by domain

## Error Handling / Обробка помилок

### Requirements
- All API requests MUST have try/catch with fallback UI
- Use React Error Boundaries for component-level error handling
- Hooks with async operations MUST implement retry logic:
  - 3 retry attempts
  - Exponential backoff delay (e.g., 1s, 2s, 4s)

### Example Pattern
```typescript
const fetchWithRetry = async (fn: () => Promise<T>, maxRetries = 3): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
};
```

## Documentation / Документація

### Hooks Documentation
Every hook MUST be documented with:
- Description of purpose
- Parameters with types
- Return data structure
- Example response

### GraphQL Queries
Every GraphQL query MUST include:
- Query name and purpose
- Variables description
- Example response in comments

## Styling / Стилі

### Design Tokens
- Use centralized design tokens for:
  - Colors
  - Spacing
  - Typography
- Tokens should be defined in theme configuration

### Forbidden Practices
- NO hardcoded colors (use tokens: `text-primary`, `bg-secondary`)
- NO hardcoded spacing values (use scale: `p-4`, `gap-2`)
- NO inline style objects with magic numbers
- NO direct hex/rgb values in components

## Code Review Checklist

- [ ] Error handling with try/catch
- [ ] Fallback UI for loading/error states
- [ ] Retry logic for network requests
- [ ] Hook documentation complete
- [ ] No hardcoded styles
- [ ] Design tokens used consistently

## Available Utilities

### Retry Logic
Use `fetchWithRetry` from `@/lib/fetch-with-retry`:
```typescript
import { fetchWithRetry } from "@/lib/fetch-with-retry";

const data = await fetchWithRetry(
  () => fetch("/api/data").then(r => r.json()),
  { maxRetries: 3, onRetry: (attempt) => console.log(`Retry ${attempt}`) }
);
```

### Error Components
- `ErrorFallback` - Error display with retry button (`@/components/ui/error-fallback`)
- `InlineError` - Inline error messages for forms
- `EmptyStateError` - Full-page error states

### Error Boundaries
Error boundaries are set up at:
- `src/app/error.tsx` - Global error boundary
- `src/app/kitchen/error.tsx` - Kitchen module error boundary

## Color Token Mapping Reference

When working with colors, use these token mappings:
| Hardcoded | Token |
|-----------|-------|
| `#1A1A1A`, `#111111` | `text-foreground` |
| `#666666` | `text-muted-foreground` |
| `#E8E2DD`, `#E2E8F0` | `border-border` |
| `#F1EDE9`, `#F8FAFC` | `bg-muted` |
| `#4A7C4E`, `#059669` | `text-success` / `bg-success` |
| `#E11D48` | `text-error` / `bg-error` |
| `#F59E0B`, `#D97706` | `text-warning` / `bg-warning` |
| `#0B1B3B` (navy-950) | `bg-primary` / `text-primary` |
| `#3B82F6` (electric-500) | `bg-accent` / `text-accent` |

### Exceptions
- `src/app/layout.tsx` - themeColor in viewport metadata (acceptable)
- `src/app/showcase/page.tsx` - color values displayed for documentation
