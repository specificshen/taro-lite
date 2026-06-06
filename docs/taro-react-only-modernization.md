# Taro Monorepo React-only 现代化改造方案

> 本文是底座内部历史改造方案和当前状态记录，不是业务接入指导。业务接入请以仓库根目录 `README.md` 的最小依赖和配置示例为准。
> 目标读者：负责改造 fork 后 Taro monorepo 的 AI / 工程师。
> 核心目标：把 Taro 从“多框架、多平台、多历史编译器兼容”的通用框架，收敛为“React 19 + Vite + 微信小程序/Skyline 优先”的现代小程序构建与运行框架。

## 0. 当前同步状态（2026-06-05）

当前仓库已经不再只是早期方案阶段，`1.0.0` 稳定线已按 React 19 + Vite + WeApp + Skyline / glass-easel 主链路推进。

已落地：

- 业务侧最小显式依赖收敛为 `@spcsn/taro`、`@spcsn/taro-components`、`@spcsn/taro-cli`，外加业务自身的 `react`。
- `@spcsn/taro-plugin-generator` 已并入 `@spcsn/taro-cli`。
- `@spcsn/taro-plugin-platform-weapp` 已并入 `@spcsn/taro-cli`，CLI 内置 WeApp 平台插件。
- `@spcsn/taro-plugin-framework-react` 与 `@spcsn/taro-react` 已并入 `@spcsn/taro-mini-runner`。
- `@spcsn/taro-api` 已并入 `@spcsn/taro`。
- `@spcsn/taro-runner-utils` 已并入 `@spcsn/taro-service` 与 `@spcsn/taro-mini-runner`。
- `babel-preset-taro` 已改为 `@spcsn/taro-cli/babel-preset-taro` 子路径能力。
- PostCSS / Babel 历史插件包已从公开接入面移除，相关历史包已从 `pnpm-workspace.yaml` 排除。
- 已建立 `fixtures/weapp-react19-vite-skyline`，用于验证 React 19 + Vite + WeApp + Skyline / glass-easel 构建链路。
- `scripts/check-release-readiness.js` 已作为发布前防回退检查，覆盖公开包版本、native binding 产物和业务可见类型注释边界。

仍处于过渡态：

- `@spcsn/taro-service`、`@spcsn/taro-mini-runner`、`@spcsn/taro-helper`、`@spcsn/taro-shared`、`@spcsn/taro-runtime` 仍作为安装兼容所需的内部实现包发布。
- 这些内部包不能直接 `private: true` 后停止发布；必须先把它们打进公开入口包闭包，再移除公开入口里的 npm 依赖。
- 真实业务验证优先使用三入口包契约，不再按早期方案成组替换十几个历史插件包。

## 1. 改造目标

### 1.1 产品级目标

- 只支持 React，不再维护 Vue、Nerv、Solid 等框架路径。
- 首要支持微信小程序，优先适配 Skyline / glass-easel。
- 以 Vite 作为唯一主编译链路，移除或冻结 Webpack 兼容路径。
- 保留现有 Taro 应用的业务迁移友好性：业务代码仍可继续使用 `@spcsn/taro-components` 与 `@spcsn/taro`。
- 减少运行时和构建期抽象层，降低调试成本、包体积和构建复杂度。

### 1.2 非目标

- 不追求继续兼容 H5、React Native、支付宝、百度、字节、QQ 等所有端。
- 不追求保留 Taro 旧版本插件生态的完全兼容性。
- 不在第一阶段重写业务组件 API。
- 不把小程序改造成 Web DOM 渲染模型；小程序原生组件仍是一等目标。

## 2. 第一性原理判断

Taro 当前复杂度主要来自三个历史包袱：

1. 多框架：React、Vue、Nerv 等框架共用一套平台与编译抽象。
2. 多平台：微信、支付宝、H5、RN 等端共用一套 API、组件和产物生成协议。
3. 多编译器：Webpack、Vite、Babel、SWC 等路径长期并存。

