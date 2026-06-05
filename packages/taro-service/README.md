# `@spcsn/taro-service`

`@spcsn/taro-service` 是 CLI 内部使用的插件化服务核心，基于 [tapable](https://github.com/webpack/tapable) 编排命令、生命周期钩子和构建插件。

## 包定位

- 内部实现包，不是业务侧显式安装入口。
- 由 `@spcsn/taro-cli` 直接使用，承载配置加载、插件注册、命令扩展和平台插件基础类。
- 当前仍需要独立发布，因为 CLI 入口和测试仍直接解析 `@spcsn/taro-service`。

## 主要功能

- 插件注册与加载。
- 生命周期钩子，例如 `onBuildStart`、`onBuildFinish`。
- 项目配置读取、校验与合并。
- 命令扩展，例如 `ctx.registerCommand`。
- 小程序平台插件基础能力。

## 依赖

- `@spcsn/taro-helper`: 编译时工具函数。
- `@spcsn/taro-shared`: 共享类型与常量。
- `tapable`: 钩子系统。
- `joi`: 配置校验。

## 收敛说明

后续如果要把本包并入 `@spcsn/taro-cli`，需要先调整 CLI 构建方式，把 service 代码和类型稳定打入 CLI 发布产物，再移除 CLI 对该包的 npm 级依赖。
