import { ComponentType } from 'react';
import { StandardProps, CommonEventFunction, FormItemProps } from './common';
interface InputProps extends StandardProps, FormItemProps {
  /** 输入框的初始内容
   * @supported weapp
   */
  value?: string;
  /** 设置 React 非受控输入框的初始内容
   * @supported weapp
   * @unique
   */
  defaultValue?: string;
  /** input 的类型
   * @default "text"
   * @supported weapp
   */
  type?: keyof InputProps.Type;
  /** 是否是密码类型
   * @default false
   * @supported weapp
   */
  password?: boolean;
  /** 输入框为空时占位符
   * @supported weapp
   */
  placeholder?: string;
  /** 指定 placeholder 的样式
   * @supported weapp
   */
  placeholderStyle?: string;
  /** 指定 placeholder 的样式类
   * @default "input-placeholder"
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
  /** 指定光标与键盘的距离，单位 px 。取 input 距离底部的距离和 cursor-spacing 指定的距离的最小值作为光标与键盘的距离
   * @default 0
   * @supported weapp
   */
  cursorSpacing?: number;
  /** (即将废弃，请直接使用 focus )自动聚焦，拉起键盘
   * @default false
   * @deprecated
   * @supported weapp
   */
  autoFocus?: boolean;
  /** 获取焦点
   * @default false
   * @supported weapp
   */
  focus?: boolean;
  /** 设置键盘右下角按钮的文字，仅在type='text'时生效
   * @alipay confirm-type 与 enableNative 属性冲突，若希望 confirm-type 生效，enableNative 不能设定为 false，而且不能设定 always-system
   * @default done
   * @supported weapp
   */
  confirmType?: keyof InputProps.ConfirmType;
  /** 点击键盘右下角按钮时是否保持键盘不收起
   * @default false
   * @supported weapp
   */
  confirmHold?: boolean;
  /** 指定focus时的光标位置
   * @supported weapp
   */
  cursor?: number;
  /** 光标起始位置，自动聚集时有效，需与selection-end搭配使用
   * @default -1
   * @supported weapp
   */
  selectionStart?: number;
  /** 光标结束位置，自动聚集时有效，需与selection-start搭配使用
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
  /**
   * 强制 input 处于同层状态，默认 focus 时 input 会切到非同层状态 (仅在 iOS 下生效)
   * @default false
   * @supported weapp
   */
  alwaysEmbed?: boolean;
  /**
   * 安全键盘加密公钥的路径，只支持包内路径
   * @supported weapp
   */
  safePasswordCertPath?: string;
  /**
   * 安全键盘输入密码长度
   * @supported weapp
   */
  safePasswordLength?: number;
  /**
   * 安全键盘加密时间戳
   * @supported weapp
   */
  safePasswordTimeStamp?: number;
  /**
   * 安全键盘加密盐值
   * @supported weapp
   */
  safePasswordNonce?: string;
  /**
   * 安全键盘计算hash盐值，若指定custom-hash 则无效
   * @supported weapp
   */
  safePasswordSalt?: string;
  /**
   * 安全键盘计算hash的算法表达式，如 `md5(sha1('foo' + sha256(sm3(password + 'bar'))))`
   * @supported weapp
   */
  safePasswordCustomHash?: string;
  /** 当键盘输入时，触发input事件，event.detail = {value, cursor, keyCode}，处理函数可以直接 return 一个字符串，将替换输入框的内容。
   * @supported weapp
   */
  onInput?: CommonEventFunction<InputProps.inputEventDetail>;
  /** 输入框聚焦时触发，event.detail = { value, height }，height 为键盘高度
   * @supported weapp
   */
  onFocus?: CommonEventFunction<InputProps.inputForceEventDetail>;
  /** 输入框失去焦点时触发
   * @supported weapp
   */
  onBlur?: CommonEventFunction<InputProps.inputValueEventDetail>;
  /** 点击完成按钮时触发
   * @supported weapp
   */
  onConfirm?: CommonEventFunction<InputProps.inputValueEventDetail>;
  /** 键盘高度发生变化的时候触发此事件
   * @supported weapp
   */
  onKeyboardHeightChange?: CommonEventFunction<InputProps.onKeyboardHeightChangeEventDetail>;
  /** 用户昵称审核完毕后触发，仅在 type 为 "nickname" 时有效，event.detail = { pass, timeout }
   * @supported weapp
   */
  onNickNameReview?: CommonEventFunction;
}
declare namespace InputProps {
  /** Input 类型 */
  interface Type {
    /** 文本输入键盘
     * @supported weapp
     */
    text;
    /** 数字输入键盘
     * @supported weapp
     */
    number;
    /** 身份证输入键盘
     *@supported weapp
     */
    idcard;
    /** 带小数点的数字键盘
     * @supported weapp
     */
    digit;
    /** 密码安全输入键盘[指引](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/safe-password.html)
     * @supported weapp
     */
    'safe-password';
    /** 昵称输入键盘
     * @supported weapp
     */
    nickname;
  }
  /** Confirm 类型 */
  interface ConfirmType {
    /** 右下角按钮为“发送” */
    send;
    /** 右下角按钮为“搜索” */
    search;
    /** 右下角按钮为“下一个” */
    next;
    /** 右下角按钮为“前往” */
    go;
    /** 右下角按钮为“完成” */
    done;
  }
  interface inputEventDetail {
    /** 输入值 */
    value: string;
    /** 光标位置 */
    cursor: number;
    /** 键值 */
    keyCode: number;
  }
  interface inputForceEventDetail {
    /** 输入值 */
    value: string;
    /** 键盘高度 */
    height: number;
  }
  interface inputValueEventDetail {
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
/** 输入框。该组件是原生组件，使用时请注意相关限制
 * @classification forms
 * @supported weapp
 * @example_react
 * ```tsx
 * class App extends Component {
 *   render () {
 *     return (
 *       <View className='example-body'>
 *         <Text>可以自动聚焦的 input</Text>
 *           <Input type='text' placeholder='将会获取焦点' focus/>
 *           <Text>控制最大输入长度的 input</Text>
 *           <Input type='text' placeholder='最大输入长度为 10' maxLength='10'/>
 *           <Text>数字输入的 input</Text>
 *           <Input type='number' placeholder='这是一个数字输入框'/>
 *           <Text>密码输入的 input</Text>
 *           <Input type='password' password placeholder='这是一个密码输入框'/>
 *           <Text>带小数点的 input</Text>
 *           <Input type='digit' placeholder='带小数点的数字键盘'/>
 *           <Text>身份证输入的 input</Text>
 *           <Input type='idcard' placeholder='身份证输入键盘'/>
 *           <Text>控制占位符颜色的 input</Text>
 *           <Input type='text' placeholder='占位符字体是红色的' placeholderStyle='color:red'/>
 *       </View>
 *     )
 *   }
 * }
 * ```
 * @example_vue
 * ```html
 * <template>
 *   <view class="example-body">
 *     <text>可以自动聚焦的 input</text>
 *     <input type="text" placeholder="将会获取焦点" :focus="true" />
 *     <text>控制最大输入长度的 input</text>
 *     <input type="text" placeholder="最大输入长度为 10" maxLength="10"/>
 *     <text>数字输入的 input</text>
 *     <input type="number" placeholder="这是一个数字输入框"/>
 *     <text>密码输入的 input</text>
 *     <input type="password" :password="true" placeholder="这是一个密码输入框"/>
 *     <text>带小数点的 input</text>
 *     <input type="digit" placeholder="带小数点的数字键盘"/>
 *     <text>身份证输入的 input</text>
 *     <input type="idcard" placeholder="身份证输入键盘"/>
 *     <text>控制占位符颜色的 input</text>
 *     <input type="text" placeholder="占位符字体是红色的" placeholder-style="color:red;"/>
 *   </view>
 * </template>
 * ```
 * @see https://developers.weixin.qq.com/miniprogram/dev/component/input.html
 */
declare const Input: ComponentType<InputProps>;
export { Input, InputProps };