React-only 现代化的最短路径不是直接重写全部 Taro，而是先稳定业务 API 面，再逐步削减内部抽象：

- 对应用开发者保留 `@spcsn/taro-components` 和 `@spcsn/taro`。
- 对框架内部只保留 React reconciler 相关路径。
- 对构建链只保留 Vite runner。
- 对平台只保留 weapp，且以 Skyline 为默认渲染假设。

## 3. 目标架构

```text
packages/
  taro-cli/                    # 命令入口：读取配置、内置 WeApp 平台插件、调用 Vite runner
  taro-mini-runner/            # 小程序构建 runner：构建插件、小程序产物生成、React framework 集成
  taro-service/                # CLI 插件和命令编排服务，当前仍是内部安装兼容包
  taro-runtime/                # 小程序运行时：节点树、事件、页面/组件桥接
  taro-components/             # React 小程序组件：View/Text/Image/ScrollView 等
  taro/                        # Taro API 门面：request/storage/navigation/ui/location/hooks 等
  taro-helper/                 # 构建期内部工具，当前仍是内部安装兼容包
  shared/                      # @spcsn/taro-shared，仅保留 React + weapp 仍需要的共享工具
```

当前业务可感知入口已经收敛为：

```text
@spcsn/taro
@spcsn/taro-components
@spcsn/taro-cli
```

当前仍需随版本成组发布的内部实现包包括：

```text
@spcsn/taro-service
@spcsn/taro-mini-runner
@spcsn/taro-helper
@spcsn/taro-shared
@spcsn/taro-runtime
@spcsn/taro-binding
@spcsn/taro-binding-* 平台包
```

这些内部包是安装兼容和运行闭包的一部分，不应让业务工程显式认知。后续继续把它们打进公开入口包，直到业务安装面真正只剩三个 `@spcsn` 入口包和 native binding 安装细节。

## 4. 包级改造策略

### 4.1 `@spcsn/taro-components`

职责：提供 React JSX 中使用的小程序组件。

保留：

- `View`、`Text`、`Image`、`ScrollView`、`Swiper`、`SwiperItem`、`Input`、`Textarea`、`Picker`、`Button`、`WebView` 等微信小程序常用组件。
- 事件类型，如 `ITouchEvent`。
- 组件 props 的 TypeScript 类型。

删除或冻结：

- 非微信平台特有组件适配分支。
- H5 DOM 组件 fallback。
- 与非 React 框架相关的组件导出路径。

改造原则：

- 组件层只做 props 类型与小程序组件名映射，不承载业务逻辑。
- Skyline 下默认使用 Flex 友好的组件模型。
- 不引入 Web DOM 假设，例如 `HTMLElement`、`document`、`window`。

### 4.2 `@spcsn/taro`

职责：业务侧的小程序 API 门面。

保留高频 API：

- 网络：`request`、拦截器相关能力。
- 存储：`getStorageSync`、`setStorageSync`、`removeStorageSync`。
- 路由：`navigateTo`、`redirectTo`、`switchTab`、`navigateBack`、`reLaunch`。
- UI：`showToast`、`showModal`、`showLoading`、`hideLoading`、`previewImage`。
- 系统：`getWindowInfo`、`getSystemInfoSync`、`getMenuButtonBoundingClientRect`。
- 位置与权限：`getLocation`、`getSetting`、`authorize`、`openSetting`、`openLocation`。
- 样式：`pxTransform`。
- 生命周期 hooks：`useLoad`、`useReady`、`useDidShow`、`useDidHide`、`usePullDownRefresh` 等 React hooks。

删除或冻结：

- H5/RN 平台 API 分支。
- 多端能力探测中的死分支。
- 非微信小程序特有的 API polyfill。

改造原则：

