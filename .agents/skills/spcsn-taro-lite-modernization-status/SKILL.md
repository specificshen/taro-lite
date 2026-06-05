---
name: spcsn-taro-lite-modernization-status
description: Use when updating, reviewing, or continuing the React-only modernization plan/status in the @spcsn Taro Lite monorepo.
---

## SPCSN Taro Lite Modernization Status

Use this skill when the task touches `docs/taro-react-only-modernization.md`, current modernization status, package consolidation progress, or next-step planning in `taro-lite`.

### Current product line

The maintained path is:

- React 19
- Vite
- WeApp mini-program output
- Skyline renderer
- glass-easel component framework

Do not describe this repository as a general upstream-compatible Taro 4.x framework. It is an independent `@spcsn` mini-program base starting from the `1.0.0` stable line.

### Current business-facing contract

Business projects should explicitly install only:

- `@spcsn/taro`
- `@spcsn/taro-components`
- `@spcsn/taro-cli`

Business projects also provide their own `react` dependency.

Treat the following as internal implementation packages unless current code proves a different contract:

- `@spcsn/taro-service`
- `@spcsn/taro-vite-runner`
- `@spcsn/taro-helper`
- `@spcsn/taro-shared`
- `@spcsn/taro-runtime`
- native binding packages

Do not tell business projects to explicitly install internal packages as a normal solution. If an internal package must be installed directly to make a scenario work, treat that as a packaging boundary bug or temporary workaround.

### Modernization progress already reflected in docs

The following package moves are current status, not future plans:

- `@spcsn/taro-plugin-generator` is folded into `@spcsn/taro-cli`.
- `@spcsn/taro-plugin-platform-weapp` is folded into `@spcsn/taro-cli`.
- `@spcsn/taro-plugin-framework-react` and `@spcsn/taro-react` are folded into `@spcsn/taro-vite-runner`.
- `@spcsn/taro-api` is folded into `@spcsn/taro`.
- `@spcsn/taro-runner-utils` is folded into `@spcsn/taro-service` and `@spcsn/taro-vite-runner`.
- `babel-preset-taro` is exposed as `@spcsn/taro-cli/babel-preset-taro` instead of a public package.
- Historical Babel/PostCSS plugin packages are excluded from the active workspace.

### When updating modernization docs

Before changing `docs/taro-react-only-modernization.md`:

1. Read `README.md` for current public business guidance.
2. Read `docs/package-consolidation.md` for package-surface decisions.
3. Check `pnpm-workspace.yaml` before claiming a package is active in workspace commands.
4. Check relevant package `package.json` files before claiming a package is public, private, or folded.

Keep the modernization document split between:

- historical intent and principles;
- current synchronized status;
- next steps that still need implementation.

### Validation expectations

For documentation-only updates:

- Search the touched doc for stale references such as `next-modern`, React 18, old public plugin package guidance, or business instructions to install internal packages.
- Check `git diff --check`.

For package-boundary changes:

- Run `pnpm run release:check -- --skip-bindings`.
- Run `pnpm run verify:fixture:weapp` when the change can affect business build behavior.
