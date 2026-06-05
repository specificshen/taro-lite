import { View, Text } from '@spcsn/taro-components';
import styles from './index.module.css';

function Index() {
  return (
    <View className={styles.container}>
      <Text className={styles.title}>SPCSN Taro Lite</Text>
      <Text className={styles.description}>React 19 + Vite + WeApp + Skyline / glass-easel fixture</Text>
    </View>
  );
}

export default Index;
