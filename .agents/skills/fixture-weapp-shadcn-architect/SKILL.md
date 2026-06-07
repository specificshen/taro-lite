---
name: fixture-weapp-shadcn-architect
description: "Use when adding, modifying, or reviewing pages and UI components inside fixtures/weapp-react19-vite-skyline, especially shadcn-inspired primitives, Drawer/Dialog motion, CSS variables, and the components/ui/<component>/index.tsx + index.module.css folder convention."
---

# Fixture WeApp Shadcn Architect

Use when adding, modifying, or reviewing pages and components inside the `fixtures/weapp-react19-vite-skyline` fixture project. This skill enforces the fixture's shadcn-inspired primitive architecture, design-token system, and mini-program-safe motion patterns.

## Purpose

The fixture is a baseline validation project for Taro Lite. It must:

- Cover major Taro APIs, React 19 features, Skyline/glass-easel components, and common Mini Program UI patterns.
- Follow a shadcn-inspired copy-paste primitive architecture, not npm-installed UI libraries.
- Use the centralized CSS variable design-token system for colors, spacing, radius, shadows, and motion.
- Keep each UI primitive physically self-contained so component logic and styles move together.

## Directory Architecture

```text
src/
├── styles/
│   ├── tokens.css
│   ├── utilities.css
│   └── animations.css
├── lib/
│   └── utils.ts
├── hooks/
│   ├── use-safe-area.ts
│   └── use-logger.ts
├── components/
│   ├── ui/
│   │   ├── button/
│   │   │   ├── index.tsx
│   │   │   └── index.module.css
│   │   ├── drawer/
│   │   │   ├── index.tsx
│   │   │   └── index.module.css
│   │   └── <component>/
│   │       ├── index.tsx
│   │       └── index.module.css
│   ├── layout/
│   │   ├── navbar.tsx
│   │   ├── page-wrapper.tsx
│   │   └── layout.module.css
│   └── demo/
│       ├── log-console.tsx
│       └── demo.module.css
└── pages/
    ├── index/
    ├── components/
    ├── form/
    ├── list/
    ├── network/
    ├── gesture/
    └── state/
```

## Core Rules

1. Every new page lives under `src/pages/<page-name>/` with `index.tsx`, `index.config.ts`, and optional `index.module.css`.
2. Reusable primitive components go into `src/components/ui/<component-name>/`.
3. Every UI primitive must be one folder with `index.tsx` and `index.module.css`.
4. Do not add flat files like `src/components/ui/button.tsx`.
5. Do not create or depend on a shared `src/components/ui/ui.module.css`.
6. Import primitives through the folder path, for example `@/components/ui/button`, never `@/components/ui/button/index`.
7. Keep `components/` shallow: use `ui/`, `layout/`, and `demo/`; do not add broad `common/` or `shared/` folders.
8. `lib/utils.ts` must remain dependency-free. Use the built-in `cn()` helper instead of adding `clsx`.

## UI Primitive Pattern

```text
src/components/ui/<component-name>/
├── index.tsx
└── index.module.css
```

`index.tsx` owns the React/Taro component, prop types, variants, and exports. `index.module.css` owns only that component's classes. Keep class names component-scoped, for example `.btn`, `.btn_default`, `.drawerPortal`, `.drawerContent_bottom`.

Example:

```tsx
import type { ReactNode } from 'react';
import { Button as TaroButton } from '@spcsn/taro-components';
import { cn } from '@/lib/utils';
import styles from './index.module.css';

export type ButtonVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost';

interface ButtonProps {
  variant?: ButtonVariant;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
}

export function Button({ variant = 'default', className, onClick, children }: ButtonProps) {
  return (
    <TaroButton className={cn(styles.btn, styles[`btn_${variant}`], className)} onClick={onClick}>
      {children}
    </TaroButton>
  );
}
```

## Design Tokens

All visual styling should use CSS variables from `src/styles/tokens.css`:

