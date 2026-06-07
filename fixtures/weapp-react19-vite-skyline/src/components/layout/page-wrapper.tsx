import { View, ScrollView } from '@spcsn/taro-components';
import { useSafeArea } from '@/hooks/use-safe-area';
import { useCanGoBack } from '@/hooks/use-can-go-back';
import { Navbar } from './navbar';
import styles from './layout.module.css';

interface PageWrapperProps {
  title: string;
  showBack?: boolean;
  children: React.ReactNode;
}

export function PageWrapper({ title, showBack, children }: PageWrapperProps) {
  const { statusBarHeight, navBarHeight } = useSafeArea();
  const canGoBack = useCanGoBack();
  const topOffset = statusBarHeight + navBarHeight;

  // If showBack is explicitly provided, use it; otherwise auto-detect from page stack
  const shouldShowBack = showBack !== undefined ? showBack : canGoBack;

  return (
    <View className={styles.pageWrapper}>
      <Navbar title={title} showBack={shouldShowBack} />
      <ScrollView className={styles.pageScroll} scrollY style={{ top: `${topOffset}px` }}>
        {children}
      </ScrollView>
    </View>
  );
}
