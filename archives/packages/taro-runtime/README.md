# @spcsn/taro-runtime

> 已归档。本包不再作为公开发布包，仅保留历史源码供追溯。

## 历史角色

小程序运行时核心，提供：

- 小程序 DOM/BOM  polyfill（`TaroElement`、`TaroText`、`document`、`window` 等）
- 页面/组件生命周期钩子
- React  reconciler 连接层
- 原生 API 适配（`processApis`）
- 模板渲染抽象（`RecursiveTemplate` / `UnRecursiveTemplate`）

## 归档原因

运行时能力是 `@spcsn/taro` 的私有实现细节。为把公开包收敛到三入口，`@spcsn/taro-runtime` 的代码已 bundle 进 `@spcsn/taro` 的 `dist/index.js`，并通过 `bundleDependencies` 随 `@spcsn/taro` 一起发布。

本包源码迁入归档目录，供后续参考与问题追溯。
