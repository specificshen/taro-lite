# @spcsn/taro-cli

## 定位

`@spcsn/taro-cli` 是 SPCSN Taro Lite 的 CLI 入口，同时承载了已合并的 `@spcsn/taro-core` 能力（配置解析、初始化、平台插件、 doctor 等）。业务用户通过 `bin/taro` 调用，其他内部包通过 `dist/index.js` 使用其导出的工具函数。

## 构建约定

- **ESM 包**：`package.json` 已设置 `"type": "module"`，产物是 ESM。
- **源码 ESM 语法**：`src/` 下使用 `import/export`，由 `tsc` 编译为 `dist/*.js`。
- **bin 入口**：`bin/taro` 使用 ESM `import CLI from '../dist/cli.js'`，因此 `src/cli.ts` 必须以默认导出方式暴露 CLI 实例。
- **产物依赖**：`pretest` 会先 `pnpm run build`，因为 Kernel 在测试里动态加载的是 `dist/` 产物，而不是 `.ts` 源码。

## 测试约定

- `pnpm test` / `pnpm run test:ci` 使用 vitest。
- 涉及插件加载、Kernel 集成的用例会读取 `dist/`，修改源码后务必先 build 再跑相关测试。
- 新增单测建议放在 `src/__tests__/` 对应模块旁，保持与现有 `cli.spec.ts`、`build-config.spec.ts` 等一致。

## 现代改造原则

- 新增源码优先使用 ESM `import/export`。
- 对遗留的动态 `require()`（如插件/用户配置加载）进行 ESM 改造时，使用 `createRequire(import.meta.url)` 保持对 CJS 用户配置的兼容。
- 本包已是 `"type": "module"`；新增源码中避免直接使用 `__dirname`/`__filename`，统一使用 `path.dirname(fileURLToPath(import.meta.url))` / `fileURLToPath(import.meta.url)`。

## 关键目录

- `bin/`：CLI 可执行入口。
- `src/cli.ts`：CLI 启动文件。
- `src/presets/`：内置命令、hooks、文件生成逻辑。
- `src/platform-weapp/`：微信小程序平台插件实现。
- `templates/`：`taro create` 项目模板。
