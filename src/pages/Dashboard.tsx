import { useEffect, useMemo } from 'react';
import {
  Package,
  Warehouse,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Bell,
  TrendingUp,
  CalendarClock,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { RingProgress } from '@/components/RingProgress';
import { BatchStatusTag } from '@/components/ui/StatusTag';
import { useBatchStore } from '@/store/batchStore';
import { useShipmentStore } from '@/store/shipmentStore';
import { useRecallStore } from '@/store/recallStore';
import type { Batch, RecallNotification } from '@/types';
import { formatDate, isExpiringSoon, daysUntilExpiry } from '@/utils/date';
import dayjs from '@/utils/date';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  gradient: string;
  subtitle?: string;
  trend?: string;
}

function StatCard({ title, value, icon, gradient, subtitle, trend }: StatCardProps) {
  return (
    <div className={`${gradient} rounded-card p-5 text-white shadow-card relative overflow-hidden`}>
      <div className="absolute right-0 top-0 opacity-10">
        <div className="transform translate-x-4 -translate-y-4 scale-150">{icon}</div>
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
            {icon}
          </div>
          {trend && (
            <div className="flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
              <TrendingUp size={12} />
              {trend}
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-white/80 text-sm">{title}</p>
          <p className="text-3xl font-serif font-bold mt-1">{value}</p>
          {subtitle && <p className="text-white/70 text-xs mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

interface AlertItemProps {
  type: 'expiry' | 'unqualified' | 'unresponded';
  title: string;
  desc: string;
  time?: string;
  batchId?: string;
  onClick?: () => void;
}

function AlertItem({ type, title, desc, time }: AlertItemProps) {
  const config = {
    expiry: {
      color: 'warn',
      icon: <CalendarClock size={16} />,
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-alert-warn',
    },
    unqualified: {
      color: 'danger',
      icon: <XCircle size={16} />,
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-alert-danger',
    },
    unresponded: {
      color: 'info',
      icon: <Clock size={16} />,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-alert-info',
    },
  };
  const c = config[type];

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg ${c.bg} border ${c.border} transition-colors hover:shadow-sm`}>
      <div className={`w-7 h-7 rounded-full bg-white flex items-center justify-center ${c.text} flex-shrink-0`}>
        {c.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{desc}</p>
      </div>
      {time && (
        <span className="text-xs text-gray-400 flex-shrink-0">{time}</span>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { batches, initBatches } = useBatchStore();
  const { shipments, initShipments } = useShipmentStore();
  const { recalls, initRecalls, getRecallStats } = useRecallStore();

  useEffect(() => {
    initBatches();
    initShipments();
    initRecalls();
  }, [initBatches, initShipments, initRecalls]);

  const stats = useMemo(() => {
    const total = batches.length;
    const inStock = batches.filter((b) => b.status === 'in_stock' || b.remainingQty > 0).length;
    const shipped = shipments.length;
    const recalling = batches.filter((b) => b.status === 'recalling').length;

    let avgCompletionRate = 0;
    if (recalls.length > 0) {
      const rates = recalls.map((r) => getRecallStats(r.id).completionRate);
      avgCompletionRate = rates.reduce((a, b) => a + b, 0) / rates.length;
    }

    return { total, inStock, shipped, recalling, avgCompletionRate };
  }, [batches, shipments, recalls, getRecallStats]);

  const chartData = useMemo(() => {
    const result: Array<{ date: string; count: number; label: string }> = [];
    const today = dayjs();
    for (let i = 29; i >= 0; i--) {
      const d = today.subtract(i, 'day');
      const dateStr = d.format('YYYY-MM-DD');
      const label = d.format('MM/DD');
      const count = batches.filter((b) => b.createdAt.startsWith(dateStr)).length;
      result.push({ date: dateStr, count, label });
    }
    return result;
  }, [batches]);

  const expiringBatches = useMemo(() => {
    return batches
      .filter((b) => isExpiringSoon(b.expiryDate, 30) && b.status !== 'recalling')
      .sort((a, b) => daysUntilExpiry(a.expiryDate) - daysUntilExpiry(b.expiryDate))
      .slice(0, 5);
  }, [batches]);

  const unqualifiedBatches = useMemo(() => {
    return batches.filter((b) => b.status === 'unqualified').slice(0, 5);
  }, [batches]);

  const unrespondedRecalls = useMemo(() => {
    const list: Array<{ notif: RecallNotification; recallNo: string; productName: string }> = [];
    recalls.forEach((r) => {
      r.notifications.forEach((n) => {
        if (n.status === 'sent' || n.status === 'urged' || n.status === 'pending') {
          list.push({ notif: n, recallNo: r.recallNo, productName: r.productName });
        }
      });
    });
    return list.slice(0, 5);
  }, [recalls]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">数据总览</h1>
          <p className="page-subtitle">食品批次溯源与召回管理系统 · 实时监控仪表盘</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <CalendarClock size={16} className="text-brand-600" />
          <span>数据更新时间：{formatDate(new Date(), 'YYYY-MM-DD HH:mm')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-6">
        <StatCard
          title="批次总数"
          value={stats.total}
          icon={<Package size={20} />}
          gradient="stat-gradient"
          subtitle={`累计录入 ${stats.total} 个生产批次`}
        />
        <StatCard
          title="在库量"
          value={stats.inStock}
          icon={<Warehouse size={20} />}
          gradient="info-gradient"
          subtitle="当前在库批次数量"
        />
        <StatCard
          title="已发货"
          value={stats.shipped}
          icon={<Truck size={20} />}
          gradient="warn-gradient"
          subtitle="已发往经销商/门店"
        />
        <StatCard
          title="召回中"
          value={stats.recalling}
          icon={<AlertTriangle size={20} />}
          gradient="danger-gradient"
          subtitle="正在执行召回的批次"
        />
        <div className="rounded-card p-5 bg-white border border-brand-50 shadow-card flex flex-col items-center justify-center">
          <RingProgress
            value={stats.avgCompletionRate}
            size={110}
            strokeWidth={10}
            label="召回完成率"
            subLabel={`${recalls.length} 个召回任务`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader divider>
              <CardTitle icon={<TrendingUp size={20} />}>近30天批次入库趋势</CardTitle>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-brand-600"></div>
                  <span className="text-gray-600">入库批次</span>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8F5E9" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#9CA3AF' }}
                      tickLine={false}
                      axisLine={{ stroke: '#E5E7EB' }}
                      interval={Math.floor(chartData.length / 7)}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#9CA3AF' }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E8F5E9',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(27,94,32,0.1)',
                        fontSize: 12,
                      }}
                      formatter={(value: number) => [`${value} 个批次`, '入库数量']}
                      labelFormatter={(label) => `日期：${label}`}
                      cursor={{ fill: '#E8F5E9', opacity: 0.5 }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={32}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.count > 0 ? '#2E7D32' : '#C8E6C9'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader divider>
              <CardTitle icon={<Bell size={20} />}>预警通知</CardTitle>
              <span className="text-xs text-alert-danger bg-red-50 px-2 py-0.5 rounded-full">
                {expiringBatches.length + unqualifiedBatches.length + unrespondedRecalls.length} 条
              </span>
            </CardHeader>
            <CardBody>
              <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin pr-1">
                {expiringBatches.length === 0 && unqualifiedBatches.length === 0 && unrespondedRecalls.length === 0 ? (
                  <div className="empty-state">
                    <CheckCircle2 size={40} className="text-brand-500 mb-2" />
                    <p className="text-sm text-gray-500">暂无预警信息</p>
                  </div>
                ) : (
                  <>
                    {expiringBatches.map((b: Batch) => (
                      <AlertItem
                        key={b.id}
                        type="expiry"
                        title={`临期预警 · ${b.productName}`}
                        desc={`批次号：${b.batchNo} · 剩余 ${daysUntilExpiry(b.expiryDate)} 天过期`}
                        time={formatDate(b.expiryDate, 'MM/DD')}
                      />
                    ))}
                    {unqualifiedBatches.map((b: Batch) => (
                      <AlertItem
                        key={b.id}
                        type="unqualified"
                        title={`检验不合格 · ${b.productName}`}
                        desc={`批次号：${b.batchNo} · 数量 ${b.quantity}`}
                        time={formatDate(b.inspection.inspectedAt, 'MM/DD')}
                      />
                    ))}
                    {unrespondedRecalls.map(({ notif, recallNo, productName }) => (
                      <AlertItem
                        key={notif.id}
                        type="unresponded"
                        title={`召回未响应 · ${notif.recipientName}`}
                        desc={`${recallNo} · ${productName} · 涉及 ${notif.quantity} 件`}
                        time={notif.sentAt ? formatDate(notif.sentAt, 'MM/DD HH:mm') : '待发送'}
                      />
                    ))}
                  </>
                )}
              </div>

              {unqualifiedBatches.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-3 font-medium">检验不合格批次</p>
                  <div className="space-y-2">
                    {unqualifiedBatches.slice(0, 3).map((b: Batch) => (
                      <div key={b.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <BatchStatusTag status={b.status} size={12} />
                          <span className="text-gray-700 truncate">{b.batchNo}</span>
                        </div>
                        <span className="text-gray-500 text-xs flex-shrink-0 ml-2">
                          {b.quantity}件
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
