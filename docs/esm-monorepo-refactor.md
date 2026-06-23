# ESM 改造与 Monorepo 合包规划

> 状态：阶段一已完成，阶段二/三待评估  
> 目标版本：1.2.0  
> 核心原则：包数量收敛到 3 个，内部实现从 `@spcsn/taro/runtime` 统一引用，避免 ESM 下的状态分裂。

## 1. 背景

本次 1.2.0 完成了两件事：

1. **合包**：对外只保留 3 个 npm 包
   - `@spcsn/taro`：runtime + API 入口
   - `@spcsn/taro-components`：组件库
   - `@spcsn/taro-cli`：CLI + 构建工具 + React framework runtime

2. **ESM 改造**：所有包改为 `"type": "module"`，构建工具切换到 Rolldown/Vite。

合包减少了版本同步和发布成本，ESM 符合现代构建工具趋势。但两者叠加带来一个副作用：**原来通过 CJS `require` 缓存自然保证的单例，在 ESM 下不再天然成立**。一旦同一份代码被复制到不同位置，就会出现多个实例，导致全局状态分裂。

## 2. 已修复的典型问题

### 2.1 `hooks` 实例分裂导致 `useDidShow` 不触发

**现象**：业务工程升级到 1.2.0 后，`useDidShow` 等页面生命周期 hook 不触发。

**根因**：
- `taro` 包和 `taro-cli` 包各自有一份 `runtime-hooks.ts`。
- 两份代码各自 `new TaroHooks()`，产生两个独立的 `hooks` 实例。
- `taro-cli` 的 React framework 在 `connect.ts` 里通过 `hooks.tap('getLifecycle', ...)` 注册了 `onShow → componentDidShow` 的映射。
- 但页面显示时，`taro runtime` 的 `safeExecute` 调用的是自己包里的 `hooks`，看不到 `taro-cli` 注册的映射，于是读不到 `instance.componentDidShow`，callback 未执行。

**修复**：
1. 让 `taro` 包的 `runtime/index.ts` 导出 `TaroHooks`、`HOOK_TYPE`、`TaroHook`、`TFunc`。
2. `taro-cli` 的 `src/internal/taro-shared/runtime-hooks.ts` 改为直接 re-export：
   ```ts
   export type { TFunc } from '@spcsn/taro/runtime';
   export { HOOK_TYPE, hooks, TaroHook, TaroHooks } from '@spcsn/taro/runtime';
   ```
3. 在 `packages/taro/src/runtime/runtime-hooks.ts` 中保留 `globalThis.__TARO_SHARED_HOOKS__` 兜底，防止未来再出现代码复制导致的多实例。

**验证**：业务工程 `pnpm run build` 通过，`useDidShow` 正常触发。

## 3. 剩余风险清单

`hooks` 只是最明显的一个。`taro-cli/src/internal/taro-shared/` 目录下还有大量与 `packages/taro/src/runtime/` 功能重复的实现，如果它们内部带有状态，同样可能分裂。

| 模块 | 当前位置（taro-cli 内部） | 原始位置（taro runtime） | 风险等级 | 说明 |
|---|---|---|---|---|
| `hooks` | `src/internal/taro-shared/runtime-hooks.ts` | `src/runtime/runtime-hooks.ts` | **高** | 已收敛 ✅ |
| `event-emitter` | `src/internal/taro-shared/event-emitter.ts` | `src/runtime/event-emitter.ts` | **高** | 已收敛 ✅ |
| `shared-compat` 工具函数/常量/组件配置 | `src/internal/taro-shared/` | `src/runtime/shared-compat/` | **高** | 已收敛 ✅ |
| `Current` / 全局上下文 | 通过 `@spcsn/taro/runtime` 导入 | `src/runtime/current.ts` | 中 | 目前从 runtime 导入，未发现内部副本 |
| `instances` | 通过 `@spcsn/taro/runtime` 导入 | `src/runtime/dsl/common.ts` | 中 | 目前从 runtime 导入，未发现内部副本 |
| `options` | `src/internal/taro-shared/` 未明显存在 | `src/runtime/options.ts` | 低 | 目前未发现内部副本 |