- `@spcsn/taro` 对业务保持兼容；内部直接调用微信小程序 API 或运行时桥接。
- 所有 API 类型以微信小程序定义为基准，再做 Taro 兼容别名。
- 对不支持的旧多端 API，提供编译期错误或清晰 runtime warning，不做静默降级。

### 4.3 React framework 集成

当前状态：`@spcsn/taro-react` 已并入 `@spcsn/taro-mini-runner`，不再作为业务或公开插件入口。

职责：提供 React 19 框架适配、页面组件挂载、生命周期 hooks 与小程序运行时桥接。

保留：

- React 19 渲染入口。
- 页面组件挂载与卸载。
- React hooks 与小程序生命周期桥接。
- React 事件到小程序事件系统的适配。

删除或冻结：

- Nerv 兼容逻辑。
- 其他框架共享 adapter 抽象。
- 为多框架保留的动态 framework 分支。

改造原则：

- React 是唯一框架，不再通过 `framework` 字段做运行时分派。
- `framework: 'react'` 可在配置中继续保留，但只作为兼容字段。
- React framework 能力由 Vite runner 内部加载，不要求业务显式安装 `@spcsn/taro-react`。

### 4.4 `@spcsn/taro-runtime`

职责：把 React 渲染结果映射到小程序页面/组件实例。

保留：

- Taro 节点树。
- 事件派发系统。
- 页面生命周期管理。
- 小程序 setData / data path 更新策略。
- 自定义组件注册与页面注册。

重点优化：

- 移除多平台 runtime 分支。
- 移除非 React 框架适配需要的通用钩子层。
- 减少全局状态与隐式单例。
- 为 Skyline 优化 setData 粒度和列表更新策略。

验收指标：

- React 页面首次渲染稳定。
- 页面切换、弹窗、列表、表单、图片预览等常见场景正常。
- 生命周期顺序可预测：`useLoad` -> 首次 render -> `useReady` -> `useDidShow`。

### 4.5 CLI 内置 WeApp 平台能力

当前状态：`@spcsn/taro-plugin-platform-weapp` 已并入 `@spcsn/taro-cli`，不再作为公开插件包。

职责：微信小程序平台产物生成与平台协议适配。

保留：

- `app.config.ts` / 页面 config 到 `app.json` / page json 的转换。
- 微信小程序组件名映射。
- 微信 API 能力表。
- Skyline / glass-easel 配置支持。
- 分包、懒加载、页面路径收集。

删除：

- 非微信小程序平台逻辑。
- 与 H5/RN 共享导致的冗余平台抽象。
- 可由微信原生能力直接表达的中间层。

默认配置建议：

```ts
export default defineAppConfig({
  renderer: 'skyline',
  componentFramework: 'glass-easel',
  lazyCodeLoading: 'requiredComponents',
  style: 'v2',
});
```

### 4.6 `@spcsn/taro-mini-runner`

职责：唯一编译 runner。

保留：

- Vite dev/build 两套模式。
- TS/TSX 编译。
- CSS Modules。
- PostCSS pxtransform。
- React Fast Refresh，若小程序 dev 环境可稳定支持。
- 静态资源处理。
- 小程序产物文件生成。

删除：

- Webpack runner 兼容入口。
- 多 compiler 分支。
- H5/RN 编译配置。

改造原则：

- Vite 是主语，Taro 是小程序产物插件。
- 将小程序构建逻辑尽量实现为 Vite plugins。
- 编译阶段明确区分：源码转换、依赖预构建、页面收集、产物生成。

建议插件流水线：

```text
vite config
  -> resolve alias
  -> react jsx transform
  -> taro page collector
  -> taro config transformer
  -> taro component transformer
  -> css modules + pxtransform
  -> miniapp asset emitter
  -> weapp json/wxml/wxss/js emitter
```

### 4.7 `@spcsn/taro-cli`

职责：命令入口。

保留命令：

- `taro build --type weapp`
- `taro build --type weapp --watch`
- `taro info`

删除或降级：

