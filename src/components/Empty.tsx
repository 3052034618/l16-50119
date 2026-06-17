import { cn } from '@/lib/utils';
import { Package } from 'lucide-react';

interface EmptyProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

export default function Empty({
  title = '暂无数据',
  description = '还没有相关记录，点击上方按钮开始创建',
  icon,
  className,
}: EmptyProps) {
  return (
    <div className={cn('flex h-full items-center justify-center py-16', className)}>
      <div className="text-center">
        <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-5">
          {icon || <Package size={40} className="text-gray-300" />}
        </div>
        <h3 className="text-base font-semibold text-gray-700 mb-2">{title}</h3>
        <p className="text-sm text-gray-400 max-w-sm mx-auto">{description}</p>
      </div>
    </div>
  );
}
