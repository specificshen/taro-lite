# @spcsn/taro-service

> 已归档。本包不再作为公开发布包，仅保留历史源码供追溯。

## 历史角色

CLI 服务内核，负责：

- 插件与 preset 的解析、加载与执行
- 构建配置合并
- CLI 命令调度框架

## 归档原因

服务内核是 `@spcsn/taro-cli` 的私有实现细节。为把公开包收敛到三入口，`@spcsn/taro-service` 的代码通过 `bundleDependencies` 随 `@spcsn/taro-cli` 一起发布，不再单独对外发布。