- 多平台模板生成。
- 非 React 项目初始化。
- 多编译器选择。
- 不再维护的端类型。

配置改造：

```ts
export default defineConfig({
  framework: 'react', // 兼容字段，可选
  compiler: 'vite',   // 兼容字段，可选
  platform: 'weapp',
  sourceRoot: 'src',
  outputRoot: 'dist',
});
```

最终目标可以进一步收敛为：

```ts
export default defineMiniappConfig({
  sourceRoot: 'src',
  outputRoot: 'dist',
  react: true,
  weapp: {
    skyline: true,
  },
});
```

### 4.8 `@spcsn/taro-cli/babel-preset-taro`

当前状态：独立 `babel-preset-taro` 包已改为 `@spcsn/taro-cli/babel-preset-taro` 子路径能力，不再作为公开包。

职责：兼容历史 Babel 转换预设，服务仍需要 Babel preset 的内部链路或旧配置。

后续方向：

- 只保留 React + TSX + weapp 需要的转换。
- 能由 Vite / esbuild / TypeScript 标准处理的转换不再扩展。
- 如果只剩极少 Taro 特有转换，继续下沉到 Vite runner 内部 transform，减少业务显式 Babel 配置。

### 4.9 `@spcsn/taro-shared` 与 `@spcsn/taro-helper`

职责：内部共享工具。

改造原则：

- 先不要大规模重命名，避免牵动过多 import。
- 删除明显仅服务多端/多框架/webpack 的工具。
- 将剩余能力按领域重组：路径、配置、平台、组件、API、日志。
- 不允许业务应用直接依赖内部 helper。

## 5. 推荐分阶段执行

### 阶段 0：建立基线

任务：

- 在 fork 的 Taro monorepo 中跑通现有测试。
- 用一个真实 React + weapp + Skyline 应用作为 fixture。
- 固定 Node、pnpm、TypeScript、React、Vite 版本。
- 记录当前 build 输出文件结构。

验收：

- 原始 Taro build 可运行。
- fixture 小程序能在微信开发者工具打开。
- 有一份构建产物 snapshot。

### 阶段 1：冻结目标边界

任务：

- 标记所有非 React framework 包为 deprecated 或 internal frozen。
- 标记所有非 weapp platform 包为 deprecated 或 internal frozen。
- CLI 层禁止新增非 weapp 能力。
- 文档中声明 React + weapp 是唯一维护目标。

验收：

- `framework` 除 React 外会 warning 或报错。
- `type` 除 weapp 外会 warning 或报错。
- CI 只跑 React + weapp 相关测试。

### 阶段 2：收敛构建链到 Vite

任务：

- 将默认 compiler 固定为 Vite。
- 删除 CLI 到 Webpack runner 的默认路径。
- 将页面收集、配置转换、组件转换迁移到 Vite plugin 管线。
- 保证 CSS Modules、pxtransform、静态资源输出稳定。

验收：

- 不配置 `compiler` 也默认使用 Vite。
- 构建产物与阶段 0 snapshot 的关键结构一致。
- fixture 中 CSS Modules className、rpx 转换、图片资源均正常。

### 阶段 3：React runtime 专用化

任务：

- 删除 runtime 中非 React adapter 分支。
- 梳理 React 入口、页面注册、生命周期桥接。
- 将生命周期 hooks 统一放在 React adapter 或 Taro API 门面中。
- 为 React 19 并发/严格模式行为做边界测试。

验收：

- `useLoad/useReady/useDidShow/useDidHide` 顺序稳定。
- 页面返回、重复进入、弹窗挂载卸载无异常。
- 事件对象类型与业务旧代码兼容。

### 阶段 4：weapp / Skyline 专用化

任务：

- 将平台映射收敛到微信小程序。
- 默认支持 `renderer: 'skyline'` 与 `componentFramework: 'glass-easel'`。
- 清理非 weapp API 映射表。
- 对 Skyline 不支持或表现不稳定的 CSS 能力给出编译期提示。

