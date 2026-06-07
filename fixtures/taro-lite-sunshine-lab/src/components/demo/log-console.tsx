import { View, Text } from '@spcsn/taro-components';
import type { LogEntry } from '@/hooks/use-logger';
import styles from './demo.module.css';

interface LogConsoleProps {
  logs: LogEntry[];
  onClear: () => void;
}

export function LogConsole({ logs, onClear }: LogConsoleProps) {
  return (
    <View className={styles.logSection}>
      <View className={styles.logHeader}>
        <Text className={styles.logTitle}>运行日志台</Text>
        <Text className={styles.logClear} onClick={onClear}>
          清空
        </Text>
      </View>

      <View className={styles.logConsole}>
        {logs.length === 0 ? (
          <View className={styles.logLineEmpty}>
            <Text className={styles.logMessageEmpty}>暂无日志，操作页面控件后将输出调试信息</Text>
          </View>
        ) : (
          logs.map((log) => (
            <View className={styles.logLine} key={log.id}>
              <Text className={styles.logTime}>[{log.time}]</Text>
              <Text className={`${styles.logMessage} ${styles[`logType_${log.type}`]}`}>{log.text}</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}
