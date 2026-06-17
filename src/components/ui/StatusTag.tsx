import { clsx } from 'clsx';
import type { BatchStatus, RecallLevel, RecallNotificationStatus, RecallStatus, ShipmentStatus } from '@/types';
import { AlertTriangle, CheckCircle, XCircle, Clock, Truck, Package, AlertCircle, Send, Download, ShieldOff, ShoppingCart } from 'lucide-react';

interface TagProps {
  className?: string;
  children: React.ReactNode;
}

export function Tag({ className, children }: TagProps) {
  return <span className={clsx('tag-base', className)}>{children}</span>;
}

type BatchStatusKey = BatchStatus;

const batchStatusConfig: Record<BatchStatusKey, { label: string; className: string; icon?: React.ComponentType<{ size?: number | string }> }> = {
  pending: {
    label: '待检验',
    className: 'bg-gray-100 text-gray-700',
    icon: Clock,
  },
  qualified: {
    label: '检验合格',
    className: 'bg-blue-50 text-blue-700',
    icon: CheckCircle,
  },
  unqualified: {
    label: '检验不合格',
    className: 'bg-red-50 text-alert-danger',
    icon: XCircle,
  },
  in_stock: {
    label: '在库',
    className: 'bg-brand-50 text-brand-700',
    icon: Package,
  },
  shipped: {
    label: '已发货',
    className: 'bg-amber-50 text-amber-700',
    icon: Truck,
  },
  recalling: {
    label: '召回中',
    className: 'bg-red-100 text-alert-danger',
    icon: AlertTriangle,
  },
};

export function BatchStatusTag({ status, size = 14 }: { status: BatchStatus; size?: number }) {
  const config = batchStatusConfig[status];
  const Icon = config.icon;
  return (
    <Tag className={clsx(config.className)}>
      {Icon && <Icon size={size} />}
      {config.label}
    </Tag>
  );
}

type ShipmentStatusKey = ShipmentStatus;

const shipmentStatusConfig: Record<ShipmentStatusKey, { label: string; className: string; icon: React.ComponentType<{ size?: number | string }> }> = {
  transit: {
    label: '运输中',
    className: 'bg-blue-50 text-blue-700',
    icon: Truck,
  },
  delivered: {
    label: '已送达',
    className: 'bg-brand-50 text-brand-700',
    icon: CheckCircle,
  },
};

export function ShipmentStatusTag({ status, size = 14 }: { status: ShipmentStatus; size?: number }) {
  const config = shipmentStatusConfig[status];
  const Icon = config.icon;
  return (
    <Tag className={clsx(config.className)}>
      <Icon size={size} />
      {config.label}
    </Tag>
  );
}

type RecallLevelKey = RecallLevel;

const recallLevelConfig: Record<RecallLevelKey, { label: string; className: string; icon: React.ComponentType<{ size?: number | string }> }> = {
  level1: {
    label: '一级(紧急)',
    className: 'bg-red-100 text-alert-danger',
    icon: AlertTriangle,
  },
  level2: {
    label: '二级(重要)',
    className: 'bg-orange-100 text-alert-warn',
    icon: AlertCircle,
  },
  level3: {
    label: '三级(一般)',
    className: 'bg-amber-50 text-amber-700',
    icon: AlertCircle,
  },
};

export function RecallLevelTag({ level, size = 14 }: { level: RecallLevel; size?: number }) {
  const config = recallLevelConfig[level];
  const Icon = config.icon;
  return (
    <Tag className={clsx(config.className)}>
      <Icon size={size} />
      {config.label}
    </Tag>
  );
}

type RecallStatusKey = RecallStatus;

const recallStatusConfig: Record<RecallStatusKey, { label: string; className: string; icon: React.ComponentType<{ size?: number | string }> }> = {
  pending: {
    label: '待处理',
    className: 'bg-gray-100 text-gray-700',
    icon: Clock,
  },
  notifying: {
    label: '通知发送中',
    className: 'bg-blue-50 text-blue-700',
    icon: Send,
  },
  in_progress: {
    label: '进行中',
    className: 'bg-orange-100 text-alert-warn',
    icon: AlertCircle,
  },
  completed: {
    label: '已完成',
    className: 'bg-brand-50 text-brand-700',
    icon: CheckCircle,
  },
};

export function RecallStatusTag({ status, size = 14 }: { status: RecallStatus; size?: number }) {
  const config = recallStatusConfig[status];
  const Icon = config.icon;
  return (
    <Tag className={clsx(config.className)}>
      <Icon size={size} />
      {config.label}
    </Tag>
  );
}

type NotificationStatusKey = RecallNotificationStatus;

const notificationStatusConfig: Record<NotificationStatusKey, { label: string; className: string; icon: React.ComponentType<{ size?: number | string }> }> = {
  pending: {
    label: '待发送',
    className: 'bg-gray-100 text-gray-700',
    icon: Clock,
  },
  sent: {
    label: '已发送',
    className: 'bg-blue-50 text-blue-700',
    icon: Send,
  },
  received: {
    label: '已收到',
    className: 'bg-indigo-50 text-indigo-700',
    icon: CheckCircle,
  },
  off_shelf: {
    label: '已下架',
    className: 'bg-amber-50 text-amber-700',
    icon: ShieldOff,
  },
  returned: {
    label: '已退回',
    className: 'bg-brand-50 text-brand-700',
    icon: Download,
  },
  urged: {
    label: '已催促',
    className: 'bg-red-50 text-alert-danger',
    icon: AlertTriangle,
  },
};

export function NotificationStatusTag({ status, size = 14 }: { status: RecallNotificationStatus; size?: number }) {
  const config = notificationStatusConfig[status];
  const Icon = config.icon;
  return (
    <Tag className={clsx(config.className)}>
      <Icon size={size} />
      {config.label}
    </Tag>
  );
}

export function InspectionResultTag({ result }: { result: 'pass' | 'fail' }) {
  if (result === 'pass') {
    return (
      <Tag className="bg-brand-50 text-brand-700">
        <CheckCircle size={14} />
        合格
      </Tag>
    );
  }
  return (
    <Tag className="bg-red-50 text-alert-danger">
      <XCircle size={14} />
      不合格
    </Tag>
  );
}
