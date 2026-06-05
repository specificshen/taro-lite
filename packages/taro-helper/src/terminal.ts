import chalk from 'chalk';

interface ITerminalLinkOptions {
  target?: 'stdout' | 'stderr';
  fallback?: boolean | ((text: string, url: string) => string);
  [key: string]: unknown;
}

type TerminalLinkTarget = NonNullable<ITerminalLinkOptions['target']>;

const TERMINAL_PROGRAMS_WITH_HYPERLINKS = new Set(['iTerm.app', 'vscode', 'WezTerm']);

function createTerminalLink(text: string, url: string) {
  return `\u001B]8;;${url}\u0007${text}\u001B]8;;\u0007`;
}

function supportsTerminalHyperlinks(target: TerminalLinkTarget) {
  const stream = target === 'stderr' ? process.stderr : process.stdout;

  if (!stream.isTTY || process.env.FORCE_HYPERLINK === '0') {
    return false;
  }

  if (process.env.FORCE_HYPERLINK) {
    return true;
  }

  if (process.env.WT_SESSION || process.env.DOMTERM || process.env.VTE_VERSION || process.env.KONSOLE_VERSION) {
    return true;
  }

  if (process.env.TERM_PROGRAM && TERMINAL_PROGRAMS_WITH_HYPERLINKS.has(process.env.TERM_PROGRAM)) {
    return true;
  }

  return process.env.TERM === 'xterm-kitty';
}

function terminalLink(text: string, url: string, { target = 'stdout', fallback }: ITerminalLinkOptions = {}) {
  if (!supportsTerminalHyperlinks(target)) {
    if (fallback === false) return text;

    return typeof fallback === 'function' ? fallback(text, url) : `${text} (\u200B${url}\u200B)`;
  }

  return createTerminalLink(text, url);
}

terminalLink.isSupported = supportsTerminalHyperlinks('stdout');
terminalLink.stderr = ((text: string, url: string, options = {}) =>
  terminalLink(text, url, { target: 'stderr', ...options })) as typeof terminalLink;
terminalLink.stderr.isSupported = supportsTerminalHyperlinks('stderr');

export { chalk, terminalLink };
