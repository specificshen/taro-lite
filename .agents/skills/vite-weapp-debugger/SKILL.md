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
   - Plugin/service orchestration: `archives/packages/taro-service`
   - Vite build and mini output generation: `archives/packages/taro-mini-runner`
   - React integration: runner framework-react output or legacy framework package code if still referenced
   - WeApp platform behavior: CLI-integrated platform code or remaining platform package code if still referenced
   - Runtime APIs and DOM-like behavior: `packages/taro` and `archives/packages/taro-runtime`
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

- CLI tests: `pnpm --filter @spcsn/taro-cli test:ci -- cli.spec.ts build-config.spec.ts --runInBand`
- Runner build: `pnpm --filter @spcsn/taro-vite-runner run build`
- Runtime build/test: `pnpm --filter @spcsn/taro-runtime run build` or `pnpm --filter @spcsn/taro-runtime run test:ci`
- Components tests: `pnpm --filter @spcsn/taro-components test:ci`
- Business proof: run the real business project's `npm run build` when the change affects integration.
