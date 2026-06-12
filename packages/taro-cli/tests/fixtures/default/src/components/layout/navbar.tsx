import { View, Text } from '@spcsn/taro-components';
import Taro from '@spcsn/taro';
import { useSafeArea } from '@/hooks/use-safe-area';
import { SvgIcon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import styles from './layout.module.css';

interface NavbarProps {
  title: string;
  showBack?: boolean;
}

export function Navbar({ title, showBack = false }: NavbarProps) {
  const { statusBarHeight, navBarHeight } = useSafeArea();
  const totalHeight = statusBarHeight + navBarHeight;

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
        height: `${totalHeight}px`,
        paddingTop: `${statusBarHeight}px`,
      }}
    >
      <View className={styles.navbarInner} style={{ height: `${navBarHeight}px` }}>
        {showBack && (
          <View className={styles.backButton} onClick={handleBack}>
            <SvgIcon name="arrow-left" size={20} className={styles.backIcon} />
            <Text className={styles.backText}>返回</Text>
          </View>
        )}
        <Text className={cn(styles.navbarTitle, showBack && styles.navbarTitleWithBack)}>{title}</Text>
      </View>
    </View>
  );
}
