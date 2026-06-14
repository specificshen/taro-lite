import { ComponentType } from 'react';
import { CommonEventFunction, StandardProps } from './common';
interface ViewProps extends StandardProps {
  /** 指定按下去的样式类。当 `hover-class="none"` 时，没有点击态效果
   * @default none
   * @supported weapp
   */
  hoverClass?: string;
  /** 指定是否阻止本节点的祖先节点出现点击态
   * @default false
   * @supported weapp
   */
  hoverStopPropagation?: boolean;
  /** 按住后多久出现点击态，单位毫秒
   * @default 50
   * @supported weapp
   */
  hoverStartTime?: number;
  /** 手指松开后点击态保留时间，单位毫秒
   * @default 400
   * @supported weapp
   */
  hoverStayTime?: number;
  /** 是否以 catch 的形式绑定 touchmove 事件
   * @supported weapp
   * @version 3.1.0+
   * @unique
   */
  catchMove?: boolean;
}
/** 视图容器
 * @classification viewContainer
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
 *         <Text>flex-direction: row 横向布局</Text>
 *         <View className='flex-wrp' style='flex-direction:row;'>
 *           <View className='flex-item demo-text-1'/>
 *           <View className='flex-item demo-text-2'/>
 *           <View className='flex-item demo-text-3'/>
 *         </View>
 *         <Text>flex-direction: column 纵向布局</Text>
 *         <View className='flex-wrp' style='flex-direction:column;'>
 *           <View className='flex-item flex-item-V demo-text-1'/>
 *           <View className='flex-item flex-item-V demo-text-2'/>
 *           <View className='flex-item flex-item-V demo-text-3'/>
 *         </View>
 *       </View>
 *     )
 *   }
 * }
 * ```
 * ```html
 * <template>
 *   <view class="components-page">
 *     <text>flex-direction: row 横向布局</text>
 *     <view class="flex-wrp flex-wrp-row" hover-class="hover" >
 *       <view class="flex-item demo-text-1" :hover-stop-propagation="true" />
 *       <view class="flex-item demo-text-2" hover-start-time="1000" hover-class="hover" />
 *       <view class="flex-item demo-text-3" hover-stayTime="1000" hover-class="hover" />
 *     </view>
 *     <text>flex-direction: column 纵向布局</text>
 *     <view class="flex-wrp flex-wrp-column">
 *       <view class="flex-item flex-item-V demo-text-1" />
 *       <view class="flex-item flex-item-V demo-text-2" />
 *       <view class="flex-item flex-item-V demo-text-3" />
 *     </view>
 *   </view>
 * </template>
 *
 * <style>
 * .flex-wrp { display: flex; }
 * .flex-wrp-column{ flex-direction: column; }
 * .flex-wrp-row { flex-direction:row; padding: 20px; background: #f1f1f1; }
 * .flex-item { width: 180px; height: 90px; }
 * .demo-text-1 { background: #ccc; }
 * .demo-text-2 { background: #999; }
 * .demo-text-3 { background: #666; }
 * .hover {
 *   background: #000;
 * }
 * </style>
 * ```
 * @see https://developers.weixin.qq.com/miniprogram/dev/component/view.html
 */
declare const View: ComponentType<ViewProps>;
export { View, ViewProps };