验收：

- 产物 `app.json` 正确包含 Skyline 相关配置。
- `View/Text/Image/ScrollView/Swiper/Input/WebView` 正常渲染。
- 自定义导航栏、列表、弹窗、表单场景稳定。

### 阶段 5：API 门面瘦身

任务：

- 统计真实业务对 `@spcsn/taro` 的 API 使用。
- 保留高频 API，低频多端 API 标记 deprecated。
- 不支持 API 直接给出清晰错误。
- 类型定义改成微信小程序优先。

验收：

- 真实业务项目无需大改即可编译。
- 不支持 API 不再静默失败。
- API 文档只描述 React + weapp 行为。

### 阶段 6：文档与迁移工具

任务：

- 编写 React-only Taro 使用文档。
- 编写从原 Taro 项目迁移的 codemod 或 lint 规则。
- 给出 `package.json` 最小依赖集。
- 给出 Skyline 样式限制说明。

验收：

- 新项目可以按文档从零创建。
- 旧项目可以按迁移文档升级。
- CI 包含 fixture build、类型检查、核心 runtime 测试。

## 6. 最小应用依赖目标

当前业务应用显式依赖目标已经收敛为三个 `@spcsn` 入口包：

```json
{
  "dependencies": {
    "@spcsn/taro": "1.0.0",
    "@spcsn/taro-components": "1.0.0",
    "react": "^19.2.0"
  },
  "devDependencies": {
    "@spcsn/taro-cli": "1.0.0"
  }
}
```

业务工程不应显式安装 `@spcsn/taro-react`、`@spcsn/taro-plugin-platform-weapp`、`@spcsn/taro-plugin-framework-react`、`@spcsn/taro-mini-runner`、`@spcsn/taro-runtime`、`@spcsn/taro-shared` 或 `@spcsn/taro-helper`。这些包当前仍可能被入口包传递安装，但属于底座内部闭包。

判断一个包是否应该出现在业务 `package.json` 的标准是：业务源码是否直接 import 它，或它是否是业务明确执行的命令行工具。

## 7. AI 执行提示词

可以把下面提示词给执行改造的 AI：

```text
你正在改造一个 fork 后的 Taro monorepo。目标是把它收敛为 React-only + Vite-only + weapp/Skyline-first 的现代小程序框架。

请遵循以下原则：
1. 保持应用侧 `@spcsn/taro-components` 与 `@spcsn/taro` API 尽量兼容。
2. 删除或冻结非 React 框架路径，不再维护 Vue/Nerv/Solid 等 adapter。
3. 删除或冻结非微信小程序平台路径，不再维护 H5/RN/支付宝/百度/字节等端。
4. Vite 是唯一编译链路；Webpack 相关路径只允许删除、隔离或 deprecated，不允许继续扩展。
5. Skyline / glass-easel 是默认目标，不能引入 DOM/window/document 假设。
6. 每一步改造都必须配套 fixture build 或单元测试，避免只做机械删除。

执行顺序：
- 先建立 React + weapp fixture 与构建 snapshot。
- 再从 CLI 配置入口收敛 framework/type/compiler。
- 然后收敛 Vite runner。
- 再收敛 React runtime。
- 最后瘦身 platform-weapp、components、taro API 与 shared/helper。

每次改动前先搜索引用，确认删除范围；每次改动后运行相关测试与 fixture build。
```

## 8. 风险清单

### 8.1 最大风险：误删隐式共享逻辑

Taro 很多包之间存在隐式共享工具。删除多端代码前必须先用引用搜索确认：

- 是否被 React weapp 路径间接引用。
- 是否被构建期插件使用。
- 是否被类型定义导出。

### 8.2 第二风险：业务 API 表面破坏

真实业务项目通常大量使用：

- `@spcsn/taro-components`
- `@spcsn/taro`
- 生命周期 hooks
- `pxTransform`
- 路由与 storage API

