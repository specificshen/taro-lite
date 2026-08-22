import { CHANGE, INPUT, TYPE, VALUE } from '../constants';
import { TaroElement } from './element';
import type { TaroEvent } from './event';

export class FormElement extends TaroElement {
  /**
   * 原生侧最近一次确认显示的值（input/change 上报，或最近一次实际下发）。
   * 受控回环中 React 回写的值多半与原生已显示值相等，等值时跳过 setData，
   * 消除冗余下发造成的打字回滚闪动与光标/内部滚动位置重置。
   */
  private lastNativeValue: string | undefined;

  public get type() {
    return (this.props[TYPE] as string | undefined) ?? '';
  }

  public set type(val: string) {
    this.setAttribute(TYPE, val);
  }

  public get value() {
    const val = this.props.value;
    return val == null ? '' : String(val);
  }

  public set value(val: string | boolean | number | unknown[]) {
    this.setAttribute(VALUE, val);
  }

  public setAttribute(qualifiedName: string, value: unknown): void {
    if (qualifiedName === VALUE) {
      const next = value == null ? '' : String(value);
      if (this.lastNativeValue !== undefined && next === this.lastNativeValue) {
        // 原生已显示该值：只同步 DOM props，不再下发 setData
        this.props[VALUE] = value as string;
        return;
      }
      this.lastNativeValue = next;
    }
    super.setAttribute(qualifiedName, value);
  }

  public removeAttribute(qualifiedName: string): void {
    if (qualifiedName === VALUE) {
      // 移除后模板回落默认值（空串），跟踪值作废，强制下一次写入真实下发
      this.lastNativeValue = undefined;
    }
    super.removeAttribute(qualifiedName);
  }

  public dispatchEvent(event: TaroEvent) {
    if (event.mpEvent) {
      const val = event.mpEvent.detail.value;
      if (event.type === CHANGE || event.type === INPUT) {
        // 表单组件的 value 应该跟着输入改变
        this.lastNativeValue = val == null ? '' : String(val);
        if (event.type === INPUT) {
          // input 走 setAttribute 统一收口：等值时只更新 props，不再下发 setData
          this.value = val as string;
        } else {
          this.props.value = val as string;
        }
      }
    }

    return super.dispatchEvent(event);
  }
}
