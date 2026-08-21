# @spcsn/taro-cli

## 定位

`@spcsn/taro-cli` 是 SPCSN Taro Lite 的 CLI 入口，承载配置解析、初始化、平台插件、doctor 等能力。业务用户通过 `bin/taro` 调用，业务工程配置通过 `import { defineConfig } from '@spcsn/taro-cli'` 引用。

## Bun-only 约定

- **运行时**：本包只支持 Bun（>= 1.4，`engines.bun`），不支持 Node.js 运行。
- **无构建步骤**：`bin/taro` 直接 `import CLI from '../src/cli.ts'` 运行 TypeScript 源码；发布包通过 `files: ["bin", "src", "templates"]` 直发源码，`exports` 指向 `src/index.ts`。
- **无 dist**：仓库内不存在也不需要 `dist/` 产物；任何指向 `dist` 的路径都是过期代码。
- **共享常量/工具**：优先使用 Bun 原生 API（`Bun.resolveSync`、`Bun.Glob`、`Bun.spawnSync`、`Bun.file` 等），新增第三方依赖前必须先确认 Bun 或标准库无法覆盖。

## 加载链约定

- 用户配置（`config/index.ts`）、插件、preset 一律通过原生 `await import()` 加载（带 `?t=` query 防模块缓存），禁止再引入 swc-register / node:vm 之类的 CJS 转换加载链。
- `defineAppConfig` / `definePageConfig` / `importNativeComponent` 宏由 `internal/helper` 的 `installConfigMacros()` 注册到 `globalThis`。
- 模块解析统一走 `Bun.resolveSync(id, basedir)`，禁止使用 `resolve`、`createRequire`。

## 测试约定

- `bun test --isolate`（`bun:test`，无 vitest）；测试直接跑 `src/` 源码，没有 pretest 构建。
- 跨文件 mock 使用 `mock.module` + `await import` 动态加载被测模块；Kernel 集成测试的 automock 替代物见 `tests/utils/mock-service.ts`。

## 关键目录

- `bin/`：CLI 可执行入口（`#!/usr/bin/env bun`）。
- `src/cli.ts`：CLI 启动文件，默认导出 CLI 类。
- `src/internal/kernel/`：插件内核（Kernel、Config、Plugin）与插件解析。
- `src/internal/helper/`：工具集（fs 兼容层、dotenv、终端、路径解析等）。
- `src/internal/runner/`：Vite 小程序编译链路（mini-program、react-framework、plugins）。
- `src/presets/`：内置命令、hooks、文件生成逻辑。
- `src/platform-weapp/`：微信小程序平台插件实现。
- `templates/`：`taro init` 项目模板。
