import { Text, View } from '@spcsn/taro-components';
import type { PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';
import styles from './index.module.css';

interface CardProps {
  className?: string;
}

export function Card({ children, className }: PropsWithChildren<CardProps>) {
  return <View className={cn(styles.card, className)}>{children}</View>;
}

interface CardHeaderProps {
  className?: string;
}

export function CardHeader({ children, className }: PropsWithChildren<CardHeaderProps>) {
  return <View className={cn(styles.cardHeader, className)}>{children}</View>;
}

interface CardTitleProps {
  className?: string;
}

export function CardTitle({ children, className }: PropsWithChildren<CardTitleProps>) {
  return <Text className={cn(styles.cardTitle, className)}>{children}</Text>;
}

interface CardDescriptionProps {
  className?: string;
}

export function CardDescription({ children, className }: PropsWithChildren<CardDescriptionProps>) {
  return <Text className={cn(styles.cardDescription, className)}>{children}</Text>;
}

interface CardContentProps {
  className?: string;
}

export function CardContent({ children, className }: PropsWithChildren<CardContentProps>) {
  return <View className={cn(styles.cardContent, className)}>{children}</View>;
}

interface CardFooterProps {
  className?: string;
}

export function CardFooter({ children, className }: PropsWithChildren<CardFooterProps>) {
  return <View className={cn(styles.cardFooter, className)}>{children}</View>;
}
