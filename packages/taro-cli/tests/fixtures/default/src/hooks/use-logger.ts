import { useCallback, useState } from 'react';
import { formatTime, uid } from '@/lib/utils';

export type LogType = 'info' | 'success' | 'warn' | 'error';

export interface LogEntry {
  id: string;
  time: string;
  text: string;
  type: LogType;
}

export function useLogger(max = 50) {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const add = useCallback(
    (text: string, type: LogType = 'info') => {
      const entry: LogEntry = {
        id: uid(),
        time: formatTime(),
        text,
        type,
      };
      setLogs((prev) => [entry, ...prev.slice(0, max - 1)]);
    },
    [max],
  );

  const clear = useCallback(() => {
    setLogs([]);
  }, []);

  return { logs, add, clear };
}
