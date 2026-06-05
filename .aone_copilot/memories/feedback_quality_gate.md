---
name: 检查忽略应优先修复而非绕过
description: 用户要求清理项目中绕过 TypeScript、ESLint 或格式检查的忽略写法，优先修复问题而不是继续忽略。
type: feedback
createdAt: 2026-06-05T17:12:55
---
不要通过 `@ts-nocheck`、`@ts-ignore`、`eslint-disable`、格式化忽略或 `tsc || true` 等方式绕过检查；在涉及的范围内应优先修复类型、lint 或格式问题。

Why: 用户希望项目更工整、代码更健壮，不要继续累积检查绕过。

How to apply: 修改代码时如果碰到已有检查忽略，优先移除并修复根因；仅在外部未类型化行为等确实无法安全建模时保留最小范围忽略，并说明原因。