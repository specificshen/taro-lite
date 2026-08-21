---
name: vite-weapp-debugger
description: Use when debugging or implementing the React 19 + Vite + WeApp + Skyline/glass-easel build/runtime path.
---

## Vite WeApp Debugger

Use this skill for build failures, runtime behavior, config handling, React framework integration, or WeApp/Skyline output issues in `taro-lite`.

### Supported main path

Assume the primary maintained path is:

- React 19
- Vite
- WeApp mini-program output
- Skyline renderer
- glass-easel component framework

Do not broaden a fix to unsupported upstream Taro platforms or frameworks unless the user explicitly asks.

### Start from the failing symptom

1. Capture the exact command, error text, and affected business config if available.
2. Search exact error text, config key, package name, or function name first.
3. Identify which layer owns the behavior before editing:
   - CLI command and config loading: `packages/taro-cli`
   - Plugin/service orchestration: `packages/taro-cli/src/internal/kernel/`
   - Vite build and mini output generation: `packages/taro-cli/src/internal/runner/`
   - React integration: `packages/taro-cli/src/internal/runner/` (react-framework)
   - WeApp platform behavior: `packages/taro-cli/src/platform-weapp/`
   - Runtime APIs and DOM-like behavior: `packages/taro/src/runtime/` (exported as `@spcsn/taro/runtime`)
   - Components: `packages/taro-components`

### Config contract

The expected business config shape commonly includes:

```ts
export default {
  framework: 'react',
  compiler: 'vite',
  mini: {
    compile: { prerender: true },
    output: { renderer: 'skyline', componentFramework: 'glass-easel' },
  },
}
```

When changing config behavior, preserve this path unless intentionally changing the business contract.

### Implementation guidance

- Prefer small, layer-local fixes over reintroducing broad upstream multi-platform abstractions.
- Keep React 19 assumptions explicit where peer ranges or reconciler versions matter.
- Avoid adding new business-visible dependencies for runner/framework internals.
- If output generation changes, inspect the generated mini-program files or snapshots/fixtures relevant to WeApp.

### Validation

Pick validation based on touched layer:

- CLI tests: `cd packages/taro-cli && bun test --isolate cli.spec.ts build-config.spec.ts` (or `bun run test` for the full suite)
- Runner build: runner and React framework runtime live inside `@spcsn/taro-cli` (`src/internal/runner/`) with no separate build step; validate via CLI tests
- Runtime build/test: `cd packages/taro && bun run build` or `cd packages/taro && bun run test`
- Components tests: `cd packages/taro-components && bun run test`
- Business proof: `bun run verify:fixture:weapp`, or the real business project's build when the change affects integration.
