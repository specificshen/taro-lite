# Package Consolidation Plan

> 本文是底座内部包收敛计划，不是业务接入指导。业务接入请以仓库根目录 `README.md` 的最小依赖和配置示例为准。

目标：把 `@spcsn` 小程序底座从“继承上游 monorepo 的多包发布形态”收敛为少量稳定入口，降低发版、安装和业务认知成本。

## 现状

当前仓库仍保留较多上游拆包：CLI、service、runner、platform、framework、runtime、shared、helper、Babel/PostCSS 插件、native binding 平台包等。

这对内部开发有帮助，但对业务接入不是好体验。业务工程真正应该认知的包只有：

- `@spcsn/taro`
- `@spcsn/taro-components`
- `@spcsn/taro-cli`

native binding 相关包属于安装期实现细节，业务不应显式依赖。

## 收敛目标

第一阶段目标：保留当前能力边界，先把对外发布面收敛到 10 个左右。

已完成：

- `@spcsn/taro-plugin-generator` 已并入 `@spcsn/taro-cli`，不再作为公开发布包。
- `@spcsn/postcss-plugin-constparse` 当前未接入构建链，已从 `@spcsn/taro-vite-runner` 依赖和公开发布面移除。
- `@spcsn/postcss-html-transform` 与 `@spcsn/postcss-pxtransform` 已并入 `@spcsn/taro-vite-runner`，不再作为公开发布包。
- `@spcsn/babel-plugin-transform-taroapi` 当前未接入 `@spcsn/taro-vite-runner` 构建链，已从依赖和公开发布面移除。
- `@spcsn/babel-preset-taro` 已改为 `@spcsn/taro-cli/babel-preset-taro` 子路径能力，不再作为公开发布包。
- `@spcsn/taro-plugin-framework-react` 已并入 `@spcsn/taro-vite-runner`，不再作为公开发布包。
- `@spcsn/taro-plugin-platform-weapp` 已并入 `@spcsn/taro-cli`，不再作为公开发布包。
- `@spcsn/taro-api` 已并入 `@spcsn/taro`，不再作为公开发布包。
- `@spcsn/taro-react` 已并入 `@spcsn/taro-vite-runner`，不再作为公开发布包。
- `@spcsn/taro-runner-utils` 已并入 `@spcsn/taro-service` 与 `@spcsn/taro-vite-runner`，不再作为公开发布包。
- 已收敛的历史 private 包已移至 `archive/legacy-packages/`，不再位于活跃 `packages/` 目录，也不参与 workspace 安装和递归构建。

必须保留的公开入口：

- `@spcsn/taro`
- `@spcsn/taro-components`
- `@spcsn/taro-cli`
- `@spcsn/taro-binding`
- `@spcsn/taro-binding-darwin-arm64`
- `@spcsn/taro-binding-darwin-x64`
- `@spcsn/taro-binding-linux-arm64-gnu`
- `@spcsn/taro-binding-linux-x64-gnu`
- `@spcsn/taro-binding-linux-x64-musl`
- `@spcsn/taro-binding-win32-x64-msvc`

第二阶段目标：如果 CI 能稳定产出 `darwin-universal`，把两个 macOS 平台包合并为：

- `@spcsn/taro-binding-darwin-universal`

这样实际发布包可以降到 9 个。

## 内部包处理方向

以下包优先改为内部实现，不再作为业务可感知发布包：

- `@spcsn/taro-service`
- `@spcsn/taro-vite-runner`
- `@spcsn/taro-helper`
- `@spcsn/taro-shared`
- `@spcsn/taro-runtime`

注意：这些包不能直接设为 `private: true` 后停止发布。当前 `@spcsn/taro`、`@spcsn/taro-cli`、`@spcsn/taro-components` 仍会在 npm 安装时解析它们。正确路径是先调整构建产物，把内部包打进公开入口包的 `dist`，再移除公开入口包里的内部 npm 依赖。

## 建议顺序

1. `1.0.0` 先保持全量发布，保证生产业务不受影响。
2. 先收敛 CLI 侧：把 service、runner、platform、framework、generator、Babel/PostCSS 插件打入 `@spcsn/taro-cli`。
3. 再收敛运行时侧：把 api、runtime、react、shared 打入 `@spcsn/taro`。
4. 最后处理 `@spcsn/taro-components` 对 runtime/shared/taro 的依赖关系，避免循环和重复打包。
5. 每完成一个阶段，用真实业务工程验证 `pnpm install` 和 `npm run build`。
