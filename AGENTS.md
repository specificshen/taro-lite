# Taro Lite 协作规范

> 本文件用于指导 AI 与开发者在 `taro-lite` 底座仓库中的协作行为。

## 1. 项目基本信息

- **名称**：taro-lite
- **版本**：1.2.0
- **包管理器**：pnpm（强制，见 `package.json` 中 `preinstall`）
- **语言**：TypeScript
- **模块系统**：ESM（所有包均设置 `"type": "module"`）
- **构建工具**：Rolldown（`@spcsn/taro`）、tsc（`@spcsn/taro-cli`）
- **代码风格**：Biome（配置见 `biome.json`）

## 2. 仓库结构

对外只发布 3 个 npm 包：

| 包名 | 路径 | 职责 |
|---|---|---|
| `@spcsn/taro` | `packages/taro` | runtime + API 入口 |
| `@spcsn/taro-components` | `packages/taro-components` | 组件库 |
| `@spcsn/taro-cli` | `packages/taro-cli` | CLI + 构建工具 + React framework runtime |

`packages/taro/src/runtime/` 是所有 runtime 能力的**唯一事实来源**。

## 3. 开发流程

### 3.1 提交前必须执行

```bash
pnpm run check:write
pnpm run typecheck
pnpm run lint
pnpm --filter @spcsn/taro run build
pnpm --filter @spcsn/taro-cli run build
```

如果涉及生命周期、页面实例、事件总线等改动，还需在业务工程执行：

```bash
pnpm run build
```

### 3.2 提交信息

使用中文 Conventional Commits：

```
<type>(<scope>): <中文描述>

- 变更点 1
- 变更点 2
```

常用 type：`feat`、`fix`、`refactor`、`docs`、`style`、`chore`。

## 4. 核心设计约束

### 4.1 禁止复制 runtime 能力到 taro-cli

`taro-cli` 必须是 `@spcsn/taro/runtime` 的**消费者**，而不是**复制者**。

以下能力必须在 `packages/taro/src/runtime/` 中实现一次，cli 通过 `import { ... } from '@spcsn/taro/runtime'` 引用：

- 全局状态：`hooks`、`Current`、`instances`、`eventCenter`、`options`、`cacheData`
- 事件系统：`Events`、`EventCallbacks`
- 工具函数：`isString`、`isFunction`、`isArray`、`isObject`、`isBoolean`、`isUndefined`、`isNull`、`isNumber`
- 组件配置：`internalComponents`、`Shortcuts`、`controlledComponent`、`voidElements`、`nestElements`
- 其他共享：`EMPTY_OBJ`、`EMPTY_ARR`、`noop`、`ensure`、`warn`、`toDashed`、`toCamelCase`、`capitalize` 等

**不允许**在 `packages/taro-cli/src/internal/` 下创建与 `packages/taro/src/runtime/` 功能重复的文件。

### 4.2 为什么这条规则如此重要

ESM 不像 CJS 那样天然通过 `require` 缓存保证单例。如果同一份带状态的代码被复制到多个位置，就会产生多个实例，导致：

- `hooks.tap` 注册的映射对另一方不可见（如 `useDidShow` 不触发）
- `eventCenter.on` 监听不到另一方 `emit` 的事件
- `Current.page` / `Current.router` 状态不同步
- `instances` map 中页面实例丢失

这是 1.2.0 ESM 改造后踩过的真实坑，必须避免再次引入。

### 4.3 如果 cli 需要新增共享能力

1. 先判断该能力是否属于 runtime 范畴。
2. 如果是，在 `packages/taro/src/runtime/` 中实现，并从 `packages/taro/src/runtime/index.ts` 导出。
3. 在 cli 中通过 `import { ... } from '@spcsn/taro/runtime'` 引用。
4. 不要为了方便而在 cli 内部复制一份。

### 4.4 全局状态共享原则

任何带状态的对象，必须通过以下两种方式之一保证单例：

1. **模块导入共享**：所有引用方 import 同一个导出对象。
2. **`globalThis` 兜底**：在创建实例前检查 `globalThis.__XXX__`，如果已存在则复用。

优先使用模块导入共享；只有在无法避免代码复制时，才使用 `globalThis` 兜底。

## 5. 常见反模式

### ❌ 反模式 1：在 cli 内部复制 runtime 文件

```ts
// packages/taro-cli/src/internal/taro-shared/event-emitter.ts
export class Events { ... } // ❌ 错误：与 runtime/event-emitter.ts 重复
```

### ✅ 正确做法

```ts
// packages/taro-cli/src/internal/xxx/xxx.ts
import { Events } from '@spcsn/taro/runtime'; // ✅ 正确
```

### ❌ 反模式 2：在 cli 内部 new 一个共享 hooks 实例

```ts
// packages/taro-cli/src/internal/taro-shared/runtime-hooks.ts
export const hooks = new TaroHooks({ ... }); // ❌ 错误：与 runtime hooks 分裂
```

### ✅ 正确做法

```ts
export { hooks } from '@spcsn/taro/runtime'; // ✅ 正确
```

## 6. 参考文档

- `docs/esm-monorepo-refactor.md`：本次 ESM 改造与合包的详细记录
