# Fixture WeApp Shadcn Architect

Use when adding, modifying, or reviewing pages and components inside the `fixtures/weapp-react19-vite-skyline` fixture project. This skill enforces the shadcn-inspired directory architecture and design-token system already established in the fixture.

## Purpose

The fixture is a **底座验证工程** (baseline validation project) for Taro Lite. It must:
- Cover all major Taro APIs, React 19 features, Skyline/glass-easel components, and common Mini Program UI patterns.
- Follow a **shadcn-inspired** flat-component architecture (copy-paste primitives, not npm-installed libraries).
- Use a centralized **CSS variable design-token** system for colors, spacing, radius, and shadows.
- Keep WXSS selector count low by colocating related component styles into shared modules.

## Directory Architecture

```
src/
├── styles/
│   ├── tokens.css          # CSS variables (colors, radius, shadows, typography)
│   └── utilities.css       # Flat utility classes (flex, gap, padding, text, colors)
├── lib/
│   └── utils.ts            # cn(), formatTime(), sleep(), uid()
├── hooks/
│   ├── use-safe-area.ts    # Safe-area + navbar height calculation
│   └── use-logger.ts       # Structured log entry state management
├── components/
│   ├── ui/                 # Primitives (card, badge, button, input, avatar, separator, skeleton)
│   │   ├── ui.module.css   # ONE shared module for all primitives (keep selector count low)
│   │   └── *.tsx
│   ├── layout/             # Page-level layout wrappers
│   │   ├── navbar.tsx
│   │   ├── page-wrapper.tsx
│   │   └── layout.module.css
│   └── demo/               # Debug / test helpers
│       ├── log-console.tsx
│       └── demo.module.css
└── pages/
    ├── index/              # Dashboard / navigation hub
    ├── components/         # UI primitives showcase
    ├── form/               # Form controls & validation
    ├── list/               # ScrollView & ListView performance
    ├── network/            # Taro.request & interceptors
    ├── gesture/            # Skyline native gestures
    └── state/              # React 19 transitions, reducer, context
```

**Rules:**
1. Every new page lives under `src/pages/<page-name>/` with `index.tsx`, `index.config.ts`, and optional `index.module.css`.
2. Reusable components go into `src/components/ui/` (primitives) or `src/components/layout/` (page chrome).
3. Do NOT create deeply nested directories inside `components/`. Keep it flat: `ui/`, `layout/`, `demo/`.
4. `lib/utils.ts` must remain dependency-free (no `clsx` npm package—use the built-in `cn()`).

## Design System (tokens.css)

All visual styling MUST use the CSS variables defined in `src/styles/tokens.css`:

| Token | Usage |
|-------|-------|
| `--background`, `--foreground` | Page text and surface |
| `--card`, `--card-foreground` | Card surfaces |
| `--primary`, `--primary-foreground` | Main actions, active states |
| `--secondary`, `--secondary-foreground` | Secondary actions, muted surfaces |
| `--muted`, `--muted-foreground` | Disabled, placeholder, helper text |
| `--accent`, `--accent-foreground` | Highlights, selected radio items |
| `--destructive`, `--destructive-foreground` | Errors, dangerous actions |
| `--border`, `--input`, `--ring` | Form borders, focus rings |
| `--radius`, `--radius-sm`, `--radius-lg`, `--radius-xl` | Corner radius |
| `--success`, `--warning`, `--info` | Semantic status colors |
| `--shadow-sm`, `--shadow`, `--shadow-md`, `--shadow-lg` | Elevation |
| `--font-sans`, `--font-mono` | Typography |

**Rule:** Never hard-code hex colors inside page modules. Always reference a token.

## Component Patterns

### UI Primitive Example (Button)

```tsx
import { Button as TaroButton } from '@spcsn/taro-components';
import { cn } from '@/lib/utils';
import styles from './ui.module.css';

export type ButtonVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost';

interface ButtonProps {
  variant?: ButtonVariant;
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
}

export function Button({ variant = 'default', className, onClick, children }: ButtonProps) {
  return (
    <TaroButton
      className={cn(styles.btn, styles[`btn_${variant}`], className)}
      onClick={onClick}
    >
      {children}
    </TaroButton>
  );
}
```

### Page Wrapper

Every page MUST use `<PageWrapper title="...">` to get:
- Safe-area-aware custom navbar
- Consistent background and scroll container
- Skyline-compatible `ScrollView`

```tsx
import { PageWrapper } from '@/components/layout/page-wrapper';

export default function MyPage() {
  return (
    <PageWrapper title="页面标题">
      {/* page content */}
    </PageWrapper>
  );
}
```

### Log Console

Use `<LogConsole logs={logs} onClear={clear} />` at the bottom of every test page to provide runtime observability.

```tsx
import { LogConsole } from '@/components/demo/log-console';
import { useLogger } from '@/hooks/use-logger';

export default function MyPage() {
  const { logs, add, clear } = useLogger();
  // ... add('message', 'success');
  return (
    <PageWrapper title="...">
      {/* ... */}
      <LogConsole logs={logs} onClear={clear} />
    </PageWrapper>
  );
}
```

## Adding a New Page (Step-by-Step)

1. **Create directory:** `src/pages/<page-name>/`
2. **Create files:**
   - `index.config.ts` with `navigationStyle: 'custom', renderer: 'skyline'`
   - `index.tsx` using `<PageWrapper>` and `<LogConsole>`
   - `index.module.css` (optional; prefer utility classes when possible)
3. **Register page:** Add the path to `src/app.config.ts` `pages` array.
4. **Add nav link:** Update `src/pages/index/index.tsx` navItems array so the dashboard links to it.
5. **Verify token usage:** Ensure no hard-coded colors; use `var(--...)` tokens.

## Baseline Test Coverage Checklist

When adding a new fixture page, ensure it exercises at least one uncovered area:

| Area | Existing Pages | What to Add If Missing |
|------|---------------|------------------------|
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
| CSS Utility Classes | all | Flat atomic class usage |

## Best Practices

- **Keep WXSS selectors flat.** Prefer single-class selectors. Avoid descendant combinators (`>`, ` `) where possible.
- **Colocate primitive styles.** All UI primitives share `ui.module.css` to reduce total selector count.
- **Prefer `View` + `Text` over HTML elements.** This is a Taro Mini Program; use `@spcsn/taro-components`.
- **Do NOT import Tailwind.** The fixture uses custom flat utilities (`utilities.css`) to stay WXSS-safe.
- **Mock gracefully.** If `Taro.request` or native APIs are unavailable in Node/browser, fall back to mock data with clear logging.
- **Type everything.** Use TypeScript interfaces for props, form state, and API responses.

## Common Mistakes to Avoid

1. Creating `src/components/common/` or `src/components/shared/` — use the established `ui/`, `layout/`, `demo/` buckets.
2. Installing `clsx` or `tailwindcss` — the fixture intentionally avoids these.
3. Forgetting `renderer: 'skyline'` in `index.config.ts`.
4. Hard-coding `#165dff` instead of `var(--primary)`.
5. Adding pages to `app.config.ts` but not to the dashboard `navItems`.
