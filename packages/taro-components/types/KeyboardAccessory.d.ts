import { ComponentType } from 'react'
import { StandardProps } from './common'

/** @ignore */
type KeyboardAccessoryProps = StandardProps

/** 设置 Input / Textarea 聚焦时键盘上方 CoverView / CoverImage 工具栏视图。
 *
 * 该能力依赖微信小程序平台模板支持。业务工程不需要显式配置 SPCSN 内部平台插件。
 *
 * @classification forms
 * @supported weapp
 * @example
 *
 * ```tsx
 * class App extends Component {
 *   render () {
 *     return (
 *       <Textarea holdKeyboard="{{true}}">
 *         <KeyboardAccessory className="container" style={{ height: 50 }} >
 *           <CoverView onClick={() => {}} style={{ flex: 1, background: 'green' }}>1</CoverView>
 *           <CoverView onClick={() => {}} style={{ flex: 1, background: 'red' }}>2</CoverView>
 *         </KeyboardAccessory>
 *       </Textarea>
 *     )
 *   }
 * }
 * ```
 * @see https://developers.weixin.qq.com/miniprogram/dev/component/keyboard-accessory.html
 */
declare const KeyboardAccessory: ComponentType<KeyboardAccessoryProps>

export { KeyboardAccessory, KeyboardAccessoryProps }
