# @spcsn/taro-mini-runner

> 已归档。本包不再作为公开发布包，仅保留历史源码供追溯。

## 历史角色

小程序构建运行器，负责：

- 小程序页面/组件入口生成
- 模板编译与渲染层拼接
- React 19 小程序框架运行时连接
- Vite 构建流水线封装

## 归档原因

构建运行器是 `@spcsn/taro-cli` 的私有实现细节。为把公开包收敛到三入口，`@spcsn/taro-mini-runner` 的代码通过 `bundleDependencies` 随 `@spcsn/taro-cli` 一起发布，不再单独对外发布。
