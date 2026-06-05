import chalk from 'chalk';
import supportsHyperlinks from 'supports-hyperlinks';

interface ITerminalLinkOptions {
  target?: 'stdout' | 'stderr';
  fallback?: boolean | ((text: string, url: string) => string);
  [key: string]: unknown;
}

function createTerminalLink(text: string, url: string) {
  return `\u001B]8;;${url}\u0007${text}\u001B]8;;\u0007`;
}

function terminalLink(text: string, url: string, { target = 'stdout', fallback }: ITerminalLinkOptions = {}) {
  if (!supportsHyperlinks[target]) {
    if (fallback === false) return text;

    return typeof fallback === 'function' ? fallback(text, url) : `${text} (\u200B${url}\u200B)`;
  }

  return createTerminalLink(text, url);
}

terminalLink.isSupported = supportsHyperlinks.stdout;
terminalLink.stderr = ((text: string, url: string, options = {}) =>
  terminalLink(text, url, { target: 'stderr', ...options })) as typeof terminalLink;
terminalLink.stderr.isSupported = supportsHyperlinks.stderr;

export { chalk, terminalLink };
