{{#if typescript }}import { PropsWithChildren } from 'react'{{/if}}
import { useLaunch } from '@spcsn/taro'

import './app.{{ cssExt }}'

function App({ children }{{#if typescript }}: PropsWithChildren<any>{{/if}}) {
  useLaunch(() => {
    console.log('App launched.')
  })

  // children 是将要会渲染的页面
  return children
}

export default App
