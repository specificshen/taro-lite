import type { ReactNode } from 'react';
import { View, Text } from '@spcsn/taro-components';
import { cn } from '@/lib/utils';
import styles from './index.module.css';

interface AvatarProps {
  className?: string;
  children: ReactNode;
}

export function Avatar({ className, children }: AvatarProps) {
  return <View className={cn(styles.avatar, className)}>{children}</View>;
}

interface AvatarFallbackProps {
  className?: string;
  children: ReactNode;
}

export function AvatarFallback({ className, children }: AvatarFallbackProps) {
  return (
    <View className={cn(styles.avatarFallback, className)}>
      <Text className={styles.avatarFallbackText}>{children}</Text>
    </View>
  );
}

interface AvatarImageProps {
  src: string;
  className?: string;
}

export function AvatarImage({ src, className }: AvatarImageProps) {
  return <View className={cn(styles.avatarImage, className)} style={{ backgroundImage: `url(${src})` }} />;
}
