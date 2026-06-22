import { CHANGE, INPUT, TYPE, VALUE } from '../constants';
import { TaroElement } from './element';
import type { TaroEvent } from './event';

export class FormElement extends TaroElement {
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

  public dispatchEvent(event: TaroEvent) {
    if (event.mpEvent) {
      const val = event.mpEvent.detail.value;
      if (event.type === CHANGE) {
        this.props.value = val as string;
      } else if (event.type === INPUT) {
        // 表单组件的 value 应该跟着输入改变
        // 只是改 this.props.value 的话不会进行 setData，因此这里修改 this.value。
        this.value = val as string;
      }
    }

    return super.dispatchEvent(event);
  }
}
