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

`@spcsn/taro-cli` dependencies 从 29 个收敛到 9 个（不含 workspace 内的 `@spcsn/taro`），收敛过程见 §6。

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

当时的保留清单（vite 系、postcss、lightningcss、sax、acorn、@swc/core、react 系、chalk）
在第二轮优化中进一步收敛到 9 个（acorn、@swc/core 等均已移除），见 §6。

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
   当时 `archives/packages/**` 的历史 spec（该目录现已移除）。根 test 脚本改为逐包 `cd && bun run test`。

## 4. Bun.build 迁移要点（packages/taro）

- 双入口 + `define` 全量替换 `ENABLE_*` 编译期开关，`react` external，`target: browser`，
  `splitting: true`，external sourcemap。`process.env.NODE_ENV` 曾同样写死，第二轮优化中
  下放给业务构建 define（见 §6.4），dev 构建恢复 runtime 警告。
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
bun run test         # 214 个用例（7 + 93 + 114）
bun run release:check
bun run verify:fixture:weapp   # 出包约 220ms / 414KB
```

## 6. 第二轮优化（依赖收敛、死代码与性能）

业务工程 link 验证通过后做的收尾与深挖，全部位于 `bun-migration` 分支。

### 6.1 依赖最终收敛到 9 个

| 移除 | 替代 / 原因 |
|---|---|
| `@swc/core` | 页面配置提取改用 `Bun.Transpiler` 转译后求值；JSX 组件扫描改用 vite re-export 的 `parseAst`（rolldown/oxc，ESTree 兼容） |
| `@vitejs/plugin-react` | 实质作用只剩 JSX automatic runtime，内联插件直设 `build.rolldownOptions.transform.jsx`；产物逐字节一致 |
| `vite-plugin-static-copy` | 内联 ~60 行 copy 插件（`runner/shared/static-copy.ts`） |
| `acorn` / `acorn-walk` | 唯一消费方 `addConfig`（页面分享配置自动检测）是旧 webpack 管线死代码，`modifyConfig` 在 vite 管线零调用，整段删除 |

最终 9 个：`@spcsn/taro`、`chalk`、`lightningcss`、`postcss`、`react`、`react-dom`、`react-reconciler`、`sax`、`vite`。

**坑：Bun isolated linker 与残留 node_modules。** 砍 acorn 时漏了 `native-support.ts` 的顶层 import（其 `moduleParsed` 钩子在 rolldown 下访问 `moduleInfo.ast` 即抛错，本就不执行），本地因残留安装未暴露，干净安装即崩。同理 `@types/node` 曾误判为"可靠 bun-types 传递依赖"而删除显式声明——isolated linker 下传递依赖对 tsc 的 `types` 解析不可见。教训：**依赖类改动必须 `rm -rf node_modules && bun install` 后重新验证**。

### 6.2 死代码与冗余清理

- `archives/packages/` 历史只读快照整体移除（git 历史可找回），release 检查里的 archive 检查链、专用清理脚本与归档计划文档同步删除。
- `loaderMeta` 冗余链路：`getLoaderMeta()` 返回值与 `CompilerContext.loaderMeta` 默认值逐字段相同，`injectLoaderMeta` 插件纯冗余；连带删除 `loader-meta.ts`、`kernel/runner-utils/vite.ts`、公共类型 `ILoaderMeta` 及无人消费字段。
- 批量清除：H5 router 工具簇、`--components` 死链、helper 约 20 个零调用导出（收窄 `ctx.helper` 插件面）、React 整表拷贝遗留、`modifyComponentConfig`/`onParseCreateElement` 断链（注册了但从未接线）、`modifyInstantiate` 无提供方分支等，净删约 1200 行。

### 6.3 性能

构建链路（fixture 303ms → 223ms，业务工程 1.66s → 1.06s）：

- `vite-plugin-multi-platform`：平台后缀正则提升为插件创建期一次构造 + "无平台变体"负缓存。此前每条 import 最多 5 次串行 `this.resolve` 探测，是大工程 resolve 侧最大单项开销。
- `page.ts` transform：纯 TS 模块跳过 oxc 二次 parse；三遍 AST 遍历合一（副作用延迟到确认无本地绑定后按序应用，语义等价）；`Object.entries` → `for...in`。
- `create-filter`：`Bun.Glob` 在闭包创建期一次构造，不再每模块重建。

runtime 热路径：

- `isBubbleEvents` 的 12 元素 `Set` 提升为模块常量（原每个事件重建）。
- `setStyle` 改惰性 `value`（`enqueueUpdate` 本就支持函数值），同批 N 个样式属性的 cssText 序列化从 N 次降为 1 次。
- `toCamelCase` / `toDashed` 加 Map memo，并合并 `shared-compat` 里的第二份拷贝（导出面不变）。
- 正确性修复：`removeEventListener` 的 `splice(-1, 1)` 误删尾 handler；`TaroEvent.target` getter 重复计算；`createRoot` 的 MULTI 型 hook 重复 tap 叠加。

### 6.4 单例兜底与 NODE_ENV 下放

`globalThis` 兜底从只有 `hooks` 扩展到全部状态单例（`Current`、`eventSource`、`instances`、`eventCenter`、`env`、`cacheData`、`customWrapperCache`、`eventsBatch`），统一经 `shared-primitives.ts` 的 `getGlobalSingleton` 实现；新增状态单例必须复用该 helper（已写入 AGENTS.md §4.4）。

`process.env.NODE_ENV` 的 define 从预构建写死 `production` 下放给业务构建（cli 侧本就有 `process.env.NODE_ENV` define），dev 构建恢复 runtime 的 12 处 `warn`，生产产物不变。

### 6.5 产物体积对账（业务工程实测）

ali-your-space-miniapp 同一 lockfile 下对拍（sourcemap VLQ 归因到模块级）：1.2.8 与 2.0 产物构成逐项一致，JS 总量 972KB vs 975KB（构建横幅同为 1.97MB），构建耗时 1.53s → 1.0s。**2.0 无体积回归**；曾出现的 +177KB 为改造期间中间态 dist 残留，重新构建即消失。

注意：`NODE_ENV=development` 的 dev 构建会带入 react-dom development 与 jsx-dev-runtime，业务工程实测 JS +324KB（横幅 2.29MB，超微信 2048KB 主包限额）。**上传或量体积前必须使用 `NODE_ENV=production taro build`（`bun run build`）的产物**，不要在 dev watch 状态下上传。
