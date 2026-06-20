# @spcsn/taro-helper

> 已归档。本包不再作为公开发布包，仅保留历史源码供追溯。

## 历史角色

CLI 与构建过程使用的通用工具集合，包括：

- 路径与模块解析
- 配置读取与归一化
- 文件系统辅助函数
- 常量与类型定义

## 归档原因

辅助工具是 `@spcsn/taro-cli` 的私有实现细节。为把公开包收敛到三入口，`@spcsn/taro-helper` 的代码通过 `bundleDependencies` 随 `@spcsn/taro-cli` 一起发布，不再单独对外发布。
