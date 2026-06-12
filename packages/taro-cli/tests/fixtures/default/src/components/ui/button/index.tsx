import type { ReactNode } from 'react';
import { Button as TaroButton } from '@spcsn/taro-components';
import { cn } from '@/lib/utils';
import styles from './index.module.css';

export type ButtonVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
}

export function Button({
  variant = 'default',
  size = 'default',
  disabled = false,
  className,
  onClick,
  children,
}: ButtonProps) {
  return (
    <TaroButton
      className={cn(
        styles.btn,
        styles[`btn_${variant}`],
        styles[`btn_size_${size}`],
        disabled && styles.btn_disabled,
        className,
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </TaroButton>
  );
}
