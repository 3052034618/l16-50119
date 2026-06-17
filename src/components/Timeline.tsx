import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  time?: string;
  status?: 'completed' | 'current' | 'pending';
  icon?: ReactNode;
  color?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

interface TimelineProps {
  items: TimelineItem[];
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

const colorClasses = {
  default: {
    dot: 'bg-gray-400',
    line: 'bg-gray-200',
    border: 'border-gray-300',
    text: 'text-gray-500',
  },
  success: {
    dot: 'bg-brand-600',
    line: 'bg-brand-300',
    border: 'border-brand-500',
    text: 'text-brand-700',
  },
  warning: {
    dot: 'bg-alert-warn',
    line: 'bg-orange-300',
    border: 'border-alert-warn',
    text: 'text-alert-warn',
  },
  danger: {
    dot: 'bg-alert-danger',
    line: 'bg-red-300',
    border: 'border-alert-danger',
    text: 'text-alert-danger',
  },
  info: {
    dot: 'bg-alert-info',
    line: 'bg-blue-300',
    border: 'border-alert-info',
    text: 'text-alert-info',
  },
};

export function Timeline({ items, orientation = 'vertical', className }: TimelineProps) {
  if (orientation === 'horizontal') {
    return (
      <div className={clsx('flex items-start justify-between w-full', className)}>
        {items.map((item, idx) => {
          const color = item.color || (item.status === 'completed' ? 'success' : item.status === 'current' ? 'info' : 'default');
          const colors = colorClasses[color];
          const isLast = idx === items.length - 1;

          return (
            <div key={item.id} className="flex-1 flex flex-col items-center relative">
              {!isLast && (
                <div
                  className={clsx(
                    'absolute top-4 left-1/2 w-full h-0.5 -translate-y-1/2',
                    idx < items.findIndex((i) => i.status === 'pending' || i.status === 'current')
                      ? colors.line
                      : 'bg-gray-200'
                  )}
                />
              )}
              <div
                className={clsx(
                  'relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white',
                  colors.border
                )}
              >
                {item.status === 'completed' ? (
                  <CheckCircle2 size={18} className={clsx(colors.text)} />
                ) : item.icon ? (
                  <span className={clsx('text-sm', colors.text)}>{item.icon}</span>
                ) : (
                  <Circle size={10} className={clsx(colors.dot, 'fill-current')} />
                )}
              </div>
              <div className="mt-3 text-center px-2 max-w-[140px]">
                <p className="text-sm font-medium text-gray-800">{item.title}</p>
                {item.description && <p className="mt-1 text-xs text-gray-500">{item.description}</p>}
                {item.time && <p className="mt-1 text-xs text-gray-400">{item.time}</p>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={clsx('relative', className)}>
      <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-200" />
      <div className="space-y-6">
        {items.map((item) => {
          const color = item.color || (item.status === 'completed' ? 'success' : item.status === 'current' ? 'info' : 'default');
          const colors = colorClasses[color];

          return (
            <div key={item.id} className="relative flex gap-4 pl-1">
              <div
                className={clsx(
                  'relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white flex-shrink-0',
                  colors.border
                )}
              >
                {item.status === 'completed' ? (
                  <CheckCircle2 size={18} className={clsx(colors.text)} />
                ) : item.icon ? (
                  <span className={clsx('text-sm', colors.text)}>{item.icon}</span>
                ) : (
                  <Circle size={10} className={clsx(colors.dot, 'fill-current')} />
                )}
              </div>
              <div className="flex-1 pt-0.5 pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={clsx('text-sm font-semibold', item.status === 'pending' ? 'text-gray-500' : 'text-gray-800')}>
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="mt-1 text-sm text-gray-600 leading-relaxed">{item.description}</p>
                    )}
                  </div>
                  {item.time && (
                    <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">{item.time}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Timeline;
