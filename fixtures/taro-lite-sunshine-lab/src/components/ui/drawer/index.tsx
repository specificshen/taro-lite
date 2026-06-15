import { Text, View } from '@spcsn/taro-components';
import type { CSSProperties, PropsWithChildren, ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSafeArea } from '@/hooks/use-safe-area';
import { cn } from '@/lib/utils';
import styles from './index.module.css';

export type DrawerSide = 'bottom' | 'right' | 'left' | 'top';

const DRAWER_EXIT_MS = 320;
const DRAWER_ENTER_DELAY_MS = 20;

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: DrawerSide;
  className?: string;
  children: ReactNode;
}

export function Drawer({ open, onOpenChange, side = 'bottom', className, children }: DrawerProps) {
  const { statusBarHeight, navBarHeight } = useSafeArea();
  const [visible, setVisible] = useState(open);
  const [active, setActive] = useState(open);
  const [closing, setClosing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const portalStyle: CSSProperties = { top: `${statusBarHeight + navBarHeight}px` };

  const clearTimer = useCallback(() => {
    if (!timerRef.current) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const beginEnter = useCallback(() => {
    clearTimer();
    setVisible(true);
    setClosing(false);
    setActive(false);

    timerRef.current = setTimeout(() => {
      setActive(true);
      timerRef.current = null;
    }, DRAWER_ENTER_DELAY_MS);
  }, [clearTimer]);

  const beginExit = useCallback(() => {
    if (!visible) return;

    clearTimer();
    setClosing(true);
    setActive(false);
    timerRef.current = setTimeout(() => {
      setClosing(false);
      setVisible(false);
      timerRef.current = null;
    }, DRAWER_EXIT_MS);
  }, [clearTimer, visible]);

  const requestClose = useCallback(() => {
    if (closing) return;
    beginExit();
    onOpenChange(false);
  }, [beginExit, closing, onOpenChange]);

  useEffect(() => {
    if (open) {
      beginEnter();
      return;
    }

    beginExit();
  }, [beginEnter, beginExit, open]);

  useEffect(() => clearTimer, [clearTimer]);

  if (!visible) return null;

  return (
    <View
      className={cn(styles.drawerPortal, active && styles.drawerOpen, closing && styles.drawerClosing, className)}
      style={portalStyle}
    >
      <View className={styles.drawerOverlay} onClick={requestClose} />
      <View className={cn(styles.drawerContent, styles[`drawerContent_${side}`])}>{children}</View>
    </View>
  );
}

interface DrawerHeaderProps {
  className?: string;
}

export function DrawerHeader({ children, className }: PropsWithChildren<DrawerHeaderProps>) {
  return <View className={cn(styles.drawerHeader, className)}>{children}</View>;
}

interface DrawerTitleProps {
  className?: string;
}

export function DrawerTitle({ children, className }: PropsWithChildren<DrawerTitleProps>) {
  return <Text className={cn(styles.drawerTitle, className)}>{children}</Text>;
}

interface DrawerDescriptionProps {
  className?: string;
}

export function DrawerDescription({ children, className }: PropsWithChildren<DrawerDescriptionProps>) {
  return <Text className={cn(styles.drawerDescription, className)}>{children}</Text>;
}

interface DrawerFooterProps {
  className?: string;
}

export function DrawerFooter({ children, className }: PropsWithChildren<DrawerFooterProps>) {
  return <View className={cn(styles.drawerFooter, className)}>{children}</View>;
}

interface DrawerCloseProps {
  className?: string;
  onClick?: () => void;
}

export function DrawerClose({ className, onClick }: DrawerCloseProps) {
  return (
    <View className={cn(styles.drawerClose, className)} onClick={onClick}>
      <Text className={styles.drawerCloseIcon}>x</Text>
    </View>
  );
}
