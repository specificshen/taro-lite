# `@spcsn/taro-service`

Taro 插件化服务核心，基于 [tapable](https://github.com/webpack/tapable) 实现的生命周期钩子与插件管理系统。负责编排 CLI 命令执行流程，加载和调度各构建插件（runner、platform 等）。

## 主要功能

- 插件注册与加载
- 生命周期钩子（onBuildStart / onBuildFinish 等）
- 构建配置合并（基于 webpack-merge 策略）
- 命令扩展（`ctx.registerCommand`）

## 依赖

- `@spcsn/taro-helper` — 工具函数
- `@spcsn/taro-runner-utils` — Vite 构建工具集
- `@spcsn/taro-shared` — 共享类型与常量
- `tapable` — 钩子系统
- `joi` — 配置校验
