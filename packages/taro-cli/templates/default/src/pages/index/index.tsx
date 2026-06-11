import { View, Text } from '@spcsn/taro-components';
import { useLoad } from '@spcsn/taro';

import styles from './index.module.{{ cssExt }}';

export default function {{ to_pascal_case pageName }}() {
  useLoad(() => {
    console.log('Taro Lite page loaded.');
  });

  return (
    <View className={styles.container}>
      <View className={styles.hero}>
        <Text className={styles.kicker}>React 19 · WeApp · Skyline</Text>
        <Text className={styles.title}>Taro Lite</Text>
        <Text className={styles.description}>一个面向现代小程序底座的极简业务样板。</Text>
      </View>
    </View>
  );
}
