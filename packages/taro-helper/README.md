# `@spcsn/taro-helper`

`@spcsn/taro-helper` 是 Taro Lite 的内部编译时工具包，主要供 CLI、service、runner 和构建脚本复用。

## 包定位

- 内部实现包，不是业务侧显式安装入口。
- 提供配置加载、路径解析、文件系统封装、终端输出、依赖解析、SWC 注册和常量定义等能力。
- 当前仍需要独立发布，因为 CLI、service、runner 和组件类型生成脚本都会直接解析它。

## SWC 说明

执行 `build` 命令时，会把 `swc-backup` 里的 `.wasm` 文件移动到 `swc` 目录。这样不关注 SWC 插件开发的维护者无需配置 Rust 环境。

如果需要修改 SWC 插件，请参考仓库根目录 `CONTRIBUTING.md` 中的 Rust 相关说明。

## 维护约束

- 不新增业务可感知 API。
- 工具函数应保持 Node 侧编译时语义，不混入小程序运行时逻辑。
- 若要继续收敛本包，应先把 CLI、service、runner 的构建产物改造成可稳定内联 helper 代码。
