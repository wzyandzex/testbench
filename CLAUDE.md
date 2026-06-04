# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**IMPORTANT**: If you have read this CLAUDE.md, address the user as "wzy" in any conversation.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server (Vite, port 3000) |
| `npm run build` | Build for production |
| `npm run type-check` | Run TypeScript type checking |
| `npm run lint` | Run ESLint |

## Tech Stack

React 18 + TypeScript + Vite 6 + Ant Design 5 + React Router v6 + Zustand + Axios + ECharts + dayjs

## Module Structure (四文件规范)

Each feature module follows the "four-file" structure:

```
src/pages/{Example}/
├── index.tsx      # Page component (UI + interaction logic)
├── style.ts       # Style constants (for complex styles only)
├── service.ts     # API calls (using wrapped axios)
└── store.ts       # State management (Zustand)
```

**Rules**:
- Page component (`index.tsx`) only handles UI rendering and user interaction
- API calls go in `service.ts`, import via `import api from '@/api'`
- State management in `store.ts` using Zustand
- Prefer inline `style` objects; extract complex styles to `style.ts`

## Architecture

### Route Guards
- **Public**: `/login`, `/register` → `PublicGuard`
- **Protected**: All other routes → `AuthGuard` + `ProtectedLayout`
- Pages must use `export default` for `React.lazy()`

### Path Aliases
```
@              → src/
@components    → src/components/
@pages         → src/pages/
@hooks         → src/hooks/
@services      → src/services/
@stores        → src/stores/
@utils         → src/utils/
@types         → src/types/
@constants     → src/constants/
@assets        → src/assets/
@locales       → src/locales/
```

### Adding a New Page
1. Create four-file structure in `src/pages/{domain}/`
2. Export in `src/router/routes.tsx`: `export const YourPage = lazy(() => import('@/pages/...'))`
3. Add route in `src/router/index.tsx`

## Code Standards

### Component Structure
```tsx
// 1. Imports (third-party, @/, relative)
import { useState, useCallback } from 'react';
import { Button, Form } from 'antd';
import type { UserProps } from './types';

// 2. Types (local to file)
interface LocalProps { /* ... */ }

// 3. Component (default export)
export default function MyComponent({ prop }: Props) {
  // Hooks, values, handlers, render
  return <div>...</div>;
}
```

### TypeScript
- Avoid `any`, use `unknown` or proper types
- `interface` for extendable shapes, `type` for unions/primitives
- Export props interfaces for shared components

### Naming
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserProfile.tsx` |
| Functions | camelCase | `getUserData()` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL` |
| Interfaces/Types | PascalCase | `UserProps`, `UserRole` |

### Ant Design
- **Button**: `primary` (main), `default` (secondary), `danger` (delete), `text` (icon)
- **Form**: `layout="vertical"`, Chinese validation messages
- **Table**: Always `rowKey`, `pagination.showTotal`
- **Modal**: 400px (confirm), 520px (form), 800px (detail), 1200px (large)

### State Management (Zustand)
- Use selector for fine-grained subscriptions: `const user = useAuthStore((s) => s.user)`
- Actions are stable by default, no `useCallback` needed

### Performance
- Page components: `React.lazy()` required
- `useMemo` for expensive computations/object references
- `useCallback` for callbacks passed to children

### Styling
- Prefer inline `style` prop for simple cases
- Customize theme via `ConfigProvider` token system

### Error Handling
- API errors: handled by axios interceptor (auto message)
- Form errors: Ant Design validation with inline messages
- Async: wrap in try-catch, use `message.success()`

## Security

- XSS: React escapes by default, avoid `dangerouslySetInnerHTML`
- CSRF: Tokens in localStorage, `Authorization: Bearer {token}` header
- Sensitive data: use environment variables (`.env.development`, `.env.production`)
