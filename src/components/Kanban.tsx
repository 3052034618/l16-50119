import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import type { RecallNotification } from '@/types/recall';
import { NotificationStatusTag } from './ui/StatusTag';
import { formatDateTime } from '@/utils/date';
import { Building2, Store } from 'lucide-react';

export interface KanbanColumn {
  key: RecallNotification['status'] | 'all' | string;
  title: string;
  count?: number;
  color: string;
  bgColor: string;
  items: RecallNotification[];
}

interface KanbanProps {
  columns: KanbanColumn[];
  onItemClick?: (item: RecallNotification) => void;
  renderItemActions?: (item: RecallNotification) => ReactNode;
  renderItemBadge?: (item: RecallNotification) => ReactNode;
}

export function Kanban({ columns, onItemClick, renderItemActions, renderItemBadge }: KanbanProps) {
  const cols = columns.length;
  const gridClass = cols <= 4
    ? 'lg:grid-cols-4'
    : cols <= 5
    ? 'lg:grid-cols-5'
    : 'lg:grid-cols-6';

  return (
    <div className={clsx('grid grid-cols-1 md:grid-cols-2 gap-4 h-full', gridClass)}>
      {columns.map((column) => (
        <div
          key={column.key}
          className="flex flex-col rounded-card bg-gray-50/80 border border-gray-100 min-h-[400px]"
        >
          <div
            className={clsx(
              'flex items-center justify-between px-4 py-3 rounded-t-card border-b-2',
              column.bgColor
            )}
          >
            <div className="flex items-center gap-2">
              <span className={clsx('w-2 h-2 rounded-full', column.color)} />
              <h4 className="font-semibold text-sm text-gray-700">{column.title}</h4>
            </div>
            <span
              className={clsx(
                'inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-medium',
                column.bgColor,
                column.color.replace('bg-', 'text-').replace('-500', '-700')
              )}
            >
              {column.count ?? column.items.length}
            </span>
          </div>

          <div className="flex-1 p-3 space-y-3 overflow-y-auto scrollbar-thin max-h-[calc(100vh-340px)]">
            {column.items.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
                暂无数据
              </div>
            ) : (
              column.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onItemClick?.(item)}
                  className={clsx(
                    'p-4 rounded-lg bg-white shadow-card border border-gray-100 cursor-pointer relative',
                    'transition-all duration-200 hover:shadow-hover hover:-translate-y-0.5'
                  )}
                >
                  {renderItemBadge && renderItemBadge(item)}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {item.recipientType === 'dealer' ? (
                        <Building2 size={14} className="text-brand-600 flex-shrink-0" />
                      ) : (
                        <Store size={14} className="text-blue-600 flex-shrink-0" />
                      )}
                      <span className="font-medium text-sm text-gray-800 truncate">
                        {item.recipientName}
                      </span>
                    </div>
                    <NotificationStatusTag status={item.status} size={12} />
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>类型</span>
                      <span className="text-gray-600">
                        {item.recipientType === 'dealer' ? '经销商' : '门店'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>数量</span>
                      <span className="text-gray-600 font-medium">{item.quantity.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>联系人</span>
                      <span className="text-gray-600 truncate max-w-[140px]">{item.contact}</span>
                    </div>
                    {item.sentAt && (
                      <div className="flex justify-between">
                        <span>发送时间</span>
                        <span className="text-gray-600">{formatDateTime(item.sentAt, 'MM-DD HH:mm')}</span>
                      </div>
                    )}
                    {item.respondedAt && (
                      <div className="flex justify-between">
                        <span>响应时间</span>
                        <span className="text-gray-600">{formatDateTime(item.respondedAt, 'MM-DD HH:mm')}</span>
                      </div>
                    )}
                  </div>

                  {renderItemActions && (
                    <div className="mt-3 pt-3 border-t border-gray-100">{renderItemActions(item)}</div>
                  )}

                  {item.remark && (
                    <div className="mt-2 p-2 bg-brand-50/50 rounded text-xs text-brand-700">
                      {item.remark}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default Kanban;
