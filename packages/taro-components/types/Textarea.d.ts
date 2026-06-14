import { ComponentType } from 'react';
import { StandardProps, CommonEventFunction, FormItemProps } from './common';
interface TextareaProps extends StandardProps, FormItemProps {
  /** 输入框的内容
   * @supported weapp
   */
  value?: string;
  /** 设置 React 非受控输入框的初始内容
   * @supported weapp
   * @unique
   */
  defaultValue?: string;
  /** 输入框为空时占位符
   * @supported weapp
   */
  placeholder?: string;
  /** 指定 placeholder 的样式
   * @supported weapp
   */
  placeholderStyle?: string;
  /** 指定 placeholder 的样式类
   * @default "textarea-placeholder"
   * @supported weapp
   */
  placeholderClass?: string;
  /** 是否禁用
   * @default false
   * @supported weapp
   */
  disabled?: boolean;
  /** 最大输入长度，设置为 -1 的时候不限制最大长度
   * @default 140
   * @supported weapp
   */
  maxlength?: number;
  /** 自动聚焦，拉起键盘
   * @default false
   * @supported weapp
   */
  autoFocus?: boolean;
  /** 获取焦点
   * @default false
   * @supported weapp
   */
  focus?: boolean;
  /** 是否自动增高，设置 autoHeight 时，style.height不生效
   * @default false
   * @supported weapp
   */
  autoHeight?: boolean;
  /** 如果 Textarea 是在一个 `position:fixed` 的区域，需要显示指定属性 fixed 为 true
   * @default false
   * @supported weapp
   */
  fixed?: boolean;
  /** 指定光标与键盘的距离，单位 px 。取 Textarea 距离底部的距离和 cursorSpacing 指定的距离的最小值作为光标与键盘的距离
   * @default 0
   * @supported weapp
   */
  cursorSpacing?: number;
  /** 指定 focus 时的光标位置
   * @default -1
   * @supported weapp
   */
  cursor?: number;
  /** 是否显示键盘上方带有”完成“按钮那一栏
   * @default true
   * @supported weapp
   */
  showConfirmBar?: boolean;
  /** 光标起始位置，自动聚集时有效，需与 selectionEnd 搭配使用
   * @default -1
   * @supported weapp
   */
  selectionStart?: number;
  /** 光标结束位置，自动聚集时有效，需与 selectionStart 搭配使用
   * @default -1
   * @supported weapp
   */
  selectionEnd?: number;
  /** 键盘弹起时，是否自动上推页面
   * @default true
   * @supported weapp
   */
  adjustPosition?: boolean;
  /** focus 时，点击页面的时候不收起键盘
   * @default false
   * @supported weapp
   */
  holdKeyboard?: boolean;
  /** 是否去掉 iOS 下的默认内边距
   * @default false
   * @supported weapp
   */
  disableDefaultPadding?: boolean;
  /** 设置键盘右下角按钮的文字
   * @supported weapp
   */
  confirmType?: 'send' | 'search' | 'next' | 'go' | 'done' | 'return';
  /** 点击键盘右下角按钮时是否保持键盘不收起
   * @supported weapp
   */
  confirmHold?: boolean;
  /** 键盘对齐位置
   * @supported weapp
   * @default 'cursor'
   */
  adjustKeyboardTo?: 'cursor' | 'bottom';
  /** 需传入对象，格式为 { fontSize: number, fontWeight: string, color: string }
   * @supported weapp
   */
  placeholderStyle?: string;
  /** 输入框聚焦时触发
   * @supported weapp
   */
  onFocus?: CommonEventFunction<TextareaProps.onFocusEventDetail>;
  /** 输入框失去焦点时触发
   * @supported weapp
   */
  onBlur?: CommonEventFunction<TextareaProps.onBlurEventDetail>;
  /** 输入框行数变化时调用
   * @supported weapp
   */
  onLineChange?: CommonEventFunction<TextareaProps.onLineChangeEventDetail>;
  /** 当键盘输入时，触发 input 事件
   *
   * **onInput 处理函数的返回值并不会反映到 textarea 上**
   * @supported weapp
   */
  onInput?: CommonEventFunction<TextareaProps.onInputEventDetail>;
  /** 点击完成时， 触发 confirm 事件
   * @supported weapp
   */
  onConfirm?: CommonEventFunction<TextareaProps.onConfirmEventDetail>;
  /** 键盘高度发生变化的时候触发此事件
   * @supported weapp
   */
  onKeyboardHeightChange?: CommonEventFunction<TextareaProps.onKeyboardHeightChangeEventDetail>;
}
declare namespace TextareaProps {
  interface onFocusEventDetail {
    /** 输入值 */
    value: string;
    /** 键盘高度 */
    height: number;
  }
  interface onBlurEventDetail {
    /** 输入值 */
    value: string;
    /** 光标位置 */
    cursor: number;
  }
  interface onLineChangeEventDetail {
    height: number;
    heightRpx: number;
    lineCount: number;
  }
  interface onInputEventDetail {
    /** 输入值 */
    value: string;
    /** 光标位置 */
    cursor: number;
    /** 键值 */
    keyCode: number;
  }
  interface onConfirmEventDetail {
    /** 输入值 */
    value: string;
  }
  interface onKeyboardHeightChangeEventDetail {
    /** 键盘高度 */
    height: number;
    /** 持续时间 */
    duration: number;
  }
}
/** 多行输入框。该组件是原生组件，使用时请注意相关限制
 * @classification forms
 * @supported weapp
 * @example_react
 * ```tsx
 * export default class PageView extends Component {
 *   constructor() {
 *     super(...arguments)
 *   }
 *
 *   render() {
 *     return (
 *       <View className='components-page'>
 *         <Text>输入区域高度自适应，不会出现滚动条</Text>
 *         <Textarea style='background:#fff;width:100%;min-height:80px;padding:0 30rpx;' autoHeight/>
 *         <Text>这是一个可以自动聚焦的 textarea</Text>
 *         <Textarea style='background:#fff;width:100%;height:80px;padding:0 30rpx;' autoFocus/>
 *       </View>
 *     )
 *   }
 * }
 * ```
 * ```html
 * <template>
 *   <view class="components-page">
 *     <text>输入区域高度自适应，不会出现滚动条</text>
 *     <textarea style="background:#efefef;width:100%;min-height:80px;padding:0 30rpx;" :auto-height="true" />
 *     <text>这是一个可以自动聚焦的 textarea</text>
 *     <textarea style="background:#efefef;width:100%;height:80px;padding:0 30rpx;" :auto-focusd="true" />
 *   </view>
 * </template>
 * ```
 * @see https://developers.weixin.qq.com/miniprogram/dev/component/textarea.html
 */
declare const Textarea: ComponentType<TextareaProps>;
export { Textarea, TextareaProps };
