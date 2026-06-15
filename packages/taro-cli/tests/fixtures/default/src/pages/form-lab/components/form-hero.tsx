import { Text, View } from '@spcsn/taro-components';
import styles from '../index.module.css';

interface FormHeroProps {
  completion: number;
}

export function FormHero({ completion }: FormHeroProps) {
  return (
    <View className={styles.formHero}>
      <View>
        <Text className={styles.formEyebrow}>Profile Setup</Text>
        <Text className={styles.formTitle}>用户资料配置</Text>
        <Text className={styles.formDesc}>验证输入、选择、滑动、开关、长文本和错误态的组合表现。</Text>
      </View>
      <View className={styles.progressBox}>
        <Text className={styles.progressValue}>{completion}%</Text>
        <Text className={styles.progressLabel}>完成度</Text>
      </View>
    </View>
  );
}
