import { View, Text } from '@spcsn/taro-components';
import styles from '../index.module.css';

interface FormStatusGridProps {
  invalidCount: number;
  channelCount: number;
  budget: number;
}

export function FormStatusGrid({ invalidCount, channelCount, budget }: FormStatusGridProps) {
  return (
    <View className={styles.statusGrid}>
      <View className={styles.statusCard}>
        <Text className={styles.statusValue}>{invalidCount}</Text>
        <Text className={styles.statusLabel}>待修正</Text>
      </View>
      <View className={styles.statusCard}>
        <Text className={styles.statusValue}>{channelCount}</Text>
        <Text className={styles.statusLabel}>通知渠道</Text>
      </View>
      <View className={styles.statusCard}>
        <Text className={styles.statusValue}>{budget}h</Text>
        <Text className={styles.statusLabel}>验收预算</Text>
      </View>
    </View>
  );
}
