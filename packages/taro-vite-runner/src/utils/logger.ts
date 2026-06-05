import { createLogger } from 'vite';

import type { Logger } from 'vite';

const viteLogger = createLogger('info', {
  prefix: '[taro]',
  allowClearScreen: false,
});

type LoggerInfoOptions = Parameters<Logger['info']>[1];

const BYTE_UNITS: Record<string, number> = {
  B: 1,
  kB: 1024,
  KB: 1024,
  KiB: 1024,
  MB: 1024 * 1024,
  MiB: 1024 * 1024,
};

function formatBytes(byteSize: number): string {
  if (byteSize < 1024) return `${byteSize.toFixed(0)} B`;
  if (byteSize < 1024 * 1024) return `${(byteSize / 1024).toFixed(2)} kB`;
  return `${(byteSize / 1024 / 1024).toFixed(2)} MB`;
}

function readBundleLineSize(line: string): number | null {
  const result = line.match(/^\S+\s+(\d+(?:\.\d+)?)\s+(B|kB|KB|KiB|MB|MiB)\b/);
  if (!result) return null;

  const [, rawSize, unit] = result;
  return Number(rawSize) * BYTE_UNITS[unit];
}

export function createDevBuildSummaryLogger(): Logger {
  const devLogger = createLogger('info', {
    prefix: '[taro]',
    allowClearScreen: false,
  });
  const rawInfo = devLogger.info.bind(devLogger);
  let totalBundleSize = 0;
  let totalBundleFiles = 0;

  devLogger.info = (message: string, options?: LoggerInfoOptions) => {
    const lines = message.split('\n');
    const visibleLines: string[] = [];

    for (const line of lines) {
      const lineSize = readBundleLineSize(line.trim());
      if (lineSize !== null) {
        totalBundleSize += lineSize;
        totalBundleFiles += 1;
        continue;
      }
      visibleLines.push(line);
    }

    const visibleMessage = visibleLines.join('\n').trim();
    if (visibleMessage) {
      rawInfo(visibleMessage, options);
    }

    if (message.includes('built in') && totalBundleFiles > 0) {
      rawInfo(`📦 原生小程序产物总大小：${formatBytes(totalBundleSize)}（${totalBundleFiles} 个文件）`, options);
      totalBundleSize = 0;
      totalBundleFiles = 0;
    }
  };

  return devLogger;
}

export const logger = {
  info(msg: string) {
    viteLogger.info(msg, {
      timestamp: true,
    });
  },
  warn(msg: string) {
    viteLogger.warn(msg, {
      timestamp: true,
    });
  },
  error(msg: string) {
    viteLogger.error(msg, {
      timestamp: true,
    });
  },
};
