type PostcssInput = string | number
type PostcssUrlOption = Record<string, any>

export type Func = (...args: any[]) => any

export type IOption = Record<string, any>

export type TogglableOptions<T = IOption> = {
  enable?: boolean
  config?: T
}

export interface IUrlLoaderOption extends IOption {
  limit?: number | boolean
  name?: ((moduleId: string) => string) | string
}

export namespace PostcssOption {
  export type cssModules = TogglableOptions<{
    /** 转换模式，取值为 global/module */
    namingPattern: 'global' | string
    /** 自定义生成的class名称规则 */
    generateScopedName: string | ((localName: string, absoluteFilePath: string) => string)
  }>
  export type url = TogglableOptions<PostcssUrlOption>
}

export interface IPxTransformOption {
  /** 设置 1px 是否需要被转换 */
  onePxTransform?: boolean
  /** REM 单位允许的小数位 */
  unitPrecision?: number
  /** 允许转换的属性列表 (默认 [*]) */
  propList?: string[]
  /** 黑名单里的选择器将会被忽略 */
  selectorBlackList?: Array<string | RegExp>
  /** 直接替换而不是追加一条进行覆盖 */
  replace?: boolean
  /** 允许媒体查询里的 px 单位转换 */
  mediaQuery?: boolean
  /** 设置一个可被转换的最小 px 值 */
  minPixelValue?: number
  /** 转换后的单位，当前仅支持小程序 rpx */
  targetUnit?: 'rpx'
  /** 设计稿尺寸 */
  designWidth?: number | ((size?: PostcssInput) => number)
  /** 设计稿尺寸换算规则 */
  deviceRatio?: TaroGeneral.TDeviceRatio
  /** 平台 */
  platform?: 'weapp'
  /** 启用的能力 Scope 默认为 ['platform', 'size'] */
  methods?: string[]
  /** filter 回调函数，可 exclude 不处理的文件 */
  exclude?: (fileName: string) => boolean
}

interface IBasePostcssOption {
  autoprefixer?: TogglableOptions
  pxtransform?: TogglableOptions<IPxTransformOption>
  cssModules?: PostcssOption.cssModules
  [key: string]: any
}

export type IPostcssOption<T extends 'mini' = 'mini'> = T extends 'mini' ? IBasePostcssOption : never

export type ViteConfig = Record<string, unknown>
export type Config = ViteConfig

export interface ICopyOptions {
  patterns: {
    from: string
    to: string
    ignore?: string[]
    transform?: Func
    watch?: boolean
  }[]
  options: {
    ignore?: string[]
  }
}
export interface ICompileOption {
  exclude?: string[]
  include?: string[]
}

export const enum TEMPLATE_TYPES {
  WEAPP = '.wxml'
}

export const enum STYLE_TYPES {
  WEAPP = '.wxss'
}

export const enum SCRIPT_TYPES {
  WEAPP = '.js'
}

export const enum CONFIG_TYPES {
  WEAPP = '.json'
}

export type IMINI_APP_FILE_TYPE = {
  TEMPL: TEMPLATE_TYPES
  STYLE: STYLE_TYPES
  SCRIPT: SCRIPT_TYPES
  CONFIG: CONFIG_TYPES
}

export type IMINI_APP_FILES = {
  [key: string]: IMINI_APP_FILE_TYPE
}
