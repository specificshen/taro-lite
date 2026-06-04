import { ComponentType } from 'react';
import { StandardProps, CommonEventFunction, FormItemProps } from './common';
interface SliderProps extends StandardProps, FormItemProps {
  /** 最小值
   * @default 0
   * @supported weapp
   */
  min?: number;
  /** 最大值
   * @default 100
   * @supported weapp
   */
  max?: number;
  /** 步长，取值必须大于 0，并且可被(max - min)整除
   * @default 1
   * @supported weapp
   */
  step?: number;
  /** 是否禁用
   * @default false
   * @supported weapp
   */
  disabled?: boolean;
  /** 当前取值
   * @default 0
   * @supported weapp
   */
  value?: number;
  /** 设置 React 非受控状态下的初始取值
   * @supported weapp
   * @unique
   */
  defaultValue?: string;
  /** 背景条的颜色（请使用 backgroundColor）
   * @default "#e9e9e9"
   * @supported weapp
   */
  color?: string;
  /** 已选择的颜色（请使用 activeColor）
   * @default "#1aad19"
   * @supported weapp
   */
  selectedColor?: string;
  /** 已选择的颜色
   * @default "#1aad19"
   * @supported weapp
   */
  activeColor?: string;
  /** 背景条的颜色
   * @default "#e9e9e9"
   * @supported weapp
   */
  backgroundColor?: string;
  /** 滑块的大小，取值范围为 12 - 28
   * @default 28
   *  @supported weapp
   */
  blockSize?: number;
  /** 滑块的颜色
   * @default "#ffffff"
   * @supported weapp
   */
  blockColor?: string;
  /** 是否显示当前 value
   * @default false
   * @supported weapp
   */
  showValue?: boolean;
  /** 完成一次拖动后触发的事件
   * @supported weapp
   */
  onChange?: CommonEventFunction<SliderProps.onChangeEventDetail>;
  /** 拖动过程中触发的事件
   * @supported weapp
   */
  onChanging?: CommonEventFunction<SliderProps.onChangeEventDetail>;
}
declare namespace SliderProps {
  interface onChangeEventDetail {
    value;
  }
}
/** 滑动选择器
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
 *         <Text>设置 step</Text>
 *         <Slider step={1} value={50}/>
 *         <Text>显示当前 value</Text>
 *         <Slider step={1} value={50} showValue/>
 *         <Text>设置最小/最大值</Text>
 *         <Slider step={1} value={100} showValue min={50} max={200}/>
 *       </View>
 *     )
 *   }
 * }
 * ```
 * @example_vue
 * ```html
 * <template>
 *   <view class="components-page">
 *     <text>设置 step</text>
 *     <slider step="1" value="50"/>
 *     <text>显示当前 value</text>
 *     <slider step="1" value="50" :show-value="true" />
 *     <text>设置最小/最大值</text>
 *     <slider step="1" value="100" :show-value="true" min="50" max="200"/>
 *   </view>
 * </template>
 * ```
 * @see https://developers.weixin.qq.com/miniprogram/dev/component/slider.html
 */
declare const Slider: ComponentType<SliderProps>;
export { Slider, SliderProps };
