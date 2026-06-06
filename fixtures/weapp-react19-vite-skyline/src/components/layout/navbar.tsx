import { View, Text } from '@spcsn/taro-components';
import Taro from '@spcsn/taro';
import { useSafeArea } from '@/hooks/use-safe-area';
import styles from './layout.module.css';

interface NavbarProps {
  title: string;
  showBack?: boolean;
}

export function Navbar({ title, showBack = false }: NavbarProps) {
  const { statusBarHeight, navBarHeight } = useSafeArea();

  const handleBack = () => {
    try {
      Taro.navigateBack({ delta: 1 });
    } catch {
      // ignore
    }
  };

  return (
    <View
      className={styles.navbar}
      style={{
        paddingTop: `${statusBarHeight}px`,
        height: `${navBarHeight}px`,
      }}
    >
      <View className={styles.navbarInner}>
        {showBack && (
          <View className={styles.backButton} onClick={handleBack}>
            <Text className={styles.backIcon}>←</Text>
            <Text className={styles.backText}>返回</Text>
          </View>
        )}
        <Text className={styles.navbarTitle}>{title}</Text>
      </View>
    </View>
  );
}
