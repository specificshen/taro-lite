---
name: skill-namer
description: Use when the user provides a raw AI Agent Skill name or capability description and wants better skill naming recommendations with action-oriented imperative and role-style options.
---

## Skill Namer

Use this skill when the user asks to name, rename, evaluate, or improve an AI Agent Skill name.

### Goal

Recommend names that are intuitive for both:

- **DX**: the model can accurately infer when to trigger the skill.
- **UX**: developers and users can quickly understand the skill's responsibility.

Avoid cold, static noun piles. Prefer names that imply action and usage.

### Naming principles

1. Every recommendation must include an **action**:
   - A leading verb, such as `sync`, `update`, `generate`, `review`, `debug`, `prepare`, `bind`, `commit`, `name`.
   - Or a role-style action suffix, such as `-syncer`, `-updater`, `-generator`, `-reviewer`, `-debugger`, `-preparer`, `-binder`, `-committer`, `-namer`.
2. Provide two mental models:
   - **Imperative style**: a command or action trigger. Formula: `[verb] + [object/domain]`, for example `sync-progress`.
   - **Role style**: a dedicated tool/persona. Formula: `[domain] + [action noun suffix]`, for example `progress-syncer`.
3. Remove redundant context prefixes automatically:
   - If the skill is local to a project, do not repeat the project name unless it is needed to disambiguate outside that project.
   - Example: inside a Taro Lite project, prefer `update-modernization` over `project-modernization-status`.
4. Prefer short, memorable names:
   - Use 2-4 meaningful words.
   - Use lowercase kebab-case unless the host project explicitly uses another style.
   - Avoid vague words such as `helper`, `tool`, `manager`, or `status` unless paired with a clear action.
5. Preserve important domain terms:
   - Keep product, platform, or workflow terms that affect trigger accuracy.
   - Remove only redundant prefixes, not essential scope.

### Workflow

When the user provides a raw skill name or capability description, respond with exactly these sections:

### 🎯 【命令式推荐】

Provide 1-2 names suitable for pure function or action-trigger usage.

### 🤖 【角色式推荐】

Provide 1-2 names suitable for always-available tools, assistants, or Agent plugins.

### 📝 解释

Give one concise sentence explaining why the recommended names are better than the original name. Focus on the pain point: missing action, redundant context, unclear responsibility, or weak trigger semantics.

### Recommendation checklist

Before answering, verify that:

- Each recommended name includes an action or action suffix.
- No recommendation is a purely static noun phrase.
- Redundant local project prefixes have been removed.
- The name still preserves enough domain meaning for reliable trigger matching.
- The answer stays concise and does not include unrelated implementation detail.

### Examples

Input: `project-modernization-status`

### 🎯 【命令式推荐】

- `update-modernization`
- `review-modernization`

### 🤖 【角色式推荐】

- `modernization-updater`
- `modernization-reviewer`

### 📝 解释

这些名字去掉了当前项目内冗余的 `spcsn-taro-lite` 前缀，并用 `update/review` 明确触发动作，比静态的 `status` 更容易被模型和人理解。

Input: `Chinese commit message for taro-lite`

### 🎯 【命令式推荐】

- `write-chinese-commit`
- `generate-commit-message`

### 🤖 【角色式推荐】

- `commit-message-generator`
- `chinese-commit-writer`

### 📝 解释

这些名字把“提交信息生成”这个动作前置或后缀化，避免只描述产物，让触发场景更明确。
