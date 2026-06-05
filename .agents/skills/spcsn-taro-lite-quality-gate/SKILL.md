---
name: spcsn-taro-lite-quality-gate
description: Use when editing code in the @spcsn Taro Lite monorepo to avoid suppressing TypeScript, lint, or format checks and to fix violations instead.
---

## SPCSN Taro Lite Quality Gate

Use this skill whenever editing code in `taro-lite`, especially TypeScript, build tooling, runner, CLI, or package-boundary code.

### Core rule

Do not rely on suppressions to make code pass checks. Prefer fixing the underlying type, lint, or formatting issue.

Avoid adding new:

- `// @ts-nocheck`
- `// @ts-ignore`
- unnecessary `// @ts-expect-error`
- `eslint-disable` comments
- `biome-ignore` comments
- broad `any` types when a local interface is easy to define
- scripts that hide failures with `|| true`

If an existing suppression is in code you touch, try to remove it and fix the typed shape locally.

### When a suppression is unavoidable

Only keep a suppression if all are true:

1. The surrounding API is genuinely untyped external behavior.
2. A narrow local type would be misleading or much riskier.
3. The suppression is as small as possible.
4. The reason is documented near the code.

Do not use file-level suppressions for localized issues.

### Validation expectations

After code edits:

- Run `read_lints` on modified files when available.
- Run `git diff --check`.
- Run the narrowest relevant build/test command.
- For WeApp build-chain changes, run `pnpm run verify:fixture:weapp`.

If an existing package script contains `tsc || true`, report whether TypeScript errors are pre-existing or introduced by the current change. Do not add new hidden-failure scripts.
