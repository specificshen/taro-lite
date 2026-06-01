# SPCSN Taro Mini Runtime

`@spcsn` 独立小程序底座，来源于 Taro 代码基线，但不再沿用上游 Taro 的多端、多框架、`4.x` 版本语义。

本仓库只维护一条主链路：**React 19 + Vite + 微信小程序 WeApp + Skyline / glass-easel**。

## 定位

这是 `@spcsn` 自己的底座产品线，不是官方 Taro 的 patch 包。

- 当前稳定线从 `1.0.0` 起步，不映射上游 Taro `4.x`。
- 只保证 React 19 + WeApp 小程序链路。
- 默认使用 Vite，Webpack runner 不在维护范围内。
- H5、React Native、Harmony、支付宝、字节、百度、QQ 等平台不在当前承诺范围内。
- Vue、Solid、Nerv 等非 React 框架不在当前承诺范围内。

不要把 `@spcsn/*` 与官方 `@tarojs/*` 混装，也不要用上游 Taro 版本号判断本仓库能力边界。

## 依赖边界

业务工程只安装自己直接理解和直接使用的包。

最小依赖集：

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

业务工程不要显式安装这些底座内部实现依赖：

- `@spcsn/taro-runtime`
- `@spcsn/taro-react`
- `@spcsn/taro-vite-runner`
- `@spcsn/taro-plugin-framework-react`
- `@spcsn/taro-plugin-platform-weapp`
- `@spcsn/babel-preset-taro`
- `vite`
- `postcss`
- `terser`
- `@vitejs/plugin-react`
- `@babel/core`
- `@babel/preset-react`
- `react-refresh`

这些包属于 CLI、runner、framework、platform 包的内部闭包。业务侧如果需要显式安装某个包，必须能回答“业务源码是否直接 import 它，或它是否是明确的命令行工具”。

## 版本策略

当前独立稳定版本线从 `1.0.0` 开始。

- `1.0.x`：React 19 + Vite + WeApp / Skyline 主链路的 bugfix、发版修正和依赖边界收敛。
- `1.x` minor：底座能力边界或业务接入约定向前兼容扩展。
- `2.0.0`：业务接入契约发生不兼容变化时再考虑。

当前所有可发布的 `@spcsn/*` 底座包必须成组发布、成组安装，不要只替换 CLI、runtime 或某一个插件包。后续包收敛目标见 [docs/package-consolidation.md](docs/package-consolidation.md)。

## 开发环境

- Node.js 22+
- pnpm 10+
- React 19
- Vite 8

安装依赖：

```bash
pnpm install
```

构建关键包：

```bash
pnpm --filter @spcsn/taro-helper run build
pnpm --filter @spcsn/taro-vite-runner run build
pnpm --filter @spcsn/taro-plugin-framework-react run build
pnpm --filter @spcsn/taro-plugin-platform-weapp run build
pnpm --filter @spcsn/taro-cli run build
```

查看 CLI 版本：

```bash
node packages/taro-cli/bin/taro --version
```

## 业务接入示例

业务工程配置示例：

```ts
export default {
  framework: 'react',
  compiler: 'vite',
  mini: {
    compile: { prerender: true },
    output: { renderer: 'skyline', componentFramework: 'glass-easel' },
  },
}
```

业务工程验证：

```bash
pnpm install
npm run build
```

构建输出应显示当前 `@spcsn/taro-cli` 版本，例如：

```text
Taro v1.0.0
```

## 发版前检查

发版前至少确认：

- 所有发布包版本一致。
- README 的最小依赖集与业务工程实际依赖一致。
- 业务工程没有显式安装底座内部实现依赖。
- native binding 平台包都已准备好对应 `.node` 产物。
- `node packages/taro-cli/bin/taro --version` 输出正确版本。
- 真实业务工程 `npm run build` 通过。

常用检查命令：

```bash
pnpm run release:check
rg '@spcsn/taro-runtime|@spcsn/taro-vite-runner|@spcsn/taro-plugin-framework-react|@spcsn/taro-plugin-platform-weapp' /path/to/business/package.json
```

`release:check` 会检查 `packages/*`、`npm/*` 和 `crates/native_binding` 的版本是否与根 `package.json` 一致，并校验每个 native binding 平台包是否包含预期 `.node` 文件。只想在本地快速检查版本时，可以执行：

```bash
pnpm run release:check -- --skip-bindings
```

## 发布流程

`1.0.0` 是 `@spcsn` 独立稳定版本线起点。发布前先确认登录到了目标 npm registry：

```bash
npm config get registry
npm whoami
```

构建底座包：

```bash
pnpm run build
```

准备 native binding 产物，并确认每个待发布平台包都包含 `.node` 文件：

```bash
pnpm run artifacts
pnpm run release:check
```

如果 `release:check` 提示某个平台包缺少 `.node` 文件，不要发布对应平台包。

先 dry-run，确认 tarball 内容和依赖版本：

```bash
pnpm -r --filter './packages/*' --filter './npm/*' --filter './crates/native_binding' publish --access public --tag latest --dry-run
```

确认无误后正式发布：

```bash
pnpm -r --filter './packages/*' --filter './npm/*' --filter './crates/native_binding' publish --access public --tag latest
```

发布完成后，在业务工程把本地 `link:` 依赖切成 npm 版本并验证：

```json
{
  "dependencies": {
    "@spcsn/taro": "1.0.0",
    "@spcsn/taro-components": "1.0.0"
  },
  "devDependencies": {
    "@spcsn/taro-cli": "1.0.0"
  }
}
```

```bash
pnpm install
npm run build
```

注意：native binding 已切到 `@spcsn/taro-binding` 和 `@spcsn/taro-binding-*` 平台包，发布时必须和 CLI 同批次发布。

## 与上游 Taro 的关系

本仓库继承 Taro 的部分源码基础与 MIT License。上游文档、社区案例和迁移指南只能作为历史背景参考，不能作为本仓库的能力承诺。

保留上游 MIT License 文本。新增改造和发布节奏由 `@spcsn` 私有底座线独立维护。

## License

MIT License

Copyright (c) O2Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
