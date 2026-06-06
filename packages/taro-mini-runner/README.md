# `@spcsn/taro-mini-runner`

`@spcsn/taro-mini-runner` 是 `@spcsn/taro-cli` 在小程序端使用的小程序构建执行器。它负责把 Taro 页面、组件、模板、样式和静态资源组织成微信小程序可运行的产物。

## 包定位

- 内部实现包，不是业务侧显式安装入口。
- 由 `@spcsn/taro-cli` 解析和调用，承载 React 19 + WeApp 构建链。
- 当前仍需要独立发布，因为 CLI 和 service 仍通过包名解析 runner 与 `framework-react` 子路径。

## 入口

- `src/index.ts`: 包默认入口，当前转发到小程序构建入口。
- `src/entrypoints/mini-runner.ts`: 小程序构建入口，创建编译上下文、注入 mini preset、处理 copy 配置和用户自定义 Vite 插件。

当前包只维护 mini 构建路径。若未来恢复 H5 或 Harmony Runner，请新增独立入口和对应目录，不要混入现有 mini 流水线。

## 目录职责

- `src/entrypoints/`: runner 入口，保持 `src/index.ts` 只做包入口转发。
- `src/mini-program/`: 小程序构建主流程，包括默认配置、Vite 配置、页面/入口/模板/样式/原生组件产物生成。
- `src/plugins/`: 跨构建阶段复用的 Vite/Rolldown 插件，例如静态资源处理、多端文件过滤。
- `src/react-framework/`: React framework 插件入口和运行时 hook 注入。
- `src/react-runtime/`: React DOM 替换实现和 reconciler。
- `src/templates/`: 小程序运行时模板片段，例如 `comp` 和 `custom-wrapper`。
- `src/shared/`: 构建工具函数、编译上下文、日志、chunk 与路径辅助逻辑。

## 命名约定

- 源码文件使用短横线命名法，例如 `mini-runner.ts`、`native-support.ts`、`create-filter.ts`。
- 目录也使用短横线命名法。
- 平台差异优先通过目录边界表达，例如 mini 专属逻辑放在 `src/mini-program/`。
- `index.ts` 只作为导出入口，不承载复杂构建逻辑。

## 构建流程

mini preset 的插件执行顺序在 `src/mini-program/index.ts` 中维护：

1. `pipeline`: 初始化构建流水线相关状态。
2. `config`: 生成 Vite/Rolldown 配置、alias、manual chunks、PostCSS、Babel transform 和运行时注入。
3. `entry`: 生成应用入口与虚拟模块。
4. `page`: 收集页面脚本、配置与页面依赖。
5. `vite-plugin-multi-platform`: 处理多端文件后缀。
6. `native-support`: 处理原生页面和原生组件。
7. `vite-plugin-assets`: 处理图片、字体、媒体资源。
8. `style`: 生成小程序样式文件并组织公共样式 chunk。
9. `emit`: 输出小程序配置、模板和最终构建资产。

## 资源策略

图片、字体和媒体资源由 `src/plugins/vite-plugin-assets.ts` 处理。mini 默认配置位于 `src/mini-program/default-config.ts`：

- 图片使用 `IMAGE_LIMIT` 阈值，小于阈值时内联为 `data:`，否则输出为独立文件。
- 字体和媒体分别使用 `FONT_LIMIT`、`MEDIA_LIMIT`。
- 不默认全量内联图片，避免 JS/WXSS 体积被 base64 资源撑大。

业务侧如果要在 WebView 中渲染栅格图标，应优先使用小程序 `Image` 组件，而不是依赖 `View` 的本地资源 `background-image`。

## Rolldown 检查

mini 构建默认关闭 `checks.pluginTimings`。这项检查只输出插件耗时占比提示，不影响产物正确性；Taro mini 构建中 entry、page、native support、多端过滤等插件天然占比高，默认关闭可以减少生产构建噪声。

## 常用命令

```bash
pnpm --filter @spcsn/taro-mini-runner run build
```

构建脚本会清理 `dist`、执行 TypeScript 编译并复制模板文件。发布前应使用业务工程进行真实构建验证，避免 `link:` 与发布包行为不一致。
