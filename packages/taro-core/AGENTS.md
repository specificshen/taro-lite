# @spcsn/taro-core

## 定位

`@spcsn/taro-core` 是 Taro Lite monorepo 的现代化 CLI 入口，目标是在业务侧替代旧的 `@spcsn/taro-cli`。

它负责：

- `taro` 二进制命令行入口
- `taro init`：交互式创建 React + Vite + 微信小程序项目
- `taro build`：驱动底层构建链路完成微信小程序产物输出
- 导出 `defineConfig`、`doctor`、`Project`、`Creator`、`getRootPath` 等公共 API

## 与 `@spcsn/taro-cli` 的关系

- `taro-core` 不复制 `taro-cli` 源码，按自己的结构重新实现同等能力。
- 内部仍然依赖 `@spcsn/taro-service`、`@spcsn/taro-mini-runner`、`@spcsn/taro-helper`、`@spcsn/taro-shared` 等底层包。
- 业务项目应直接依赖 `@spcsn/taro-core`，不再直接依赖 `@spcsn/taro-cli`。

## 当前状态

- 源码 ESM-first，使用 kebab-case 目录与文件命名。
- 开发脚本使用 Bun：`bun test`、`bun run typecheck`、`bun run dev`。
- 发布构建使用 `tsc` 输出 `dist/`。
- `bin/taro` 使用 Node shebang，因为底层 `@spcsn/taro-helper` 的 `config-module-loader` 依赖 Node `module.registerHooks` 实验 API，Bun 1.3.14 尚未支持。

## 改造规划

### 已完成

1. 新建 `packages/taro-core` 包骨架。
2. 实现 CLI 参数解析、Kernel 启动、`build`/`init` 命令插件。
3. 实现微信小程序平台插件（`platform-weapp/`）。
4. 实现项目创建与默认模板渲染。
5. 简化代码：去掉 upstream 多平台/多框架的 dead branch，相比 `taro-cli` 减少约 28% 源码。
6. 添加 `bun:test` 单元测试覆盖 util、doctor、app-config、template 等模块。

### 暂缓

**物理合并底层编译器**：将 `@spcsn/taro-service`、`@spcsn/taro-helper`、`@spcsn/taro-mini-runner`、`@spcsn/taro-shared` 的源码全部收进 `taro-core`，并把构建链路换成 Bun 原生能力。

- 该方向工作量约 1.5~2 万行源码迁移/重写，风险高、验证周期长。
- 当前底层包对业务不可见，不影响开发体验。
- 若未来确定推进，建议分阶段：先 helper/shared，再 service，最后 runner。

## 常用命令

```bash
# 运行测试
bun test

# 类型检查
bun run typecheck

# 构建发布产物
bun run build

# 本地跑 CLI
bun run src/cli.ts --version
bun run src/cli.ts build --type weapp
bun run src/cli.ts init my-app

# 格式检查
pnpm exec biome check packages/taro-core packages/taro-core/bin/taro
```

## 目录约定

- `src/cli.ts`：CLI 入口
- `src/commands/`：命令转发
- `src/presets/`：内置插件（命令、hooks、文件生成）
- `src/platform-weapp/`：微信小程序平台实现
- `src/create/`：项目创建与模板渲染
- `src/util/`：CLI 工具函数
- `src/doctor/`：配置校验
- `templates/default/`：默认项目模板
- `src/__tests__/`：bun:test 单元测试

## 注意事项

- 不要在这个包里引入新的 CommonJS 模式，保持 ESM-first。
- 新增文件/目录使用 kebab-case。
- 对 `@spcsn/taro` 的依赖仅用于类型，不要引入运行时依赖。
