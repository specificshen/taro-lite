import { Input as TaroInput } from '@spcsn/taro-components';
import { cn } from '@/lib/utils';
import styles from './index.module.css';

interface InputProps {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  type?: 'text' | 'number' | 'idcard' | 'digit';
  password?: boolean;
  onInput?: (value: string) => void;
}

export function Input({ value, placeholder, disabled, className, type = 'text', password, onInput }: InputProps) {
  return (
    <TaroInput
      className={cn(styles.input, disabled && styles.input_disabled, className)}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      type={type}
      password={password}
      onInput={(event: any) => onInput?.(event.detail.value)}
    />
  );
}
