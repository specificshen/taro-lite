type ProfileEntry = {
  name: string;
  durationMs: number;
};

function isProfileEnabled(): boolean {
  const rawValue = process.env.TARO_PROFILE;
  if (!rawValue) return false;

  return !['0', 'false', 'off', 'no'].includes(rawValue.toLowerCase());
}

function nowMs(): number {
  return Number(process.hrtime.bigint()) / 1_000_000;
}

function formatDuration(durationMs: number): string {
  return `${durationMs.toFixed(1)}ms`;
}

class CliProfiler {
  private readonly enabled = isProfileEnabled();
  private entries: ProfileEntry[] = [];

  start(): number {
    return this.enabled ? nowMs() : 0;
  }

  end(name: string, startMs: number): void {
    if (!this.enabled) return;

    this.entries.push({
      name,
      durationMs: nowMs() - startMs,
    });
  }

  async measure<T>(name: string, task: () => Promise<T>): Promise<T> {
    const startMs = this.start();
    try {
      return await task();
    } finally {
      this.end(name, startMs);
    }
  }

  print(): void {
    if (!this.enabled || this.entries.length === 0) return;

    const nameWidth = Math.max(...this.entries.map((entry) => entry.name.length));
    const lines = this.entries.map((entry) => {
      return `  ${entry.name.padEnd(nameWidth)}  ${formatDuration(entry.durationMs)}`;
    });

    console.info(['[taro:profile] cli timings', ...lines].join('\n'));
    this.entries = [];
  }
}

export const cliProfiler = new CliProfiler();
