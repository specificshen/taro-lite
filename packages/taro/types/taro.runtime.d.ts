import Taro from './index'

export interface TaroRuntimeOptions {
  prerender: boolean
  debug: boolean
  miniGlobal?: any
}

declare module './index' {
  interface TaroStatic {
    options: TaroRuntimeOptions
  }
}
