import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { createLogger } from 'vite';

import type { Dirent } from 'node:fs';
import type { Logger } from 'vite';

const viteLogger = createLogger('info', {
  prefix: '[taro]',
  allowClearScreen: false,
});

type LoggerInfoOptions = Parameters<Logger['info']>[1];

const VITE_BUILDING_ENVIRONMENT_MESSAGE = /^vite v\S+ building \S+ environment for \S+\.\.\.$/;
const VITE_BUILD_STARTED_MESSAGE = /^build started\.\.\.$/;
const VITE_BUILT_IN_MESSAGE = /^built in (\S+)\.$/;
const ANSI_ESCAPE_CODE = /\u001b\[[0-?]*[ -/]*[@-~]/g;
const ANSI_RESET = '\u001B[0m';
const ANSI_CYAN = '\u001B[96m';
const ANSI_GREEN = '\u001B[92m';
const RAINBOW_BAR_COLORS = ['\u001B[96m', '\u001B[92m', '\u001B[93m', '\u001B[95m', '\u001B[91m', '\u001B[94m'];

function formatBytes(byteSize: number): string {
  if (byteSize < 1024) return `${byteSize.toFixed(0)} B`;
  if (byteSize < 1024 * 1024) return `${(byteSize / 1024).toFixed(2)} kB`;
  return `${(byteSize / 1024 / 1024).toFixed(2)} MB`;
}

function calculateDirectorySize(directoryPath: string): number {
  if (!existsSync(directoryPath)) return 0;

  return readdirSync(directoryPath, { withFileTypes: true }).reduce((totalSize: number, entry: Dirent) => {
    const entryPath = join(directoryPath, entry.name);
    if (entry.isDirectory()) return totalSize + calculateDirectorySize(entryPath);
    if (entry.isFile()) return totalSize + statSync(entryPath).size;
    return totalSize;
  }, 0);
}

function normalizeViteLogLine(message: string): string {
  return message.replace(ANSI_ESCAPE_CODE, '').replace(/\r/g, '').trim();
}

function createBuildProgressRenderer() {
  const frames = [18, 42, 66, 88];
  const barLength = 20;
  let currentFrameIndex = 0;
  let isProgressLineActive = false;

  return {
    start() {
      const percent = frames[Math.min(currentFrameIndex, frames.length - 1)];
      currentFrameIndex += 1;
      renderBuildProgress(percent, '代码正在穿微信小程序外套');
    },
    finish() {
      renderBuildProgress(100, '构建完成，继续监听变更');
      process.stdout.write('\n');
      currentFrameIndex = 0;
      isProgressLineActive = false;
    },
    breakLineBeforeLog() {
      if (!isProgressLineActive) return;

      process.stdout.write('\n');
      isProgressLineActive = false;
    },
  };

  function renderBuildProgress(percent: number, label: string) {
    const filledLength = Math.round((percent / 100) * barLength);
    const bar = Array.from({ length: barLength }, (_, index) => {
      const color = RAINBOW_BAR_COLORS[index % RAINBOW_BAR_COLORS.length];
      const symbol = index < filledLength ? '█' : '▒';
      return `${color}${symbol}${ANSI_RESET}`;
    }).join('');
    process.stdout.write(`${ANSI_CYAN}构建进度${ANSI_RESET} ${ANSI_GREEN}${percent}%${ANSI_RESET} ${bar} ${label}\n`);
    isProgressLineActive = false;
  }
}

export function createDevBuildSummaryLogger(outputRoot: string): Logger {
  const devLogger = createLogger('info', {
    prefix: '[taro]',
    allowClearScreen: false,
  });
  const progress = createBuildProgressRenderer();

  devLogger.info = (message: string, _options?: LoggerInfoOptions) => {
    const lines = message.split('\n');
    const visibleLines: string[] = [];

    for (const line of lines) {
      const trimmedLine = normalizeViteLogLine(line);
      if (VITE_BUILDING_ENVIRONMENT_MESSAGE.test(trimmedLine)) {
        progress.start();
        continue;
      }
      if (VITE_BUILD_STARTED_MESSAGE.test(trimmedLine)) {
        progress.start();
        continue;
      }
      const builtInResult = trimmedLine.match(VITE_BUILT_IN_MESSAGE);
      if (builtInResult) {
        progress.finish();
        const [, viteDurationLabel] = builtInResult;
        const outputSizeLabel = formatBytes(calculateDirectorySize(outputRoot));
        process.stdout.write(`✨ 小程序编译完成：Vite 耗时 ${viteDurationLabel} · 产物总体积 ${outputSizeLabel}\n`);
        continue;
      }
      if (trimmedLine) {
        visibleLines.push(trimmedLine);
      }
    }

    const visibleMessage = visibleLines.join('\n').trim();
    if (visibleMessage) {
      progress.breakLineBeforeLog();
      process.stdout.write(`${visibleMessage}\n`);
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
