# `@spcsn/taro`

`@spcsn/taro` 是业务代码使用的核心运行时 API 入口，面向 React 19 + Vite + 微信小程序（Skyline / glass-easel）链路。

## 包定位

- 业务侧公开依赖，应由小程序应用显式安装。
- 提供 Taro API、生命周期 hooks、配置类型和小程序端运行时入口。
- 依赖 `@spcsn/taro-runtime` 与 `@spcsn/taro-shared`，它们目前仍是发布期实现依赖。

## 发布入口

- `index.js`: 兼容入口，运行时加载 `dist/index.js`。
- `dist/index.js`: 由源码通过 Rolldown 构建生成的小程序端入口。
- `types/index.d.ts`: 业务项目使用的类型声明入口。

## 支持范围

当前只维护 React + Vite + WeApp 小程序路径。H5、React Native、Harmony、Vue、Solid、Nerv 和 Webpack 不属于本包的维护目标。