这些表面 API 应优先兼容，内部实现可以换。

### 8.3 第三风险：Skyline 渲染差异

Skyline 不等于 WebView。不要引入：

- DOM API 假设。
- CSS Grid 作为基础布局。
- `window/document` 运行时依赖。
- 依赖浏览器 SVG symbol 注入的图标方案。

## 9. 验收标准

最终改造完成后，至少满足：

- 一个 React + TS + CSS Modules + Skyline fixture 可以稳定构建。
- 微信开发者工具中可以打开并完成页面跳转、列表渲染、弹窗、表单输入、网络请求 mock。
- 应用侧仍能使用 `View/Text/Image` 等 Taro 组件。
- 应用侧仍能使用 `Taro.request`、`Taro.showToast`、`Taro.navigateTo`、`Taro.getStorageSync` 等 API。
- 构建链默认 Vite，无需用户选择 compiler。
- 非 React / 非 weapp 路径不会再被默认打包或测试。
- 文档明确声明支持边界：React-only、weapp-first、Skyline-first。

## 10. 建议先改哪里

第一刀不要动 `@spcsn/taro-components` 和 `@spcsn/taro` 的业务 API 表面。

推荐起手顺序：

1. CLI：把 `framework/type/compiler` 的默认值固定为 `react/weapp/vite`。
2. 测试：建立 React weapp fixture build。
3. Vite runner：把 weapp 产物生成链路从多 compiler 分支里抽干净。
4. React adapter：移除非 React adapter 分支。
5. Platform weapp：保留 Skyline 所需配置，删除其他端映射。
6. Shared/helper：最后清理，避免早期误删造成定位困难。

这条路径的好处是：先固定入口和验收，再削减内部复杂度。业务 API 表面稳定，真实应用迁移成本最低。

## 11. 如何接入真实业务工程验证

当前验证目标是证明业务工程只显式安装三个 `@spcsn` 入口包也能完成 React 19 + Vite + WeApp + Skyline / glass-easel 构建。不要再按早期方案手动替换十几个历史内部包。

### 11.1 验证原则

- 不混用 `@spcsn/*` 与官方 `@tarojs/*` 包。
- 业务 `package.json` 只保留直接使用的入口：`@spcsn/taro`、`@spcsn/taro-components`、`@spcsn/taro-cli`。
- `@spcsn/taro-runtime`、`@spcsn/taro-shared`、`@spcsn/taro-helper`、`@spcsn/taro-service`、`@spcsn/taro-mini-runner` 属于传递安装的底座内部实现，不应由业务显式声明。
- 先验证构建链，再验证运行时；先跑 `taro build --type weapp`，再打开微信开发者工具。
- 每次替换后删除旧安装产物和 lockfile 影响，避免包管理器复用缓存导致误判。

### 11.2 推荐方式：最小入口包验证

业务工程依赖应收敛为：

```json
{
  "dependencies": {
    "@spcsn/taro": "1.0.0",
    "@spcsn/taro-components": "1.0.0",
    "react": "^19.2.0"
  },
  "devDependencies": {
    "@spcsn/taro-cli": "1.0.0"
  }
}
```

如果使用本地 monorepo 快速验证，可以只 link 三个入口包：

```json
{
  "dependencies": {
    "@spcsn/taro": "link:../taro-lite/packages/taro",
    "@spcsn/taro-components": "link:../taro-lite/packages/taro-components",
    "react": "^19.2.0"
  },
  "devDependencies": {
    "@spcsn/taro-cli": "link:../taro-lite/packages/taro-cli"
  }
}
```

使用 link 方式前，fork 仓库里的相关包仍然需要先 build，否则业务工程可能解析到未编译源码或旧 dist。

```bash
cd ../taro-lite
pnpm --filter @spcsn/taro run build
pnpm --filter @spcsn/taro-components run build
pnpm --filter @spcsn/taro-cli run build
```

安装并构建业务工程：

