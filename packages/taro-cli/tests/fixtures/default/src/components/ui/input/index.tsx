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

interface InputValueEvent {
  detail?: {
    value?: string;
  };
  target?: unknown;
  currentTarget?: unknown;
}

function getNodeValue(node: unknown) {
  if (node && typeof node === 'object' && 'value' in node) {
    const value = node.value;
    return typeof value === 'string' ? value : undefined;
  }
}

function getInputValue(event: InputValueEvent | string) {
  if (typeof event === 'string') {
    return event;
  }

  return event.detail?.value ?? getNodeValue(event.target) ?? getNodeValue(event.currentTarget) ?? '';
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
      onInput={(event: InputValueEvent | string) => onInput?.(getInputValue(event))}
    />
  );
}
