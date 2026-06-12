import { View } from '@spcsn/taro-components';
import { cn } from '@/lib/utils';
import styles from './index.module.css';

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function Separator({ orientation = 'horizontal', className }: SeparatorProps) {
  return (
    <View
      className={cn(
        styles.separator,
        orientation === 'vertical' ? styles.separator_vertical : styles.separator_horizontal,
        className,
      )}
    />
  );
}
