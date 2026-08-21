import { createInterface } from 'node:readline';
import { chalk } from '../internal/helper';

export interface SelectOption<T> {
  name: string;
  value: T;
}

/** 是否处于交互式终端；CI/管道等非 TTY 环境下一律走默认值，绝不阻塞。 */
function isInteractive(): boolean {
  return Boolean(process.stdin.isTTY);
}

function askQuestion(query: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    // stdin 意外关闭（EOF）时兜底为空串，避免悬挂
    rl.on('close', () => resolve(''));
    rl.question(query, (answer) => {
      resolve(answer.trim());
      rl.close();
    });
  });
}

/** 单行输入；空输入回退为 defaultValue（未提供则为 ''）。 */
export async function input(message: string, defaultValue?: string): Promise<string> {
  if (!isInteractive()) return defaultValue ?? '';

  const hint = defaultValue === undefined ? '' : chalk.gray(` (${defaultValue})`);
  const answer = await askQuestion(`${chalk.green('?')} ${chalk.bold(message)}${hint} `);
  return answer === '' ? (defaultValue ?? '') : answer;
}

export function select<T>(message: string, choices: SelectOption<T>[], defaultIndex?: number): Promise<T>;
export function select(message: string, choices: string[], defaultIndex?: number): Promise<string>;
/** 编号列表选择；输入序号或回车取 defaultIndex（默认 0）。 */
export async function select<T>(
  message: string,
  choices: (SelectOption<T> | string)[],
  defaultIndex = 0,
): Promise<T | string> {
  const options = choices.map((choice) => (typeof choice === 'string' ? { name: choice, value: choice } : choice));
  const safeDefaultIndex = Math.min(Math.max(defaultIndex, 0), options.length - 1);

  if (!isInteractive()) return options[safeDefaultIndex].value;

  console.log(`${chalk.green('?')} ${chalk.bold(message)}`);
  options.forEach((option, index) => {
    console.log(`  ${chalk.cyan(`${index + 1})`)} ${option.name}`);
  });

  for (;;) {
    const answer = await askQuestion(`  请输入序号 ${chalk.gray(`(${safeDefaultIndex + 1})`)}: `);
    if (answer === '') return options[safeDefaultIndex].value;
    const index = Number(answer);
    if (Number.isInteger(index) && index >= 1 && index <= options.length) return options[index - 1].value;
    console.log(chalk.red(`  请输入 1-${options.length} 之间的序号！`));
  }
}

/** 确认询问；回车取 defaultValue（未提供默认为 true）。 */
export async function confirm(message: string, defaultValue = true): Promise<boolean> {
  if (!isInteractive()) return defaultValue;

  const hint = defaultValue ? 'Y/n' : 'y/N';
  for (;;) {
    const answer = await askQuestion(`${chalk.green('?')} ${chalk.bold(message)} ${chalk.gray(`(${hint})`)} `);
    if (answer === '') return defaultValue;
    if (/^y(es)?$/i.test(answer)) return true;
    if (/^no?$/i.test(answer)) return false;
    console.log(chalk.red('  请输入 y 或 n！'));
  }
}
