import { Shortcuts, toCamelCase } from '@spcsn/taro-shared';
import { initNativeApi } from './apis';

interface MiniPageInstance {
  setData(data: Record<string, unknown>): void;
}

interface MiniLifecycleConfig {
  page: string[][];
}

interface TransferHydrateData {
  nn: string;
  [key: string]: unknown;
}

interface TransferElement {
  isTransferElement?: boolean;
  dataName: string;
  sid: string;
}

declare const getCurrentPages: () => MiniPageInstance[];

export { initNativeApi };
export * from './apis-list';

export const hostConfig = {
  initNativeApi,
  getMiniLifecycle(config: MiniLifecycleConfig) {
    const methods = config.page[5];
    if (!methods.includes('onSaveExitState')) {
      methods.push('onSaveExitState');
    }
    return config;
  },
  transferHydrateData(
    data: TransferHydrateData,
    element: TransferElement,
    componentsAlias: Record<string, { _num?: string } | undefined>,
  ) {
    if (element.isTransferElement) {
      const pages = getCurrentPages();
      const page = pages[pages.length - 1];
      data[Shortcuts.NodeName] = element.dataName;
      page.setData({
        [toCamelCase(data.nn)]: data,
      });
      return {
        sid: element.sid,
        [Shortcuts.Text]: '',
        [Shortcuts.NodeName]: componentsAlias['#text']?._num || '8',
      };
    }
  },
};
