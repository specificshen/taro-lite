---
name: project_skill_location
description: taro-lite 项目专属 agent skills 应存放在仓库内而不是全局 skills 目录
type: feedback
createdAt: 2026-06-05T11:26:55
---
taro-lite 项目专属 skills 应放在仓库内的 `.agents/skills/`，不要放到全局 `~/.agents/skills/`。
Why: 用户指出这些 skill 都属于当前项目，应该随项目沉淀。
How to apply: 为 `/Users/shen/Desktop/study/taro-lite` 编写或调整项目专属 skill 时，使用项目内 `.agents/skills/`；只有跨项目通用 skill 才放全局。