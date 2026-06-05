---
name: chinese-commit-writer
description: Use when committing changes in this monorepo and the user asks for a concise Chinese commit message.
---

## Chinese Commit Writer

Use this skill when the user asks to commit changes in `taro-lite` using Chinese.

### Commit message rule

Write commit messages in concise Chinese.

Preferred format:

```text
<类型>: <中文摘要>
```

Examples:

```text
docs: 同步 React-only 改造状态
fix: 修复 WeApp 平台运行时导入
chore: 更新项目级 Agent skill
```

### Before committing

1. Check `git status --short`.
2. Check `git diff --check`.
3. Ensure only intended files are staged.
4. For documentation-only changes, no build is required unless the user asks.

### After committing

Run `git status --short` and report the commit hash plus whether the worktree is clean.
