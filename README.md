# SPCSN Taro Mini Runtime

`@spcsn` 独立小程序底座，来源于 Taro 代码基线，但不再沿用上游 Taro 的多端、多框架、`4.x` 版本语义。

本仓库只维护一条主链路：**React 19 开发微信小程序 WeApp，输出 Skyline / glass-easel 产物**。

## 定位

这是 `@spcsn` 自己的底座产品线，不是官方 Taro 的 patch 包。

- 当前稳定线从 `1.0.0` 起步，不映射上游 Taro `4.x`。
- 只保证 React 19 开发 WeApp 小程序链路。
- 底层构建器由底座内部管理，Webpack runner 不在维护范围内。
- H5、React Native、Harmony、支付宝、字节、百度、QQ 等平台不在当前承诺范围内。
- Vue、Solid、Nerv 等非 React 框架不在当前承诺范围内。

不要把 `@spcsn/*` 与官方 `@tarojs/*` 混装，也不要用上游 Taro 版本号判断本仓库能力边界。

## 依赖边界

业务工程只安装自己直接理解和直接使用的包。

最小依赖集：

```json
{
  "dependencies": {
    "@spcsn/taro": "1.1.1",
    "@spcsn/taro-components": "1.1.1",
    "react": "^19.2.0"
  },
  "devDependencies": {
    "@spcsn/taro-cli": "1.1.1"
  }
}
```

业务工程只应显式安装上面的三个 `@spcsn` 入口包。构建器、运行时、平台适配、原生绑定、Babel/PostCSS 插件等都属于底座内部实现，由 CLI 和入口包闭包管理。

业务侧如果需要显式安装额外包，必须能回答“业务源码是否直接 import 它，或它是否是明确的命令行工具”。

## 版本策略

当前独立稳定版本线从 `1.0.0` 开始。

- `1.0.x`：React 19 开发 WeApp / Skyline 小程序主链路的 bugfix、发版修正和依赖边界收敛。
- `1.x` minor：底座能力边界或业务接入约定向前兼容扩展。
- `2.0.0`：业务接入契约发生不兼容变化时再考虑。

当前所有可发布的 `@spcsn/*` 底座包必须成组发布、成组安装，不要只替换 CLI、runtime 或某一个插件包。后续包收敛目标见 [docs/package-consolidation.md](docs/package-consolidation.md)。

## 开发环境

- Node.js 22+
- pnpm 10+
- React 19

安装依赖：

```bash
pnpm install
```

构建底座：

```bash
pnpm run build
```

局部调试 CLI 时可以只构建入口包：

```bash
pnpm --filter @spcsn/taro-cli run build
```

查看 CLI 版本：

```bash
node packages/taro-cli/bin/taro --version
```

## 常用脚本

```bash
pnpm run lint            # biome lint
pnpm run format:check    # biome format 检查
pnpm run format          # biome format 自动修复
pnpm run typecheck       # 所有 packages 的 TypeScript 检查
pnpm run typecheck:fixtures  # 示例工程的 TypeScript 检查
pnpm run build           # 构建所有 packages
pnpm run test            # 运行 packages 测试
pnpm run verify:fixture:weapp  # 构建示例小程序
pnpm run release:check   # 发布前检查
```

## 业务接入示例

业务工程配置示例：

```ts
export default {
  framework: 'react',
  compiler: 'vite',
}
```

业务工程验证：

```bash
pnpm install
npm run build
```

构建输出应显示当前 `@spcsn/taro-cli` 版本，例如：

```text
SPCSN Taro v1.1.1
```

## 发版前检查

发版前至少确认：

- 所有发布包版本一致。
- README 的最小依赖集与业务工程实际依赖一致。
- 业务工程没有显式安装底座内部实现依赖。
- `node packages/taro-cli/bin/taro --version` 输出正确版本。
- 真实业务工程 `npm run build` 通过。

常用检查命令：

```bash
pnpm run release:check
pnpm run verify:fixture:weapp
```

`release:check` 会检查 `packages/*` 的版本、发布面和业务工程依赖契约是否与当前 `@spcsn` 底座边界一致。

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

运行发布前检查：

```bash
pnpm run release:check
```

先 dry-run，确认 tarball 内容和依赖版本：

```bash
pnpm -r --filter './packages/*' publish --access public --tag latest --dry-run
```

确认无误后正式发布：

```bash
pnpm -r --filter './packages/*' publish --access public --tag latest
```

发布完成后，在业务工程把本地 `link:` 依赖切成 npm 版本并验证：

```json
{
  "dependencies": {
    "@spcsn/taro": "1.1.1",
    "@spcsn/taro-components": "1.1.0"
  },
  "devDependencies": {
    "@spcsn/taro-cli": "1.1.1"
  }
}
```

```bash
pnpm install
npm run build
```
## License

MIT，详见 [LICENSE](LICENSE)。
