import type { AppConfig } from '../../index'
import type { Compiler, CompilerTypes, CompilerViteTypes } from '../compiler'
import type { IModifyChainData } from '../hooks'
import type { IMiniAppConfig, IMiniFilesConfig } from './mini'
import type { ICopyOptions, IOption, TogglableOptions } from './util'

type PostcssInput = string | number

export type PluginItem<T = object> = string | [string, T] | [string, () => T | Promise<T>]

interface ICache {
  /**
   * 是否开启持久化缓存。
   */
  enable?: boolean

  /**
   * 当依赖的文件或该文件的依赖改变时，使缓存失效。
   */
  buildDependencies?: Record<string, any>

  /**
   * 缓存子目录的名称。
   */
  name?: string
}

interface ILogger {
  /** 是否简化输出日志 (默认值 true)*/
  quiet: boolean
  /** 是否输出构建统计信息 (默认值 false) */
  stats: boolean
}

export interface IProjectBaseConfig {
  isWatch?: boolean
  port?: number
  /** 项目名称 */
  projectName?: string

  /** 项目创建日期 */
  date?: string

  /** 设计稿尺寸 */
  designWidth?: number | ((size?: PostcssInput) => number)

  /** 设计稿尺寸换算规则 */
  deviceRatio?: TaroGeneral.TDeviceRatio

  watcher?: any[]

  /** 源码存放目录 (默认值：'src') */
  sourceRoot?: string

  /** 代码编译后的生产目录 (默认值：'dist') */
  outputRoot?: string

  /**
   * 用于配置`process.env.xxxx`相关的环境变量
   * @deprecated 建议使用根目录下的 .env 文件替代
   * @description 注意：这里的环境变量只能在业务代码中使用，编译时的 node 环境中无法使用
   * @example
   * ```ts
   * // config/index.ts
   * export default defineConfig({
   *    env: {
   *      xxxx: '"测试"'
   *    }
   * })
   *
   * // src/app.ts
   * onShow() {
   *   console.log(process.env.xxxx) // 打印 "测试"
   * }
   * ```
   */
  env?: IOption

  /** 用于配置目录别名，从而方便书写代码引用路径 */
  alias?: IOption

  /**
   * 用于配置一些常量供代码中进行全局替换使用
   * @description 注意：这里的环境变量只能在业务代码中使用，编译时的 node 环境中无法使用
   * @example
   * ```ts
   * // config/index.ts
   * export default defineConfig({
   *    defineConstants: {
   *        __TEST__: JSON.stringify('test')
   *    }
   * })
   *
   * // src/app.ts
   * onShow() {
   *   console.log(__TEST__) // 打印 "test"
   * }
   * ```
   */
  defineConstants?: IOption

  /** 用于把文件从源码目录直接拷贝到编译后的生产目录 */
  copy?: ICopyOptions

  /** 配置 JS 压缩工具 (默认 oxc)，显式配置时可在 development/watch 构建中强制启用压缩 */
  jsMinimizer?: 'oxc' | 'terser' | 'esbuild'

  /** 配置 CSS 压缩工具 (默认 csso) */
  cssMinimizer?: 'csso' | 'esbuild' | 'lightningcss'

  /** 配置 csso 工具以压缩 CSS 代码 */
  csso?: TogglableOptions

  /** 配置 terser 工具以压缩 JS 代码 */
  terser?: TogglableOptions

  esbuild?: Record<'minify', TogglableOptions>

  uglify?: TogglableOptions
  /** 配置 Taro 插件 */
  plugins?: PluginItem[]

  /** 一个 preset 是一系列 Taro 插件的集合，配置语法同 plugins */
  presets?: PluginItem[]

  /** 模板循环次数 */
  baseLevel?: number

  /** 使用的开发框架。可选值：react */
  framework?: 'react'
  frameworkExts?: string[]

  /** 使用的编译工具。可选值：vite */
  compiler?: Compiler

  /** 持久化缓存配置 */
  cache?: ICache

  /** 控制 Taro 编译日志的输出方式 */
  logger?: ILogger

  /** 用于控制是否生成 js、css 对应的 sourceMap */
  enableSourceMap?: boolean

  /**
   * 编译开始
   */
  onBuildStart?: (...args: any[]) => Promise<any>

  /**
   * 编译完成（启动项目后首次编译结束后会触发一次）
   */
  onBuildComplete?: (...args: any[]) => Promise<any>

