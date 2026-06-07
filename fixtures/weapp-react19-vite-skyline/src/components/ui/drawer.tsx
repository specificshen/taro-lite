import { useState, useEffect } from 'react';
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
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setClosing(false);
    } else if (visible) {
      setClosing(true);
    }
  }, [open]);

  const handleAnimationEnd = () => {
    if (closing) {
      setClosing(false);
      setVisible(false);
      onOpenChange(false);
    }
  };

  const handleOverlayClick = () => {
    setClosing(true);
  };

  if (!visible) return null;

  return (
    <View
      className={cn(styles.drawerPortal, closing && styles.drawerClosing, className)}
      onAnimationEnd={handleAnimationEnd}
    >
      <View className={styles.drawerOverlay} onClick={handleOverlayClick} />
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
