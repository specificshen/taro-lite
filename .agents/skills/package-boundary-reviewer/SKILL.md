---
name: package-boundary-reviewer
description: Use when reviewing dependency boundaries, package consolidation, workspace membership, or public/private package changes in this monorepo.
---

## Package Boundary Reviewer

Use this skill when changing package dependencies, workspace membership, public publish surface, exports, build outputs, or business installation guidance in `taro-lite`.

### Product boundary to preserve

The repository is converging from upstream Taro's many packages into a small `@spcsn` business-facing surface. Keep business-facing guidance centered on:

- `@spcsn/taro`
- `@spcsn/taro-components`
- `@spcsn/taro-cli`

Do not make business projects explicitly install internal implementation packages unless the user asks for an intentional temporary workaround and the tradeoff is stated.

### Before changing packages

1. Read current `package.json` files for the package being changed and its direct dependents.
2. Read `pnpm-workspace.yaml` before assuming a package participates in recursive workspace commands.
3. Check `docs/package-consolidation.md` for whether the package is being retained, folded into another package, or excluded from the public surface.
4. Search exact dependency names in `packages`, `crates/native_binding`, `npm`, `README.md`, and release scripts before removing or renaming dependencies.

### Dependency rules

- Business direct dependencies must be explainable as either source imports or explicit command-line tools.
- Internal runner/framework/platform dependencies should remain inside CLI, runner, framework, or platform packages.
- Keep versions aligned with the root package for public packages.
- If moving a package from public to private/internal, first ensure its build output is bundled or reachable from the intended public entry package.
- Do not set a still-required internal package to `private: true` and stop publishing until consuming public packages no longer resolve it from npm.

### Common package areas

- CLI consolidation: `packages/taro-cli`; active internals under `packages/taro-cli/src/internal/`; archived read-only snapshots at `archives/packages/taro-service`, `archives/packages/taro-mini-runner`, `archives/packages/taro-helper`, `archives/packages/taro-shared`.
- Runtime consolidation: `packages/taro` with inlined runtime at `packages/taro/src/runtime/`; archived read-only snapshot at `archives/packages/taro-runtime`.
- Component dependency cleanup: `packages/taro-components` and its peer relationship to React/`@spcsn/taro`.
- Native binding surface: already removed; do not reintroduce `crates/native_binding` or `npm/*` platform packages.

### Validation

Use the narrowest useful command first:

- Package build: `pnpm --filter <package-name> run build`
- CLI version check: `node packages/taro-cli/bin/taro --version`
- Version-only release readiness: `pnpm run release:check -- --skip-bindings`
- Full release readiness after artifacts: `pnpm run release:check`

For changes that affect business install/runtime behavior, validate in a real business project with its `npm run build` when possible.
