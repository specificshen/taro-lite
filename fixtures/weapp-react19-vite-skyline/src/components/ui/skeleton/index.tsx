import { View } from '@spcsn/taro-components';
import { cn } from '@/lib/utils';
import styles from './index.module.css';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <View className={cn(styles.skeleton, className)} />;
}
