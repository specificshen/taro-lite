import { ScrollView, View } from '@spcsn/taro-components';
import { useCanGoBack } from '@/hooks/use-can-go-back';
import { useSafeArea } from '@/hooks/use-safe-area';
import styles from './layout.module.css';
import { Navbar } from './navbar';

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
