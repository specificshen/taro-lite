# @spcsn/taro-vite-runner

`@spcsn/taro-vite-runner` 是 `@spcsn/taro-cli` 在小程序端使用的 Vite/Rolldown 构建执行器。它负责把 Taro 页面、组件、模板、样式和静态资源组织成微信小程序可运行的产物。

## 入口

- `src/index.ts`: 包默认入口，当前转发到小程序构建入口。
- `src/index-mini.ts`: 小程序构建入口，创建编译上下文、注入 mini preset、处理 copy 配置和用户自定义 Vite 插件。

当前包只维护 mini 构建路径。若未来恢复 H5 或 Harmony Runner，请新增独立入口和对应目录，不要混入现有 mini 流水线。

## 目录职责

- `src/common/`: 跨构建阶段复用的 Vite/Babel/Rollup 插件，例如静态资源处理、多端文件过滤、原生组件 import 转换。
- `src/mini/`: 小程序构建主流程，包括默认配置、Vite 配置、页面/入口/模板/样式/原生组件产物生成。
- `src/template/`: 小程序运行时模板片段，例如 `comp` 和 `custom-wrapper`。
- `src/utils/`: 构建工具函数、编译上下文、日志、chunk 与路径辅助逻辑。

## 命名约定

- 源码文件使用短横线命名法，例如 `index-mini.ts`、`native-support.ts`、`create-filter.ts`。
- 目录也使用短横线命名法。
- 平台差异优先通过目录边界表达，例如 mini 专属逻辑放在 `src/mini/`。
- `index.ts` 只作为导出入口，不承载复杂构建逻辑。

## 构建流程

mini preset 的插件执行顺序在 `src/mini/index.ts` 中维护：

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

图片、字体和媒体资源由 `src/common/vite-plugin-assets.ts` 处理。mini 默认配置位于 `src/mini/default-config.ts`：

- 图片使用 `IMAGE_LIMIT` 阈值，小于阈值时内联为 `data:`，否则输出为独立文件。
- 字体和媒体分别使用 `FONT_LIMIT`、`MEDIA_LIMIT`。
- 不默认全量内联图片，避免 JS/WXSS 体积被 base64 资源撑大。

业务侧如果要在 WebView 中渲染栅格图标，应优先使用小程序 `Image` 组件，而不是依赖 `View` 的本地资源 `background-image`。

## Rolldown 检查

mini 构建默认关闭 `checks.pluginTimings`。这项检查只输出插件耗时占比提示，不影响产物正确性；Taro mini 构建中 entry、page、native support、多端过滤等插件天然占比高，默认关闭可以减少生产构建噪声。

## 常用命令

```bash
pnpm --filter @spcsn/taro-vite-runner run build
```

构建脚本会清理 `dist`、执行 TypeScript 编译并复制模板文件。发布前应使用业务工程进行真实构建验证，避免 `link:` 与发布包行为不一致。
