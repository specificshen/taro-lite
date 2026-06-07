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
├── features/
│   ├── fixture-navigation/
│   │   └── index.ts
│   └── <feature-name>/
│       └── index.ts
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
  ├── dashboard/
  ├── ui-lab/
  ├── form-lab/
  │   └── components/
  ├── list-lab/
  ├── network-lab/
  ├── gesture-lab/
  └── state-lab/
```

## Core Rules

1. Every new page lives under `src/pages/<page-name>/` with `index.tsx`, `index.config.ts`, and optional `index.module.css`. Prefer explicit kebab-case capability names such as `form-lab`, `network-lab`, or `dashboard` over generic names like `form`, `network`, or `index`.
2. Reusable primitive components go into `src/components/ui/<component-name>/`.
3. Every UI primitive must be one folder with `index.tsx` and `index.module.css`.
4. Do not add flat files like `src/components/ui/button.tsx`.
5. Do not create or depend on a shared `src/components/ui/ui.module.css`.
6. Import primitives through the folder path, for example `@/components/ui/button`, never `@/components/ui/button/index`.
7. Keep `components/` shallow: use `ui/`, `layout/`, and `demo/`; do not add broad `common/` or `shared/` folders.
8. Page-local presentation components may live under `src/pages/<page-name>/components/` when a page grows beyond a small single-file demo.
9. Cross-page domain data, route metadata, option lists, validation helpers, and feature-specific types belong under `src/features/<feature-name>/index.ts`, not inside page files.
10. Aside from page entry modules, prefer named exports for components, helpers, constants, and types. Avoid default exports in `components/`, `features/`, and page-local `components/`.
11. Centralize page route strings in a feature module, then reuse them from `app.config.ts` and dashboard/navigation UI instead of duplicating hard-coded paths.
12. `lib/utils.ts` must remain dependency-free. Use the built-in `cn()` helper instead of adding `clsx`.

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
7. Overlay roots that can cover the top of the viewport must reserve the Mini Program status bar and capsule/navigation area. Prefer reading `useSafeArea()` and writing explicit inline layout values such as `top: statusBarHeight + navBarHeight` onto the portal. Avoid relying on inline CSS custom properties for this path.

## WXSS / Skyline CSS Compatibility

1. Do not use CSS nesting such as `> :not(:first-child)` inside a rule block.
2. Do not depend on pseudo-class spacing such as `.container > :not(:first-child)` for critical layout. Prefer explicit classes like `.sectionSpaced` or direct margins on named elements.
3. Do not use CSS Grid in `fixtures/weapp-react19-vite-skyline`; Skyline does not support grid layout reliably. Use flex containers for horizontal/vertical groups instead.
4. For repeated horizontal groups such as metric cards, action buttons, filter chips, or status panels, prefer `display: flex` with `gap`, and give equal-width children `flex: 1; min-width: 0;`.
5. Avoid shorthand positioning like `inset: var(...)`. Use explicit `top`, `right`, `bottom`, and `left` declarations for overlay roots.

## Gesture Demo Guidance

1. Skyline gesture handler components such as `TapGestureHandler`, `PanGestureHandler`, and `LongPressGestureHandler` require worklet string callbacks. Do not pass ordinary React callback props such as `onGestureEvent` and expect them to run.
2. For fixture pages that need visible JS-side logs, use standard Mini Program events such as `onClick`, `onLongPress`, `onTouchStart`, `onTouchMove`, and `onTouchEnd`.
3. For visible long-press demos, pair `onLongPress` with `onLongClick` and a small touch timer fallback so runtime event-name differences do not make the demo appear dead.

## Page Pattern

Every page should use `<PageWrapper title="...">` to get:

- Safe-area-aware custom navbar
- Consistent background and scroll container
- Skyline-compatible `ScrollView`

Use `<LogConsole logs={logs} onClear={clear} />` at the bottom of test pages for runtime observability.

## Adding A New Page

1. Create `src/pages/<page-name>/` with an explicit kebab-case capability name.
2. Add `index.config.ts` with `navigationStyle: 'custom'` and `renderer: 'skyline'`.
3. Add `index.tsx` using `<PageWrapper>` and, for test pages, `<LogConsole>`.
4. Add `index.module.css` when page-local styling is needed.
5. Add page-local components under `src/pages/<page-name>/components/` if the page needs multiple sections or repeated UI blocks.
6. Put shared route metadata, options, and validation/model helpers under `src/features/<feature-name>/index.ts`.
7. Register the page through the centralized route constants used by `src/app.config.ts`.
8. Add the dashboard link through the shared fixture navigation feature.
9. Verify token usage and avoid hard-coded colors unless the component is intentionally defining a token fallback.

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
7. Adding a page route in `app.config.ts` but not in the centralized fixture navigation feature.
8. Leaving hard-coded route strings in page components after introducing `src/features/fixture-navigation`.
9. Using default exports for non-page components or feature helpers.