  /**
   * 编译结束（保存代码每次编译结束后都会触发）
   */
  onBuildFinish?: (res: { error: unknown; stats: unknown; isWatch: boolean }) => Promise<any>

  modifyAppConfig?: (appConfig: AppConfig) => Promise<any>

  /**
   * 编译中修改 vite 配置
   */
  modifyViteConfig?: (viteConfig: any, data: IModifyChainData) => void

  /**
   * 修改编译后的结果
   */
  modifyBuildAssets?: (assets: any, miniPlugin?: any) => Promise<any>

  /**
   * 修改编译过程中的页面组件配置
   */
  modifyMiniConfigs?: (configMap: IMiniFilesConfig) => Promise<any>

  /**
   * 修改 Taro 编译配置
   */
  modifyRunnerOpts?: (opts: any) => Promise<any>
}

/** 暴露出来给 config/index 使用的配置类型，参考 https://github.com/NervJS/taro-doctor/blob/main/assets/config_schema.json */
export interface IProjectConfig<T extends CompilerTypes = CompilerViteTypes> {
  /** 项目名称 */
  projectName?: string

  /** 项目创建日期 */
  date?: string

  /** 设计稿尺寸 */
  designWidth?: number | ((size?: PostcssInput) => number)

  /** 设计稿尺寸换算规则 */
  deviceRatio?: TaroGeneral.TDeviceRatio

  /** 源码存放目录 (默认值：'src') */
  sourceRoot?: string

  /** 代码编译后的生产目录 (默认值：'dist') */
  outputRoot?: string

  /**
   * 用于配置`process.env.xxxx`相关的环境变量
   * @deprecated 建议使用根目录下的 .env 文件替代
   * @description 注意：这里的环境变量只能在业务代码中使用，编译时的 node 环境中无法使用
   * @example
   * ```ts
   * // config/index.ts
   * export default defineConfig({
   *    env: {
   *      xxxx: '"测试"'
   *    }
   * })
   *
   * // src/app.ts
   * onShow() {
   *   console.log(process.env.xxxx) // 打印 "测试"
   * }
   * ```
   */
  env?: IOption

  /** 用于配置目录别名，从而方便书写代码引用路径 */
  alias?: IOption

  /**
   * 用于配置一些常量供代码中进行全局替换使用
   * @description 注意：这里的环境变量只能在业务代码中使用，编译时的 node 环境中无法使用
   * @example
   * ```ts
   * // config/index.ts
   * export default defineConfig({
   *    defineConstants: {
   *        __TEST__: JSON.stringify('test')
   *    }
   * })
   *
   * // src/app.ts
   * onShow() {
   *   console.log(__TEST__) // 打印 "test"
   * }
   * ```
   */
  defineConstants?: IOption

  /** 用于把文件从源码目录直接拷贝到编译后的生产目录 */
  copy?: ICopyOptions

  /** 配置 JS 压缩工具 (默认 oxc)，显式配置时可在 development/watch 构建中强制启用压缩 */
  jsMinimizer?: 'oxc' | 'terser' | 'esbuild'

  /** 配置 CSS 压缩工具 (默认 csso) */
  cssMinimizer?: 'csso' | 'esbuild' | 'lightningcss'

  /** 配置 csso 工具以压缩 CSS 代码 */
  csso?: TogglableOptions

  /** 配置 terser 工具以压缩 JS 代码 */
  terser?: TogglableOptions

  esbuild?: Record<'minify', TogglableOptions>
  /** 配置 Taro 插件 */
  plugins?: PluginItem[]

  /** 一个 preset 是一系列 Taro 插件的集合，配置语法同 plugins */
  presets?: PluginItem[]

  /** 使用的开发框架。可选值：react */
  framework?: 'react'

  /** 持久化缓存配置 */
  cache?: ICache

  /** 控制 Taro 编译日志的输出方式 */
  logger?: ILogger

  /** 使用的编译工具。可选值：vite */
  compiler?: Compiler<T>

  /** 专属于小程序的配置 */
  mini?: IMiniAppConfig<T>

  [key: string]: any
}

export interface OutputExt {
  /**
   * 编译前清空输出目录
   * @since Taro v3.6.9
   * @description
   * - 默认清空输出目录，可设置 clean: false 不清空
   * - 可设置 clean: { keep: ['project.config.json'] } 保留指定文件
   * - 注意 clean.keep 不支持函数
   */
  clean?: boolean | {
    /** 保留指定文件不删除 */
    keep?: Array<string | RegExp> | string | RegExp
  }
}
