import type { Compiler, CompilerTypes, CompilerViteTypes } from '../compiler'
import type { OutputExt } from './project'
import type { IOption, IPostcssOption, IUrlLoaderOption } from './util'

type ViteOutputOptions = {
  chunkFileNames?: string | ((chunkInfo: any) => string)
}

interface Runtime {
  enableSizeAPIs?: boolean
  enableTemplateContent?: boolean
  enableCloneNode?: boolean
  enableContains?: boolean
  enableMutationObserver?: boolean
}

export interface IMiniAppConfig<T extends CompilerTypes = CompilerViteTypes> {
  /** 用于控制是否生成 js、css 对应的 sourceMap (默认值：watch 模式下为 true，否则为 false) */
  enableSourceMap?: boolean

  /** sourcemap 类型配置 */
  sourceMapType?: string

  /** 指定 React 框架相关的代码是否使用开发环境（未压缩）代码，默认使用生产环境（压缩后）代码 */
  debugReact?: boolean

  /** 是否跳过第三方依赖 usingComponent 的处理，默认为自动处理第三方依赖的自定义组件 */
  skipProcessUsingComponents?: boolean

  /** 压缩小程序 xml 文件的相关配置 */
  minifyXML?: {
    /** 是否合并 xml 文件中的空格 (默认false) */
    collapseWhitespace?: boolean
  }

  /** Vite 小程序输出配置，目前仅适配 chunkFileNames。 */
  output?: Pick<ViteOutputOptions, 'chunkFileNames'> & OutputExt

  /** 配置 postcss 相关插件 */
  postcss?: IPostcssOption<'mini'>

  /** CSS 处理的附加配置 */
  cssLoaderOption?: IOption

  /** Sass 处理的附加配置 */
  sassLoaderOption?: IOption

  /** Less 处理的附加配置 */
  lessLoaderOption?: IOption

  /** Stylus 处理的附加配置 */
  stylusLoaderOption?: IOption

  /** 针对 mp4 | webm | ogg | mp3 | wav | flac | aac 文件的资源处理配置 */
  mediaUrlLoaderOption?: IUrlLoaderOption

  /** 针对 woff | woff2 | eot | ttf | otf 文件的资源处理配置 */
  fontUrlLoaderOption?: IUrlLoaderOption

  /** 针对 png | jpg | jpeg | gif | bpm | svg 文件的资源处理配置 */
  imageUrlLoaderOption?: IUrlLoaderOption

  /** 样式抽取的附加配置 */
  miniCssExtractPluginOption?: IOption

  /** 用于告诉 Taro 编译器需要抽取的公共文件 */
  commonChunks?: string[] | ((commonChunks: string[]) => string[])

  /** 为某些页面单独指定需要引用的公共文件 */
  addChunkPages?: (pages: Map<string, string[]>, pagesNames?: string[]) => void

  /** 优化主包的体积大小 */
  optimizeMainPackage?: {
    enable?: boolean
    exclude?: any[]
  }

  /** 小程序编译过程的相关配置 */
  compile?: {
    exclude?: any[]
    include?: any[]
    /** 对应 Vite 小程序编译链路的文件过滤配置。 */
    filter?: (filename: string) => boolean
  }

  /** 插件内部使用 */
  runtime?: Runtime

  /** 使用的编译工具。可选值：vite */
  compiler?: Compiler<T>

  /** 体验式功能 */
  experimental?: {
    /** 是否开启编译模式 */
    compileMode?: boolean | string
    /** 模版渲染时是否使用wxs等小程序脚本语言 */
    useXsForTemplate?: boolean
  }
}

export interface IMiniFilesConfig {
  [configName: string]: {
    content: any
    path: string
  }
}
