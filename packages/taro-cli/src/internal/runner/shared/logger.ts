import type { Dirent } from 'node:fs';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { Logger } from 'vite';
import { createLogger } from 'vite';

const viteLogger = createLogger('info', {
  prefix: '[taro]',
  allowClearScreen: false,
});

type LoggerInfoOptions = Parameters<Logger['info']>[1];

const VITE_BUILDING_ENVIRONMENT_MESSAGE = /^vite v\S+ building \S+ environment for \S+\.\.\.$/;
const VITE_BUILD_STARTED_MESSAGE = /^build started\.\.\.$/;
const VITE_WATCHING_MESSAGE = /^watching for file changes\.\.\.$/;
const VITE_BUILT_IN_MESSAGE = /^built in (\S+)\.$/;
const ANSI_ESCAPE_CODE = new RegExp(`${String.fromCharCode(0x1b)}\\[[0-?]*[ -/]*[@-~]`, 'g');
const BUILD_LOG_RESET = '\u001B[0m';
const BUILD_LOG_ACCENT = '\u001B[38;2;255;78;205m';
const BUILD_LOG_DIM_ACCENT = '\u001B[38;2;74;22;63m';
const BUILD_LOG_GLOW = '\u001B[38;2;255;154;240m';
const BUILD_LOG_SUCCESS = '\u001B[92m';

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
  const barLength = 18;
  let currentFrameIndex = 0;
  let isBuildActive = false;
  let isProgressLineActive = false;

  return {
    start() {
      if (isBuildActive) return;

      isBuildActive = true;
      const percent = frames[Math.min(currentFrameIndex, frames.length - 1)];
      currentFrameIndex += 1;
      renderBuildProgress(percent, '代码正在换上小程序外套');
    },
    finish() {
      renderBuildProgress(100, '小程序出炉，继续守炉');
      process.stdout.write('\n');
      currentFrameIndex = 0;
      isBuildActive = false;
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
      if (index === filledLength - 1 && percent < 100) return `${BUILD_LOG_GLOW}◆${BUILD_LOG_RESET}`;
      const color = index < filledLength ? BUILD_LOG_ACCENT : BUILD_LOG_DIM_ACCENT;
      const symbol = index < filledLength ? '━' : '·';
      return `${color}${symbol}${BUILD_LOG_RESET}`;
    }).join('');
    const percentLabel = `${percent}%`.padStart(4, ' ');
    process.stdout.write(
      `${BUILD_LOG_ACCENT}出炉进度${BUILD_LOG_RESET} ${BUILD_LOG_GLOW}${percentLabel}${BUILD_LOG_RESET} ${BUILD_LOG_ACCENT}⟦${BUILD_LOG_RESET}${bar}${BUILD_LOG_ACCENT}⟧${BUILD_LOG_RESET} ${label}\n`,
    );
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
      if (VITE_WATCHING_MESSAGE.test(trimmedLine)) {
        continue;
      }

      const builtInResult = trimmedLine.match(VITE_BUILT_IN_MESSAGE);
      if (builtInResult) {
        progress.finish();
        const [, viteDurationLabel] = builtInResult;
        const outputSizeLabel = formatBytes(calculateDirectorySize(outputRoot));
        process.stdout.write(
          `${BUILD_LOG_SUCCESS}✨ 小程序出炉：耗时 ${viteDurationLabel} · 产物总体积 ${outputSizeLabel}${BUILD_LOG_RESET}\n`,
        );
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
    viteLogger.info(msg, { timestamp: true });
  },
  warn(msg: string) {
    viteLogger.warn(msg, { timestamp: true });
  },
  error(msg: string) {
    viteLogger.error(msg, { timestamp: true });
  },
};
