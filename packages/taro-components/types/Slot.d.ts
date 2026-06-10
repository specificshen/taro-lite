import { StandardProps } from './common'
import type { ComponentType, ReactNode } from 'react'

interface SlotProps extends StandardProps {
  /** 指定插入的 slot 位置
   * @default none
   * @supported weapp
   */
  name?: string
}

/** slot 插槽
 * @classification viewContainer
 * @supported weapp
 * @example
 * ```tsx
 * import { Slot, View, Text } from '@spcsn/taro-components'
 *
 * export default class SlotView extends Component {
 *   render () {
 *     return (
 *       <View>
 *         <custom-component>
 *           <Slot name='title'>
 *            <Text>Hello, world!</Text>
 *           </Slot>
 *         </custom-component>
 *       </View>
 *     )
 *   }
 * }
 * ```
 */
declare const Slot: ComponentType<SlotProps>

export { Slot, SlotProps }
