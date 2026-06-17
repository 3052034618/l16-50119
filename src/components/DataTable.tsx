import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  key: keyof T | string;
  title: string;
  width?: string;
  render?: (row: T, index: number) => ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: keyof T | ((row: T) => string);
  className?: string;
  emptyText?: string;
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number) => void;
  };
  onRowClick?: (row: T) => void;
  zebra?: boolean;
}

export function DataTable<T extends object>({
  columns,
  data,
  rowKey,
  className,
  emptyText = '暂无数据',
  loading,
  pagination,
  onRowClick,
  zebra = true,
}: DataTableProps<T>) {
  const getRowKey = (row: T, index: number): string => {
    if (typeof rowKey === 'function') return rowKey(row);
    const val = (row as Record<string, unknown>)[rowKey as string];
    return typeof val === 'string' || typeof val === 'number' ? String(val) : String(index);
  };

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1;
  const displayData = pagination
    ? data.slice(
        (pagination.current - 1) * pagination.pageSize,
        pagination.current * pagination.pageSize
      )
    : data;

  return (
    <div className={clsx('w-full overflow-hidden rounded-card border border-gray-100 bg-white', className)}>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="table-header"
                  style={{
                    width: col.width,
                    textAlign: col.align || 'left',
                  }}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="table-cell text-center py-12">
                  <div className="flex items-center justify-center gap-2 text-gray-400">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    加载中...
                  </div>
                </td>
              </tr>
            ) : displayData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="table-cell text-center py-12 text-gray-400">
                  {emptyText}
                </td>
              </tr>
            ) : (
              displayData.map((row, idx) => (
                <tr
                  key={getRowKey(row, idx)}
                  className={clsx(
                    'table-row',
                    zebra && idx % 2 === 1 && 'bg-gray-50/30',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((col) => {
                    const cellValue = col.key in row ? (row as Record<string, unknown>)[col.key as string] : undefined;
                    return (
                      <td
                        key={String(col.key)}
                        className="table-cell"
                        style={{ textAlign: col.align || 'left' }}
                      >
                        {col.render ? col.render(row, idx) : (cellValue as ReactNode)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.total > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
          <div className="text-sm text-gray-500">
            共 <span className="font-medium text-gray-700">{pagination.total}</span> 条，
            第 <span className="font-medium text-gray-700">{pagination.current}</span> / {totalPages} 页
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => pagination.onChange(pagination.current - 1)}
              disabled={pagination.current <= 1}
              className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (pagination.current <= 3) {
                page = i + 1;
              } else if (pagination.current >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = pagination.current - 2 + i;
              }
              return (
                <button
                  key={page}
                  onClick={() => pagination.onChange(page)}
                  className={clsx(
                    'inline-flex items-center justify-center h-8 min-w-[32px] px-2 rounded-md text-sm font-medium transition-colors',
                    pagination.current === page
                      ? 'bg-brand-700 text-white'
                      : 'border border-gray-200 text-gray-600 hover:bg-white'
                  )}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => pagination.onChange(pagination.current + 1)}
              disabled={pagination.current >= totalPages}
              className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
