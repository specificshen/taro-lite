export interface Current {
  app: any | null
  router: {
    params: Record<string, unknown>
    path: string
    $taroPath: string
    onReady: string
    onHide: string
    onShow: string
    exitState?: any
  } | null
  page: any | null
  preloadData?: any
}

export const Current: Current

export interface IFileType {
  style: string
  script: string
  templ: string
  config: string
  xs?: string
}

export * from './config'
