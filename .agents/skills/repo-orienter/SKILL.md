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

Treat these historical package names as internal implementation details that have been inlined; their active source now lives inside the three entry packages above:

- `@spcsn/taro-runtime` → inlined into `packages/taro/src/runtime/`, exposed as `@spcsn/taro/runtime` for CLI build-time use.
- `@spcsn/taro-service`, `@spcsn/taro-mini-runner`, `@spcsn/taro-helper`, `@spcsn/taro-shared` → inlined into `packages/taro-cli/src/internal/`.
- Vite, PostCSS, LightningCSS, Babel/SWC, React Refresh, and other runner/framework internals.

### Module map

- `packages/taro-cli`: CLI entry, command orchestration, generator/platform integration, business-facing `taro` binary. Contains inlined internal implementations under `src/internal/`.
- `packages/taro`: main runtime/API entry consumed by business code. Contains the inlined runtime under `src/runtime/`.
- `packages/taro-components`: component package consumed by business code.
- `archives/packages/`: historical read-only snapshots of the former internal packages, no longer in the workspace or publish surface.
- `docs/package-consolidation.md`: current package surface consolidation state.
- `docs/package-archive-plan.md`: archive plan and current public/private package boundaries.

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
