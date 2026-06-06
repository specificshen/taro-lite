# `@spcsn/taro-runtime`

`@spcsn/taro-runtime` 是小程序运行时基础包，负责连接 React 渲染结果、小程序生命周期、页面配置和 DOM-like 抽象。

## 包定位

- 内部实现包，不是业务侧显式安装入口。
- 被 `@spcsn/taro` 和 `@spcsn/taro-mini-runner` 直接依赖。
- 当前仍需要独立发布，因为构建产物会生成对 `@spcsn/taro-runtime` 的运行时代码引用。

## 核心能力

- `createReactApp()`: 创建小程序 `App` 构造函数可接收的应用配置对象。
- `createPageConfig()`: 创建小程序 `Page` 构造函数可接收的页面配置对象。
- `window`、`document`、`navigator`: 小程序端 DOM-like / BOM-like 兼容对象。
- `Current`: 当前应用、页面和路由上下文。
- `eventCenter`、`Events`: Taro 事件机制。
- `options`: 运行时配置，例如 `debug` 与 `prerender`。

## 支持范围

当前只维护 React 开发 WeApp 小程序运行时。H5、React Native、Vue 和 Webpack 相关描述均不再作为维护目标。

## 收敛说明

后续如果要把本包并入 `@spcsn/taro`，需要先保证 runner 生成代码不再直接引用 `@spcsn/taro-runtime` 包名，或确保该引用可以稳定解析到公开入口包内置产物。
