---
name: repo-orienter
description: Use when orienting work in this monorepo or explaining its product boundaries, module map, and first-pass inspection workflow.
---

## Repo Orienter

Use this skill whenever the user asks to understand, explain, triage, or plan work in the `taro-lite` repository.

### Repository identity

- This is `@spcsn`'s independent mini-program base, forked from Taro but no longer aligned with upstream Taro's multi-platform or `4.x` semantics.
- The maintained product path is **React 19 + Vite + WeApp + Skyline / glass-easel**.
- Do not assume H5, React Native, Harmony, Alipay, ByteDance, Baidu, QQ, Vue, Solid, or Nerv are supported product goals.
- Do not mix `@spcsn/*` packages with official `@tarojs/*` packages when reasoning about business integration.

### Public business-facing packages

Business projects should normally understand only:

- `@spcsn/taro`
- `@spcsn/taro-components`
- `@spcsn/taro-cli`

Treat these as internal implementation details unless the current code proves otherwise:

- `@spcsn/taro-runtime`
- `@spcsn/taro-react`
- `@spcsn/taro-vite-runner`
- `@spcsn/taro-service`
- `@spcsn/taro-helper`
- Vite, PostCSS, Terser, Babel, React Refresh, and other runner/framework internals

### Module map

- `packages/taro-cli`: CLI entry, command orchestration, postinstall, generator/platform integration, business-facing `taro` binary.
- `packages/taro`: main runtime/API entry consumed by business code.
- `packages/taro-components`: component package consumed by business code.
- `packages/taro-vite-runner`: Vite runner and React framework implementation that should feel internal to business projects.
- `packages/taro-service`: service/plugin orchestration used by CLI and runner.
- `packages/taro-runtime`: mini-app runtime and DOM-like abstractions.
- `packages/taro-helper` and `packages/shared`: shared internal utilities.
- `crates/native_binding`: Node native binding package `@spcsn/taro-binding`.
- `npm/*`: platform-specific native binding packages.
- `docs/package-consolidation.md`: current package surface consolidation direction.

### First-pass workflow

1. Read `README.md` before making high-level claims.
2. Check `package.json` scripts and root version before suggesting commands or releases.
3. Check `pnpm-workspace.yaml` because several legacy upstream packages are intentionally excluded.
4. For code changes, search by concrete package, class, function, or config key before editing.
5. Prefer package-scoped commands, for example `pnpm --filter @spcsn/taro-cli run build`, over broad root commands when validating a localized change.

### Default validation mindset

- For TypeScript package changes, run the relevant package build/test first, then root checks only when appropriate.
- For business integration claims, validate against the minimal dependency contract from `README.md`.
- For release claims, also use the release/binding skill.
