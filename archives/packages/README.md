# Package Archive

> 这里存放已从活跃 workspace 迁出的历史 `@spcsn/*` 包源码。
> 归档包不再参与 workspace 安装、`pnpm -r build` 和发布判断，仅供历史追溯与迁移参考。
> 业务接入仍以仓库根目录 `README.md` 的三入口契约为准。

## 归档原则

1. 业务只认三个入口包：`@spcsn/taro`、`@spcsn/taro-components`、`@spcsn/taro-cli`。
2. 归档不是删除历史，而是把历史包从活跃构建面移走。
3. 先拆发布面，再拆源码引用，最后拆 workspace。
4. 任何内部能力若仍被入口包直接解析，说明还不能归档到“完全离线”状态。

## 当前状态

内部能力已完全源码级内联到三入口包中：

- `@spcsn/taro-runtime` 的源码已内联到 `packages/taro/src/runtime/`，由 `@spcsn/taro` 统一构建并暴露 `./runtime` 子路径。
- `@spcsn/taro-helper`、`@spcsn/taro-service`、`@spcsn/taro-mini-runner`、`@spcsn/taro-shared` 的源码已内联到 `packages/taro-cli/src/internal/`。
- `archives/packages/` 下的子目录仅保留历史 `package.json`、测试和 README，不再出现在 `pnpm-workspace.yaml` 中。
- `@spcsn/taro` 与 `@spcsn/taro-cli` 均已清空 `bundleDependencies`。

## 子目录说明

- `taro-runtime/`：原运行时实现历史归档，活跃实现已迁移到 `packages/taro/src/runtime/`。
- `taro-shared/`：原共享工具历史归档，活跃实现已迁移到 `packages/taro-cli/src/internal/taro-shared/`。
- `taro-service/`：原 CLI 服务层历史归档，活跃实现已迁移到 `packages/taro-cli/src/internal/taro-service/`。
- `taro-mini-runner/`：原小程序构建 runner 历史归档，活跃实现已迁移到 `packages/taro-cli/src/internal/taro-mini-runner/`。
- `taro-helper/`：原 CLI helper 历史归档，活跃实现已迁移到 `packages/taro-cli/src/internal/taro-helper/`。

## 如何归档一个包

1. 确认该包不再被任何活跃入口包（`@spcsn/taro`、`@spcsn/taro-components`、`@spcsn/taro-cli`）直接依赖。
2. 确认该包不再被 `scripts/check-release-readiness.ts` 视为必须发布的公共包。
3. 将包目录从 `packages/<package-name>/` 移动到 `archives/packages/<package-name>/`。
4. 在本目录下为归档包补一个简短 `README.md`，说明其历史角色和归档原因。
5. 运行 `pnpm run release:check` 确认发布面未受影响。
6. 在 `docs/package-archive-plan.md` 和 `docs/package-consolidation.md` 中更新状态。
