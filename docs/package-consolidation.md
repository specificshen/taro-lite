# Package Consolidation Plan

> 本文是底座内部包收敛计划，不是业务接入指导。业务接入请以仓库根目录 `README.md` 的最小依赖和配置示例为准。

目标：把 `@spcsn` 小程序底座从“继承上游 monorepo 的多包发布形态”收敛为少量稳定入口，降低发版、安装和业务认知成本。

## 现状

当前仓库仍保留较多上游拆包：CLI、service、runner、platform、framework、runtime、shared、helper、Babel/PostCSS 插件等。

这对内部开发有帮助，但对业务接入不是好体验。业务工程真正应该认知的包只有：

- `@spcsn/taro`
- `@spcsn/taro-components`
- `@spcsn/taro-cli`

## 收敛目标

第一阶段目标：保留当前能力边界，先把对外发布面收敛到当前 `packages/*` 发布集合。

已完成：

- `@spcsn/taro-plugin-generator` 已并入 `@spcsn/taro-cli`，不再作为公开发布包。
- `@spcsn/postcss-plugin-constparse` 当前未接入构建链，已从 `@spcsn/taro-mini-runner` 依赖和公开发布面移除。
- `@spcsn/postcss-html-transform` 与 `@spcsn/postcss-pxtransform` 已并入 `@spcsn/taro-mini-runner`，不再作为公开发布包。
- `@spcsn/babel-plugin-transform-taroapi` 当前未接入 `@spcsn/taro-mini-runner` 构建链，已从依赖和公开发布面移除。
- `@spcsn/babel-preset-taro` 已改为 `@spcsn/taro-cli/babel-preset-taro` 子路径能力，不再作为公开发布包。
- `@spcsn/taro-plugin-framework-react` 已并入 `@spcsn/taro-mini-runner`，不再作为公开发布包。
- `@spcsn/taro-plugin-platform-weapp` 已并入 `@spcsn/taro-cli`，不再作为公开发布包。
- `@spcsn/taro-api` 已并入 `@spcsn/taro`，不再作为公开发布包。
- `@spcsn/taro-react` 已并入 `@spcsn/taro-mini-runner`，不再作为公开发布包。
- `@spcsn/taro-runner-utils` 已并入 `@spcsn/taro-service` 与 `@spcsn/taro-mini-runner`，不再作为公开发布包。
- 临时现代化 CLI 包 `@spcsn/taro-core` 已合并回 `@spcsn/taro-cli`，`taro-core` 不再作为独立包存在。
- 已收敛的历史 private 包已从仓库删除，不再位于活跃 `packages/` 目录，也不参与 workspace 安装和递归构建。
- `@spcsn/taro-cli` 已移除对 `@spcsn/taro-components` 与 `@spcsn/taro-shared` 的直接依赖，改由内部运行时导出层承接相关能力。
- `@spcsn/taro` 已移除对 `@spcsn/taro-shared` 的直接依赖，并清理 `@spcsn/taro-components` 的开发依赖。
- `scripts/check-release-readiness.ts` 已新增依赖边界闸门，防止上述直连依赖回退。
- `@spcsn/taro-runtime` 的打包 external 已覆盖 `@spcsn/taro-shared/*` 子路径，避免 shared 子路径被误打入 runtime 产物。
- `@spcsn/taro-runtime` 已将 primitives/hooks/shortcuts/event-emitter/controlled-components 内聚到包内，shared 直连引用面已显著收敛。
- `@spcsn/taro-runtime` 已新增 `internal-components-registry` 作为 shared 组件映射能力的单点收口层，避免散点直连。
- `@spcsn/taro-runtime` 已新增 `process-apis` 与 `template-adapter` 作为 shared 能力单点收口层，入口层不再直接依赖 shared。

必须保留的公开入口：

- `@spcsn/taro`
- `@spcsn/taro-components`
- `@spcsn/taro-cli`

原 Rust crate、二进制扩展和平台 npm 包链路已移除，`createProject` 改由 `@spcsn/taro-cli` 内部 TypeScript 实现。

## 内部包处理方向

以下包已改为内部实现，不再作为业务可感知发布包，并迁入 `archives/packages/`：

- `@spcsn/taro-service`
- `@spcsn/taro-mini-runner`
- `@spcsn/taro-helper`
- `@spcsn/taro-shared`
- `@spcsn/taro-runtime`

处理方式：

- 这些包已标记 `private: true`，不再公开发布。
- `@spcsn/taro-runtime` 的源码已内联到 `packages/taro/src/runtime/`，由 `@spcsn/taro` 统一构建并暴露 `./runtime` 子路径。
- `@spcsn/taro-helper`、`@spcsn/taro-service`、`@spcsn/taro-mini-runner`、`@spcsn/taro-shared` 的源码已内联到 `packages/taro-cli/src/internal/`。
- `@spcsn/taro` 与 `@spcsn/taro-cli` 均已清空 `bundleDependencies`。
- `@spcsn/taro-cli` 仅保留对 `@spcsn/taro` 的 workspace 依赖，用于构建期引用 `@spcsn/taro/runtime`。

业务工程安装时仍只需要：

- `@spcsn/taro`
- `@spcsn/taro-components`
- `@spcsn/taro-cli`

## 建议顺序（已完成）

1. `1.0.0` 先保持全量发布，保证生产业务不受影响。
2. 先收敛 CLI 侧：把 service、runner、platform、framework、generator、Babel/PostCSS 插件打入 `@spcsn/taro-cli`。
3. 再收敛运行时侧：把 api、runtime、react、shared 打入 `@spcsn/taro`。
4. 最后处理 `@spcsn/taro-components` 对 runtime/shared/taro 的依赖关系，避免循环和重复打包。
5. 每完成一个阶段，用真实业务工程验证 `pnpm install` 和 `npm run build`。

收敛已执行到位：所有内部能力都已源码级内联，不再依赖 `bundleDependencies` 或 workspace 内的归档包构建产物。

## 历史包归档

按 `docs/package-archive-plan.md`，以下内部实现包已迁入 `archives/packages/`，不再出现在 `packages/` 活跃目录，也不再作为公开发布包：

- `@spcsn/taro-runtime`
- `@spcsn/taro-shared`
- `@spcsn/taro-service`
- `@spcsn/taro-mini-runner`
- `@spcsn/taro-helper`

这些归档目录仅保留历史 `package.json`、测试与 README，已不再出现在 `pnpm-workspace.yaml` 中，不参与 workspace 安装、`pnpm -r build` 与 `release:check`。
