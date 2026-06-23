/**
 * ESM 默认导入类型入口
 *
 * TypeScript 在 module: esnext + moduleResolution: bundler 下使用 import 条件时，
 * 会把模块当作 ESM 处理，而 UMD 的 `export = Taro` 不支持 `import Taro from '@spcsn/taro'`。
 * 该文件在保留原有 UMD 类型入口（index.d.ts）和模块扩充的前提下，提供兼容的 ES 模块默认导出。
 */

import Taro = require('./index')

export default Taro

// src/index.ts 中 named 导出的 hooks
export import useAddToFavorites = Taro.useAddToFavorites
export import useDidHide = Taro.useDidHide
export import useDidShow = Taro.useDidShow
export import useError = Taro.useError
export import useLaunch = Taro.useLaunch
export import useLoad = Taro.useLoad
export import usePageNotFound = Taro.usePageNotFound
export import usePageScroll = Taro.usePageScroll
export import usePullDownRefresh = Taro.usePullDownRefresh
export import useReachBottom = Taro.useReachBottom
export import useReady = Taro.useReady
export import useResize = Taro.useResize
export import useRouter = Taro.useRouter
export import useSaveExitState = Taro.useSaveExitState
export import useScope = Taro.useScope
export import useShareAppMessage = Taro.useShareAppMessage
export import useShareTimeline = Taro.useShareTimeline
export import useTabItemTap = Taro.useTabItemTap
export import useUnhandledRejection = Taro.useUnhandledRejection
export import useUnload = Taro.useUnload

export type Chain = Taro.Chain
