import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface CardProps {
  className?: string;
  children: ReactNode;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses: Record<string, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({ className, children, hover, padding = 'md' }: CardProps) {
  return (
    <div
      className={clsx(
        'card-base',
        hover && 'card-hover',
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  className?: string;
  children: ReactNode;
  divider?: boolean;
}

export function CardHeader({ className, children, divider = false }: CardHeaderProps) {
  return (
    <div
      className={clsx(
        'flex items-center justify-between mb-0',
        divider && 'pb-4 border-b border-gray-100 mb-4',
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardTitleProps {
  className?: string;
  children: ReactNode;
  icon?: ReactNode;
}

export function CardTitle({ className, children, icon }: CardTitleProps) {
  return (
    <h3 className={clsx('font-serif text-lg font-semibold text-gray-800 flex items-center gap-2', className)}>
      {icon && <span className="text-brand-700">{icon}</span>}
      {children}
    </h3>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx('', className)}>{children}</div>;
}

export function CardFooter({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={clsx(
        'flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-4',
        className
      )}
    >
      {children}
    </div>
  );
}

export default Card;
