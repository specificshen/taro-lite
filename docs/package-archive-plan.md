# Package Archive Plan

> 本文是底座内部包归档与收敛规划，不是业务接入指导。业务接入仍以 `README.md` 的三入口契约为准。

## 目标

把活跃 workspace 收敛为只保留 3 个业务入口包：

- `@spcsn/taro`
- `@spcsn/taro-components`
- `@spcsn/taro-cli`

其它 `@spcsn/*` 包统一迁出活跃 `packages/`，归档到单独目录，避免继续参与日常 workspace 安装、构建和发布判断。

## 归档目录

建议新建：

- `archives/packages/`

归档目录只保留历史源码、说明和必要的迁移备注，不再作为活跃 workspace 成员。

## 归档原则

1. 业务只认三个入口包，其他包不再作为正常接入依赖。
2. 归档不是删除历史，而是把历史包从活跃构建面移走。
3. 先拆发布面，再拆源码引用，最后拆 workspace。
4. 任何内部能力若仍被入口包直接解析，说明还不能归档到“完全离线”状态。

## 迁移顺序

### 第一阶段：冻结活跃边界

- 保持 `README.md` 的三入口最小依赖不变。
- 保持 `release:check` 对三入口与内部包边界的闸门。
- 记录当前仍被入口包解析的内部依赖，避免误归档。

### 第二阶段：整理归档目录

- 将非入口包移动到 `archives/packages/<package-name>/`。
- 保留每个包的 `package.json`、`src/`、`tests/` 和必要脚本。
- 为每个归档包补一个简短 `README.md`，说明其历史角色和归档原因。

### 第三阶段：切 workspace

- 从 `pnpm-workspace.yaml` 移除归档目录以外的历史包路径。
- 确认 `pnpm -r` 只遍历三入口包与少量仍需保留的内部实现包。
- 如果某个内部实现包仍必须活跃发布，则单独列为“临时内部实现包”，不能和历史归档包混在一起。

### 第四阶段：收尾依赖

- 逐步把入口包对内部实现包的依赖，迁移成入口包内的本地实现或更小的适配层。
- 当某个内部包不再被任何活跃入口直接依赖时，再移动到归档目录。

## 验收标准

- 活跃 `packages/` 目录只保留 3 个业务入口包。
- 归档包不再参与 workspace 安装、`pnpm -r build` 和 `release:check` 的活跃发布面。
- `README.md` 仍只展示三入口业务契约。
- 新窗口可以只围绕“三入口 + 归档目录”推进，不需要再回看大量历史包。

## 当前状态

已完成规划目标，并进一步把内部能力完全内联到入口包源码中。

- 活跃 `packages/` 目录只保留 3 个业务入口包：`@spcsn/taro`、`@spcsn/taro-components`、`@spcsn/taro-cli`。
- `@spcsn/taro-runtime` 的源码已内联到 `packages/taro/src/runtime/`，由 `@spcsn/taro` 统一构建并暴露 `./runtime` 子路径（仅供 `@spcsn/taro-cli` 构建期使用）。
- `@spcsn/taro-helper`、`@spcsn/taro-service`、`@spcsn/taro-mini-runner`、`@spcsn/taro-shared` 的源码已内联到 `packages/taro-cli/src/internal/`。
- `archives/packages/` 仍保留历史 `package.json`、测试与 README，但已不再参与 workspace，也不进入发布面。
- `@spcsn/taro-cli` 保留对 `@spcsn/taro` 的依赖（用于 `@spcsn/taro/runtime` 构建期引用），不再依赖任何其它 `@spcsn/*` 内部包。
- `release:check` 只认可 3 个公开业务入口包；`bundleDependencies` 已清空。
