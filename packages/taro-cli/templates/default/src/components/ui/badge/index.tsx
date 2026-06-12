import type { ReactNode } from 'react';
import { Text } from '@spcsn/taro-components';
import { cn } from '@/lib/utils';
import styles from './index.module.css';

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}

export function Badge({ variant = 'default', className, children }: BadgeProps) {
  return <Text className={cn(styles.badge, styles[`badge_${variant}`], className)}>{children}</Text>;
}
