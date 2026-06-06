import type { PropsWithChildren } from 'react';
import { View, Text } from '@spcsn/taro-components';
import { cn } from '@/lib/utils';
import styles from './ui.module.css';

export type DrawerSide = 'bottom' | 'right' | 'left' | 'top';

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: DrawerSide;
  className?: string;
  children: React.ReactNode;
}

export function Drawer({
  open,
  onOpenChange,
  side = 'bottom',
  className,
  children,
}: DrawerProps) {
  if (!open) return null;

  return (
    <View className={cn(styles.drawerPortal, className)}>
      <View className={styles.drawerOverlay} onClick={() => onOpenChange(false)} />
      <View className={cn(styles.drawerContent, styles[`drawerContent_${side}`])}>
        {children}
      </View>
    </View>
  );
}

interface DrawerHeaderProps {
  className?: string;
}

export function DrawerHeader({ children, className }: PropsWithChildren<DrawerHeaderProps>) {
  return (
    <View className={cn(styles.drawerHeader, className)}>
      {children}
    </View>
  );
}

interface DrawerTitleProps {
  className?: string;
}

export function DrawerTitle({ children, className }: PropsWithChildren<DrawerTitleProps>) {
  return (
    <Text className={cn(styles.drawerTitle, className)}>
      {children}
    </Text>
  );
}

interface DrawerDescriptionProps {
  className?: string;
}

export function DrawerDescription({ children, className }: PropsWithChildren<DrawerDescriptionProps>) {
  return (
    <Text className={cn(styles.drawerDescription, className)}>
      {children}
    </Text>
  );
}

interface DrawerFooterProps {
  className?: string;
}

export function DrawerFooter({ children, className }: PropsWithChildren<DrawerFooterProps>) {
  return (
    <View className={cn(styles.drawerFooter, className)}>
      {children}
    </View>
  );
}

interface DrawerCloseProps {
  className?: string;
  onClick?: () => void;
}

export function DrawerClose({ className, onClick }: DrawerCloseProps) {
  return (
    <View className={cn(styles.drawerClose, className)} onClick={onClick}>
      <Text className={styles.drawerCloseIcon}>✕</Text>
    </View>
  );
}
