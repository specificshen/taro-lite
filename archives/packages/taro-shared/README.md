# @spcsn/taro-shared

> 已归档。本包不再作为公开发布包，仅保留历史源码供追溯。

## 历史角色

早期各包之间共享的工具集合，包括：

- 基础类型判断（`is.ts`）
- 通用工具函数（`utils.ts`）
- 小程序组件元数据（`components.ts`）
- 原生 API 处理（`native-apis.ts`）
- 模板基类（`template.ts`）

## 归档原因

共享包是内部实现细节，不应作为业务接入依赖。随着 `@spcsn/taro-runtime` 等包把所需能力本地化，本包不再被活跃入口包直接依赖，因此整体归档。
