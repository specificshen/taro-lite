# Taro Lite × Bun 1.4 改造记录

> 分支 `bun-migration`，版本线 `2.0.0-alpha.0`。目标：**React 开发原生小程序，且快**。
> 本文档记录 1.2.0（pnpm + Node + tsc/Rolldown + vitest）→ 2.0（全 Bun 工具链）的改造决策与坑位。

## 1. 总览

| 维度 | 1.2 | 2.0 |
|---|---|---|
| 包管理器 | pnpm workspaces | Bun workspaces |
| 锁文件 | pnpm-lock.yaml | bun.lock |
| CLI 运行时 | Node.js（tsc 编译 dist 后运行） | **Bun-only**，`bin/taro` 直跑 `src/*.ts` |
| taro / components 构建 | Rolldown / tsc | **Bun.build**（d.ts 仍由 tsc 产出） |
| 测试 | vitest | **bun test**（`bun:test` + `--isolate`） |
| 用户配置/插件加载 | swc-register + node:vm（CJS 转换链） | **原生 `import()`** |
| CI / 发布 | Node 矩阵 + pnpm publish | setup-bun + `bun publish` |

`@spcsn/taro-cli` dependencies 从 29 个收敛到 14 个（不含 workspace 内的 `@spcsn/taro`）。

## 2. 关键决策

### 2.1 CLI Bun-only，删除整条编译链

`bin/taro` 改为 `#!/usr/bin/env bun` + `import CLI from '../src/cli.ts'`。`package.json`
的 `main/exports/types` 直接指向 `src/index.ts`，`files` 只保留 `bin/src/templates`。
不再有 `dist/`、`pretest`、`fix-esm-imports`。

收益：源码即产物，调试零编译等待；测试直接跑 `src/`。

代价：消费方必须是 Bun（含 `taro init` 生成的业务工程，模板已内置 `bun-types`）。

### 2.2 用户配置加载：swc + node:vm → 原生 import()

旧链路把 TS 配置编译成 CJS 再用 vm 执行，以支持 `defineAppConfig` 宏、alias、defineConstants。

新链路：

- 配置/插件/preset 一律 `await import(path + '?t=' + Date.now())`（query 防同进程模块缓存）。
- `defineAppConfig` / `definePageConfig` / `importNativeComponent` 三个宏改为
  `installConfigMacros()`（`internal/helper`）注册到 `globalThis`。
- `getModuleDefaultExport` 兼容 CJS（`__esModule`）与原生 ESM 命名空间（`default` 键）两种形态。
- **已知能力回退**：配置文件内的 `alias` 路径别名与 `defineConstants` 注入不再生效
  （原生 import 无法改写被加载模块的模块解析）。页面/应用配置应是纯数据文件，不受影响。

### 2.3 依赖瘦身：能自实现的全部自实现

| 移除的依赖 | 替代 |
|---|---|
| dotenv / dotenv-expand | `internal/helper/dotenv.ts` 逐字移植 parse/expand 逻辑 |
| inquirer | `src/create/prompt.ts`（node:readline，非 TTY 直接回退默认值） |
| lodash | `internal/helper/utils.ts` 的 `merge`（lodash 语义）与 `isEqual` |
| tapable | Kernel 内联 waterfall（stage/before 排序子集 + 串行 reduce） |
| joi | `optsSchema()` 无参调用 + 鸭式检查 `validate` |
| ora | 全局配置加载改为普通 console 输出 |
| debug | `createDebug` 自实现（DEBUG 环境变量命名空间过滤） |
| resolve / createRequire | `Bun.resolveSync(id, basedir)` |
| cross-spawn | `Bun.spawnSync([process.execPath, 'add', ...])` |
| picomatch | `Bun.Glob(pattern).match(id)` |
| autoprefixer / browserslist | LightningCSS 固定 targets（`ios_saf 12 / chrome 80 / firefox 78`）兜底前缀与降级 |
| chokidar / pirates | 随 swc-register 一并删除（无消费方） |

保留的第三方依赖只剩构建链路硬需求：vite 系、postcss、lightningcss、sax、acorn、
@swc/core（页面配置 definePageConfig 静态提取需要 TS AST）、react 系、chalk。

### 2.4 regenerator-runtime 默认不再注入

Skyline 的 JSCore 原生支持 async/await。`resolve.alias` 中 regenerator-runtime 的
强制 alias 已移除；旧代码如确需 regenerator，可自行 `bun add regenerator-runtime`
并配置 `compile.regenerator = true`（见 `types/compile/config/mini.d.ts`）。

### 2.5 命名与 API 修复

- `internal/taro-service` → `internal/kernel`、`taro-helper` → `internal/helper`、
  `taro-mini-runner` → `internal/runner`、`taro-shared` → `internal/shared`
  （这些目录早已不是独立 npm 包，去掉 `taro-` 前缀）。
- `@spcsn/taro` exports 删除 camelCase 遗留 `./types/compile/viteCompilerContext`，
  只保留 kebab-case `./types/compile/vite-compiler-context`（实体 .d.ts 已统一为 kebab 命名）。
- Kernel 插件加载链全异步化：`initPreset`/`initPlugin`/`initPresetsAndPlugins`/`applyCliCommandPlugin`
  均为 async，`plugin.apply()` 返回 Promise。
- `helper.npm` 删除同步插件加载 API（`getNpmPkgSync`/`callPluginSync`）。

## 3. bun test 迁移踩坑

1. **`mock(fn)` 被 `new` 调用时不执行实现体**（jest 会执行）。Kernel automock 改为
   `tests/utils/mock-service.ts` 的手写 class + mock 方法。
2. **`mock.module` 不提升且跨文件泄漏**（默认共享模块注册表）：必须先注册 mock 再
  `await import()` 被测模块；测试命令统一带 `--isolate`。
3. `mock.module` 的相对路径按**调用文件**位置解析：测试 helper 里必须传绝对路径。
4. `bun test <路径>` 的位置参数是**子串过滤器**而非路径：`bun test packages` 会误匹配
   `archives/packages/**` 的历史 spec。根 test 脚本改为逐包 `cd && bun run test`。

## 4. Bun.build 迁移要点（packages/taro）

- 双入口 + `define` 全量替换 `ENABLE_*` 编译期开关与 `process.env.NODE_ENV`，
  `react` external，`target: browser`，`splitting: true`，external sourcemap。
- 产物行为与 Rolldown 版逐项实测一致（define 替换、external、运行时 env 读取模式）。
- d.ts 仍由 `tsc --emitDeclarationOnly` 产出（Bun 不生成声明文件），
  脚本为 `packages/taro/scripts/build-dts.ts`。

## 5. 验证基线

每个阶段提交前均需通过：

```bash
bun run check        # biome
bun run typecheck && bun run typecheck:fixtures
bun run lint
bun run build
bun run test         # 232 个用例（7 + 46 + 179）
bun run release:check
bun run verify:fixture:weapp   # 出包约 250ms / 412KB
```
