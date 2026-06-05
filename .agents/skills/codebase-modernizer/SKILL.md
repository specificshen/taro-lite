---
name: codebase-modernizer
description: Use when planning, reviewing, or implementing code optimization in this 8-package Taro Lite monorepo, especially ESM-first imports/exports, package directory organization, and kebab-case file or directory naming.
---

## Codebase Modernizer

Use this skill when the task touches code optimization, modernization, module import/export style, package directory layout, file naming, or directory naming in `taro-lite`.

This skill is for source-level modernization work. For modernization document/status updates, also use `modernization-updater`. For package boundary or workspace membership decisions, also use `package-boundary-reviewer`.

### Project direction

The repository has converged to 8 active packages. The next phase is code optimization toward a fully modernized codebase that is easier to understand as a mini-program base implementation.

Optimize for:

- clear source architecture;
- modern JavaScript and TypeScript patterns;
- ESM-first imports and exports where compatible with the current build and publish pipeline;
- predictable package, directory, and file organization;
- readable base-source learning experience for maintainers.

### Decision principles

Use first-principles reasoning before and during modernization work:

1. Trace motivation first. When the physical or product motivation is unclear, stop and ask Socratic clarification questions instead of assuming the target.
2. Prefer the shortest logical path. If the current approach is not the minimum-complexity solution, propose the simpler architecture directly.
3. Track root causes. Do not implement patch-style fixes; connect bug fixes and feature choices to the underlying runtime, language, or build-system reason.
4. Apply Occam's razor. Prefer native language, platform, and repository primitives unless an added dependency or abstraction clearly lowers total entropy.
5. Communicate minimally. Report only decision-changing facts, blockers, and validation results.

### Modernization principles

Prefer these defaults unless current code, tooling, or runtime compatibility proves otherwise:

1. Use ESM-style `import` and `export` for source code.
2. Avoid new CommonJS patterns such as `require`, `module.exports`, or `exports.*` in TypeScript/modern source files.
3. Keep CommonJS only when required by Node runtime entrypoints, legacy tool contracts, or package publish compatibility.
4. Prefer named exports for reusable utilities and domain modules when compatible with existing API shape.
5. Use default exports only when the surrounding package already has a strong convention, the exported value is naturally singleton-like, or a public contract already depends on it.
6. Keep public entrypoints explicit and narrow. Do not expose internal modules accidentally through broad barrel exports.
7. Preserve existing runtime behavior before performing stylistic refactors.

### Directory and naming conventions

Use kebab-case for new or renamed source directories and files. For case-only renames, rename through a distinct intermediate or final filename that Git can track reliably on case-insensitive filesystems.

Examples:

- `native-binding-loader.ts`
- `mini-program-config.ts`
- `vite-plugin-weapp.ts`
- `runtime-hooks/`
- `build-pipeline/`

Avoid introducing new PascalCase, camelCase, snake_case, or mixed-case file and directory names unless an external contract requires them.

Allowed exceptions:

- package names and scoped npm package names;
- framework-required filenames;
- generated artifacts;
- platform-specific native binding names;
- files whose names are part of a documented public API or external tool convention.

### Package and source layout guidance

When reorganizing package directories:

1. Identify the package's public API surface before moving files.
2. Separate public entrypoints from internal implementation modules.
3. Group source by responsibility rather than by vague technical buckets.
4. Prefer small cohesive folders over deep nesting.
5. Keep cross-package dependencies aligned with the intended public/private package boundary.
6. Avoid circular dependencies and hidden imports through build output paths.
7. Update imports, package exports, tests, fixtures, and release checks together when moving files.

Suggested source folder vocabulary when it fits the package:

- `entrypoints/` for CLI, runtime, or build entry modules;
- `runtime/` for code executed in the mini-program runtime;
- `compiler/` or `transform/` for source transforms;
- `build/` or `build-pipeline/` for build orchestration;
- `plugins/` for Vite/Rollup/Taro plugin implementations;
- `shared/` for package-local shared utilities only;
- `types/` for package-local type declarations.

Do not create broad folders such as `utils/`, `common/`, or `helpers/` unless the contents are package-local and cohesive. Prefer a domain-specific name.

### Refactor workflow

Before editing code:

1. Search for existing implementation and references. Do not assume the target file is the only relevant place.
2. Check package `package.json` fields such as `type`, `main`, `module`, `exports`, `types`, and build scripts before changing module syntax or entrypoints.
3. Check `tsconfig` and build tooling when ESM/CJS behavior may change.
4. If moving or renaming files, update all imports in the same change.
5. If touching package boundaries, apply `package-boundary-reviewer`.
6. If touching runtime/build behavior for React 19 + Vite + WeApp + Skyline/glass-easel, apply `vite-weapp-debugger`.
7. If editing code, apply `spcsn-taro-lite-quality-gate`.

### Review checklist

For every modernization change, verify:

- imports and exports use ESM where feasible;
- no new broad barrel export leaks private implementation;
- new or renamed files and directories use kebab-case;
- package public API remains intentional;
- dependency direction still matches public/private package boundaries;
- the change improves readability instead of only moving code around;
- tests, fixtures, and release checks cover the affected behavior.

### Validation expectations

Choose the smallest validation set that proves the change:

- Run lints or type checks for touched packages when available.
- Run focused tests for moved or refactored modules.
- Run `pnpm run verify:fixture:weapp` when build/runtime behavior can affect business projects.
- Run `pnpm run release:check -- --skip-bindings` when package entrypoints, exports, or publish surface changes.

Do not suppress TypeScript, lint, or format checks to complete modernization. Fix the underlying issue.
