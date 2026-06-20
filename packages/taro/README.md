# `@spcsn/taro`

`@spcsn/taro` 是业务代码使用的核心运行时 API 入口，面向 React 19 开发微信小程序（Skyline / glass-easel）链路。

## 包定位

- 业务侧公开依赖，应由小程序应用显式安装。
- 提供 Taro API、生命周期 hooks、配置类型和小程序端运行时入口。
- 运行时源码已内联到本包，并通过 `./runtime` 子路径导出；该子路径由 `@spcsn/taro-cli` 在构建期引用并注入到小程序运行时代码中，业务项目不应直接 import。

## 发布入口

- `index.js`: 兼容入口，运行时加载 `dist/index.js`。
- `dist/index.js`: 由源码通过 Rolldown 构建生成的小程序端入口。
- `types/index.d.ts`: 业务项目使用的类型声明入口。

## 支持范围

当前只维护 React 开发 WeApp 小程序路径。H5、React Native、Harmony、Vue、Solid、Nerv 和 Webpack 不属于本包的维护目标。
