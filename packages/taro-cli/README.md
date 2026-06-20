# `@spcsn/taro-cli`

`@spcsn/taro-cli` 是 Taro Lite 的命令行入口，负责项目初始化、构建、配置检查和运行环境信息输出。

## 包定位

- 业务侧公开工具包，可全局安装，也可作为项目 devDependency 使用。
- service、runner、helper、shared 等内部能力已源码级内联到本包，不再作为独立包发布。
- 业务项目只应安装 `@spcsn/taro`、`@spcsn/taro-components`、`@spcsn/taro-cli` 三个入口包。

## 安装

```shell
pnpm add -g @spcsn/taro-cli
```

## 使用

```shell
taro <command> [options]
```

## 命令

| 命令 | 说明 |
| --- | --- |
| `init <name>` | 创建新项目 |
| `build` | 构建项目 |
| `config` | 查看或设置全局配置 |
| `doctor` | 检测项目配置与依赖是否有问题 |
| `info` | 打印当前环境信息 |
| `inspect` | 检查 Vite 构建配置 |
| `update` | 更新 `@spcsn` 相关依赖到最新版本 |

## 支持范围

当前只维护 React 19 开发微信小程序（Skyline / glass-easel）链路，不支持 H5、React Native、Harmony、Vue、Webpack 等上游历史路径。