## 4. 收敛计划

### 阶段一：高风险状态模块收敛（已完成 ✅）

目标：所有带状态或全局唯一的模块，统一从 `@spcsn/taro/runtime` 导入。

完成内容：

1. **`hooks`**
   - `taro-cli/src/internal/taro-shared/runtime-hooks.ts` 改为 re-export `@spcsn/taro/runtime`
   - `runtime/index.ts` 导出 `TaroHooks`、`HOOK_TYPE`、`TaroHook`、`TFunc`
   - 保留 `globalThis.__TARO_SHARED_HOOKS__` 兜底

2. **`event-emitter` / `Events`**
   - 删除 `taro-cli/src/internal/taro-shared/event-emitter.ts`
   - `runtime/index.ts` 显式导出 `Events` 与 `EventCallbacks`
   - `taro-cli/src/internal/taro-shared/event-channel.ts` 改为从 `@spcsn/taro/runtime` 导入 `Events`

3. **`shared-compat` 全量收敛**
   - 将 cli 多出的工具函数/常量下沉到 `runtime/shared-compat`
   - `runtime/shared-compat/index.ts` 统一 barrel 导出
   - `runtime/index.ts` 显式导出 cli 所需的 `is*`、`internalComponents`、`EMPTY_OBJ`、`ensure`、`noop`、`toDashed`、`capitalize` 等
   - `taro-cli` 内部所有 `from '../../taro-shared'` 改为 `from '@spcsn/taro/runtime'`
   - 删除 cli 重复的 `components.ts`、`constants.ts`、`is.ts`、`native-apis.ts`、`shortcuts.ts`、`template.ts`、`utils.ts`
   - `taro-cli/src/internal/taro-shared/` 仅保留 cli 特有的 `event-channel.ts`

### 阶段二：配置与工具函数收敛

1. **`components` / `Shortcuts`**
   - 评估是否可以从 `@spcsn/taro/runtime` 导出并复用
   - 如果 cli 有历史差异，先对齐差异再收敛

2. **纯工具函数**
   - `is.ts`、`utils.ts` 中的纯函数可以保留在 cli 内部，也可以收敛到 runtime
   - 建议收敛到 runtime，减少重复代码，但优先级最低

### 阶段三：长期目标

- `taro-cli/src/internal/taro-shared/` 只保留 cli 特有的逻辑
- `taro-cli` 是 `@spcsn/taro/runtime` 的消费者，而不是复制者
- 建立规则：新增内部模块时，先判断它是否属于 runtime 能力；如果是，加到 `packages/taro/src/runtime/`，不要复制进 cli

## 5. 验证清单

每次收敛改动后，必须执行：

```bash
# 底座仓库
cd /Users/shen/Desktop/study/taro-lite
pnpm run typecheck
pnpm run lint
pnpm --filter @spcsn/taro run build
pnpm --filter @spcsn/taro-cli run build

# 业务工程
cd /Users/shen/Desktop/main/ali-your-space-miniapp
pnpm run build
```

对于生命周期相关改动，额外验证：

- `useDidShow` / `useDidHide` 正常触发
- `useLoad` / `useReady` / `useUnload` 正常触发
- 不会出现重复触发

## 6. 设计原则

1. **单一事实来源**：runtime 相关能力只在 `packages/taro/src/runtime/` 实现一次。
2. **外部引用优于内部复制**：`taro-cli` 通过 `@spcsn/taro/runtime` 引用，不私自复制代码。
3. **全局状态必须共享**：任何带状态的对象，必须通过模块导入或 `globalThis` 保证单例。
4. **ESM 不是改完就完**：要持续检查"同逻辑多份代码"的隐患，尤其是带状态的模块。
