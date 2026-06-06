# `@spcsn/taro-shared`

`@spcsn/taro-shared` 是 Taro Lite 的内部共享工具包，提供类型判断、错误断言、组件声明、运行时 hooks 和平台常量等基础能力。

## 包定位

- 内部实现包，不是业务侧显式安装入口。
- 被 `@spcsn/taro`、`@spcsn/taro-runtime`、`@spcsn/taro-service`、`@spcsn/taro-cli` 和 `@spcsn/taro-mini-runner` 复用。
- 当前仍需要作为独立包发布，直到公开入口包可以把内部依赖稳定打入自身产物。

## 维护约束

- 保持平台无关，不引入 Node、浏览器或小程序专属 API。
- 优先使用具名导出，避免引入会影响 tree-shaking 的全局副作用。
- 不向业务项目暴露新的显式接入约定。