- Base: `--background`, `--foreground`
- Surfaces: `--card`, `--card-foreground`, `--popover`, `--popover-foreground`
- Actions: `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`
- Form and borders: `--border`, `--input`, `--ring`
- Shape: `--radius`, `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-full`
- Status: `--success`, `--warning`, `--info`, `--destructive`
- Elevation: `--shadow-xs`, `--shadow-sm`, `--shadow`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`
- Motion: `--ease-out`, `--ease-in-out`, `--duration-fast`, `--duration-normal`, `--duration-slow`

For overlay components, always provide local fallbacks because portal-like nodes may not inherit `page` variables:

```css
.drawerPortal {
  --drawer-local-background: var(--background, #ffffff);
  --drawer-local-duration: 320ms;
}
```

## Drawer / Dialog Motion

Mini-program overlays can be mounted outside the page node that carries `page` CSS variables. For Drawer/Dialog/Popover-like components:

1. Keep motion styles in the component's own `index.module.css`, not only in global `animations.css`.
2. Define fallback CSS variables on the overlay root.
3. Prefer a two-phase enter state: mount closed (`visible=true`, `active=false`), then switch to open on the next tick (`active=true`) so Skyline/WeApp gets a real transition frame.
4. Keep the node mounted during exit until the transition duration elapses, then unmount.
5. Use `opacity` and `transform: translate3d(...)` for motion. Avoid animating layout properties such as `height`, `top`, or `bottom`.
6. Add literal or local duration/easing fallbacks. Do not depend exclusively on variables from `app.css`.

## Page Pattern

Every page should use `<PageWrapper title="...">` to get:

- Safe-area-aware custom navbar
- Consistent background and scroll container
- Skyline-compatible `ScrollView`

Use `<LogConsole logs={logs} onClear={clear} />` at the bottom of test pages for runtime observability.

## Adding A New Page

1. Create `src/pages/<page-name>/`.
2. Add `index.config.ts` with `navigationStyle: 'custom'` and `renderer: 'skyline'`.
3. Add `index.tsx` using `<PageWrapper>` and, for test pages, `<LogConsole>`.
4. Add `index.module.css` when page-local styling is needed.
5. Register the page in `src/app.config.ts`.
6. Add the dashboard link in `src/pages/index/index.tsx`.
7. Verify token usage and avoid hard-coded colors unless the component is intentionally defining a token fallback.

## Baseline Test Coverage Checklist

When adding fixture coverage, exercise at least one meaningful area:

| Area | Existing Pages | What To Add If Missing |
| ---- | -------------- | ---------------------- |
| React 19 concurrent features | `state` | `useTransition`, `useDeferredValue`, `useOptimistic` |
| React Context + Reducer | `state` | Deep context propagation, reducer middleware |
| Taro lifecycle hooks | `index` | `useLoad`, `useReady`, `useDidShow`, `useDidHide` |
| Taro.request | `network` | Upload, download, WebSocket |
| Taro.addInterceptor | `network` | Chain ordering, error interceptors |
| Form controls | `form` | `Picker`, `Textarea`, `CheckboxGroup`, `RadioGroup` |
| Skyline ListView | `list` | `ListView` + `ListItem` with complex nested nodes |
| Skyline Gestures | `gesture` | `TapGestureHandler`, `PanGestureHandler`, `LongPressGestureHandler` |
| Custom Navigation Bar | all via `PageWrapper` | Capsule alignment, blur backdrop |
| CSS Modules | all | Module scoping, token consumption |

## Common Mistakes To Avoid

1. Creating `src/components/ui/button.tsx` instead of `src/components/ui/button/index.tsx`.
2. Creating or depending on `src/components/ui/ui.module.css`.
3. Putting Drawer/Dialog animation only in global CSS.
4. Depending on `app.css` variables inside overlay roots without local fallbacks.
5. Installing `clsx`, `tailwindcss`, or external component libraries for fixture primitives.
6. Forgetting `renderer: 'skyline'` in page configs.
7. Adding a page to `app.config.ts` but not to the dashboard `navItems`.