```bash
rm -rf node_modules dist
pnpm install
pnpm run build
```

如果业务工程使用 `bun run dev` 或 `npm run build` 启动也可以，关键是依赖来源必须统一，并且不要把内部包重新写回业务 `package.json`。

### 11.3 本地 tarball 验证

更接近发布场景时，可以把三个入口包打成本地 tarball，再安装到业务工程：

```bash
mkdir -p ../taro-lite-packs
pnpm --filter @spcsn/taro pack --pack-destination ../taro-lite-packs
pnpm --filter @spcsn/taro-components pack --pack-destination ../taro-lite-packs
pnpm --filter @spcsn/taro-cli pack --pack-destination ../taro-lite-packs
```

业务工程中写入实际生成的 tarball 文件名：

```json
{
  "dependencies": {
    "@spcsn/taro": "file:../taro-lite-packs/spcsn-taro-1.0.0.tgz",
    "@spcsn/taro-components": "file:../taro-lite-packs/spcsn-taro-components-1.0.0.tgz",
    "react": "^19.2.0"
  },
  "devDependencies": {
    "@spcsn/taro-cli": "file:../taro-lite-packs/spcsn-taro-cli-1.0.0.tgz"
  }
}
```

注意：`package.json` 里不能使用 `*` 通配符，必须填 `pnpm pack` 生成的完整文件名。

### 11.4 不推荐：业务显式安装内部包

不要为了修一个构建问题把以下内部实现写进业务 `package.json`：

```text
@spcsn/taro-runtime
@spcsn/taro-shared
@spcsn/taro-helper
@spcsn/taro-service
@spcsn/taro-mini-runner
@spcsn/taro-react
@spcsn/taro-plugin-platform-weapp
@spcsn/taro-plugin-framework-react
@spcsn/taro-plugin-generator
babel-preset-taro
```

如果业务显式依赖这些包，说明入口包的依赖闭包或构建产物还有问题，应该回到底座修复，而不是扩大业务接入面。

### 11.5 业务工程验证清单

第一层：安装完整性。

```bash
pnpm why @spcsn/taro
pnpm why @spcsn/taro-cli
pnpm why @spcsn/taro-mini-runner
pnpm why @spcsn/taro-runtime
```

确认业务直接声明的只有 `@spcsn/taro`、`@spcsn/taro-components`、`@spcsn/taro-cli`，内部包只来自传递依赖。

第二层：构建完整性。

```bash
pnpm run build
```

重点看：

- `config/index.ts` 能被新 CLI 读取。
- `framework: 'react'` 与 `compiler: 'vite'` 不报错。
- WeApp 平台插件能输出 `dist/app.json`。
- CSS Modules 与 pxtransform 仍正常。

第三层：产物检查。

```bash
ls dist
cat dist/app.json
```

重点确认：

- `renderer` 仍为 `skyline`。
- `componentFramework` 仍为 `glass-easel`。
- 页面列表完整。
- 静态资源、页面 js、wxss/json 都存在。

第四层：微信开发者工具运行检查。

- 首页能打开。
- Tab 能切换。
- `Taro.navigateTo` 跳转正常。
- `Taro.request` 请求层能发起请求。
- `Taro.showToast`、`Taro.showModal` 正常。
- `ScrollView`、`Swiper`、`Image` 正常渲染。
- 登录、订单详情、社区详情、权益卡列表等核心页面至少冒烟一遍。

### 11.6 回滚方式

业务验证失败时，先不要改业务代码兜底。优先回滚 Taro 包来源：

1. 把 `package.json` 中所有 `file:` / `link:` Taro 包恢复为发布版本。
2. 删除 `node_modules`、`dist`。
3. 重新安装依赖并构建。

```bash
rm -rf node_modules dist
pnpm install
pnpm run build
```

如果回滚后业务工程恢复正常，问题基本在 fork 后的 Taro；如果回滚后仍异常，再排查业务工程自身改动。
