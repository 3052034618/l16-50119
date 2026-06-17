import { useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Package,
  Factory,
  ClipboardCheck,
  Calendar,
  User,
  Hash,
  FileText,
  MapPin,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Store,
  Building2,
  Navigation,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BatchStatusTag, ShipmentStatusTag, InspectionResultTag } from '@/components/ui/StatusTag';
import { QrCodeDisplay } from '@/components/QrCode';
import { Timeline, type TimelineItem } from '@/components/Timeline';
import { useBatchStore } from '@/store/batchStore';
import { useShipmentStore } from '@/store/shipmentStore';
import { useRecallStore } from '@/store/recallStore';
import { formatDate, formatDateTime, daysUntilExpiry, isExpiringSoon, isExpired } from '@/utils/date';
import type { Batch, Shipment } from '@/types';

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}

function InfoRow({ icon, label, value, accent }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          accent ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-500'
        }`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <div className="text-sm text-gray-800">{value}</div>
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  count,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number | string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-700">
        {icon}
      </div>
      <h3 className="font-serif text-base font-semibold text-gray-800">{title}</h3>
      {count !== undefined && (
        <span className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full font-medium">
          {count}
        </span>
      )}
    </div>
  );
}

export default function BatchDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getBatch, initBatches } = useBatchStore();
  const { getShipmentsByBatch, initShipments } = useShipmentStore();
  const { listRecalls, initRecalls } = useRecallStore();

  useEffect(() => {
    initBatches();
    initShipments();
    initRecalls();
  }, [initBatches, initShipments, initRecalls]);

  const batch = id ? getBatch(id) : undefined;
  const shipments = id ? getShipmentsByBatch(id) : [];
  const recall = useMemo(() => {
    if (!batch) return undefined;
    return listRecalls().find((r) => r.batchId === batch.id);
  }, [batch, listRecalls]);

  if (!batch) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <AlertTriangle size={48} className="text-gray-300 mb-3" />
          <p className="text-lg font-medium text-gray-600 mb-1">批次不存在</p>
          <p className="text-sm text-gray-400 mb-4">该批次可能已被删除或ID不正确</p>
          <Button variant="primary" onClick={() => navigate('/batches')}>
            返回批次列表
          </Button>
        </div>
      </div>
    );
  }

  const expiryStatus = isExpired(batch.expiryDate)
    ? { text: '已过期', color: 'text-alert-danger', bg: 'bg-red-50', border: 'border-red-200' }
    : isExpiringSoon(batch.expiryDate, 30)
    ? { text: `临期 · 剩 ${daysUntilExpiry(batch.expiryDate)} 天`, color: 'text-alert-warn', bg: 'bg-amber-50', border: 'border-amber-200' }
    : { text: `${daysUntilExpiry(batch.expiryDate)} 天后过期`, color: 'text-brand-700', bg: 'bg-brand-50', border: 'border-brand-200' };

  const totalShippedQty = shipments.reduce((sum, s) => sum + s.quantity, 0);

  const timelineItems: TimelineItem[] = (() => {
    const items: TimelineItem[] = [
      {
        id: 'create',
        title: '批次创建',
        description: `批次 ${batch.batchNo} 已录入系统，产品：${batch.productName}`,
        time: formatDateTime(batch.createdAt),
        status: 'completed',
        icon: <Hash size={14} />,
        color: 'success',
      },
      {
        id: 'produce',
        title: '生产完成',
        description: `生产日期 ${formatDate(batch.productionDate)}，产量 ${batch.quantity.toLocaleString()} 件`,
        time: formatDate(batch.productionDate),
        status: 'completed',
        icon: <Factory size={14} />,
        color: 'success',
      },
      {
        id: 'inspect',
        title: '质量检验',
        description: `${batch.inspection.items.length} 项检验，综合判定：${
          batch.inspection.overall === 'qualified' ? '合格' : '不合格'
        }，检验员：${batch.inspection.inspector || '—'}`,
        time: formatDateTime(batch.inspection.inspectedAt),
        status: 'completed',
        icon: <ClipboardCheck size={14} />,
        color: batch.inspection.overall === 'qualified' ? 'success' : 'danger',
      },
    ];

    if (batch.status === 'in_stock' || batch.remainingQty > 0) {
      items.push({
        id: 'stock',
        title: '入库在库',
        description: `当前在库数量：${batch.remainingQty.toLocaleString()} 件，${
          totalShippedQty > 0 ? `已发货 ${totalShippedQty.toLocaleString()} 件` : '待发货'
        }`,
        status: batch.remainingQty > 0 && batch.status === 'in_stock' ? 'current' : 'completed',
        icon: <Package size={14} />,
        color: 'info',
      });
    }

    shipments.forEach((s, idx) => {
      items.push({
        id: `ship_${s.id}`,
        title: `发往 ${s.dealerName}`,
        description: `发运 ${s.quantity.toLocaleString()} 件 · 运单号：${s.trackingNo || '—'} · 门店：${s.storeNames.join('、') || '—'}`,
        time: formatDate(s.shipmentDate),
        status: s.status === 'delivered' ? 'completed' : 'current',
        icon: <Truck size={14} />,
        color: s.status === 'delivered' ? 'success' : idx === shipments.length - 1 ? 'warning' : 'info',
      });
    });

    if (recall) {
      items.push({
        id: 'recall',
        title: `产品召回 · ${recall.recallNo}`,
        description: `召回原因：${recall.reason}，等级：${
          recall.level === 'level1' ? '一级紧急' : recall.level === 'level2' ? '二级重要' : '三级一般'
        }，涉及 ${recall.notifications.length} 个下游渠道`,
        time: formatDateTime(recall.createdAt),
        status: recall.status === 'completed' ? 'completed' : 'current',
        icon: <AlertTriangle size={14} />,
        color: 'danger',
      });
    }

    return items;
  })();

  const productShipmentList: Shipment[] = shipments;

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/batches')}
            className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="page-title">{batch.productName}</h1>
              <BatchStatusTag status={batch.status} size={14} />
            </div>
            <p className="page-subtitle">
              批次号：<span className="font-mono text-brand-700">{batch.batchNo}</span>
              <span className="mx-2 text-gray-300">|</span>
              创建时间：{formatDateTime(batch.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {recall && (
            <Button
              variant="danger"
              icon={<AlertTriangle size={16} />}
              onClick={() => navigate(`/recalls/${recall.id}`)}
            >
              查看召回
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader divider>
              <CardTitle icon={<Package size={20} />}>基本信息</CardTitle>
              <div className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${expiryStatus.bg} ${expiryStatus.color} ${expiryStatus.border}`}>
                {expiryStatus.text}
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <div>
                  <InfoRow
                    icon={<Hash size={16} />}
                    label="批次号"
                    value={<span className="font-mono font-medium">{batch.batchNo}</span>}
                    accent
                  />
                  <InfoRow
                    icon={<Package size={16} />}
                    label="产品名称"
                    value={batch.productName}
                    accent
                  />
                  <InfoRow
                    icon={<FileText size={16} />}
                    label="溯源码"
                    value={<span className="font-mono text-brand-700">{batch.traceCode}</span>}
                  />
                  <InfoRow
                    icon={<Calendar size={16} />}
                    label="生产日期"
                    value={formatDate(batch.productionDate)}
                  />
                </div>
                <div>
                  <InfoRow
                    icon={<Calendar size={16} />}
                    label="保质期(天)"
                    value={`${batch.shelfLife} 天`}
                  />
                  <InfoRow
                    icon={<Calendar size={16} />}
                    label="到期日期"
                    value={
                      <span className={expiryStatus.color}>
                        {formatDate(batch.expiryDate)}
                      </span>
                    }
                  />
                  <InfoRow
                    icon={<Factory size={16} />}
                    label="生产数量"
                    value={
                      <div>
                        <div>
                          总计：<span className="font-medium">{batch.quantity.toLocaleString()}</span> 件
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs">
                          <span className="text-gray-500">
                            剩余：<span className="text-brand-700 font-medium">{batch.remainingQty.toLocaleString()}</span>
                          </span>
                          <span className="text-gray-500">
                            已发：<span className="text-amber-700 font-medium">{totalShippedQty.toLocaleString()}</span>
                          </span>
                        </div>
                      </div>
                    }
                  />
                  <InfoRow
                    icon={<User size={16} />}
                    label="备注"
                    value={batch.remark || '—'}
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader divider>
              <CardTitle icon={<Factory size={20} />}>原料来源追溯</CardTitle>
              <span className="text-xs text-gray-500">{batch.rawMaterials.length} 项原料</span>
            </CardHeader>
            <CardBody>
              {batch.rawMaterials.length === 0 ? (
                <div className="text-sm text-gray-400 text-center py-8">暂无原料记录</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {batch.rawMaterials.map((rm, idx) => (
                    <div
                      key={rm.id || idx}
                      className="p-4 rounded-card border border-gray-100 bg-gradient-to-br from-white to-gray-50 hover:border-brand-100 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-700 text-white text-xs font-medium">
                            {idx + 1}
                          </span>
                          <span className="font-medium text-gray-800">{rm.name}</span>
                        </div>
                        <span className="text-xs text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
                          {rm.quantity.toLocaleString()}
                        </span>
                      </div>
                      <div className="space-y-1.5 text-xs text-gray-500 pl-8">
                        <div className="flex items-center gap-1.5">
                          <Building2 size={12} />
                          <span>供应商：</span>
                          <span className="text-gray-700">{rm.supplierName}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Hash size={12} />
                          <span>原料批次：</span>
                          <span className="text-gray-700 font-mono">{rm.batchNo}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader divider>
              <div className="flex items-center justify-between w-full">
                <CardTitle icon={<ClipboardCheck size={20} />}>质量检验结果</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-gray-500">
                    检验员：<span className="text-gray-700 font-medium">{batch.inspection.inspector || '—'}</span>
                    <span className="mx-2 text-gray-300">·</span>
                    {formatDateTime(batch.inspection.inspectedAt)}
                  </div>
                  <InspectionResultTag result={batch.inspection.overall === 'qualified' ? 'pass' : 'fail'} />
                </div>
              </div>
            </CardHeader>
            <CardBody>
              {batch.inspection.items.length === 0 ? (
                <div className="text-sm text-gray-400 text-center py-8">暂无检验项目</div>
              ) : (
                <div className="overflow-hidden rounded-card border border-gray-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="table-header w-16 text-center">#</th>
                        <th className="table-header">检验项目</th>
                        <th className="table-header">检验标准</th>
                        <th className="table-header">检验结果</th>
                        <th className="table-header w-28 text-center">判定</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batch.inspection.items.map((item, idx) => (
                        <tr key={idx} className="border-t border-gray-50">
                          <td className="table-cell text-center text-gray-400">{idx + 1}</td>
                          <td className="table-cell font-medium text-gray-800">{item.name}</td>
                          <td className="table-cell text-gray-500">{item.standard}</td>
                          <td className="table-cell text-gray-700">{item.result || '—'}</td>
                          <td className="table-cell text-center">
                            <InspectionResultTag result={item.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader divider>
              <CardTitle icon={<Navigation size={20} />}>全链路流向时间轴</CardTitle>
            </CardHeader>
            <CardBody>
              <Timeline items={timelineItems} orientation="vertical" />
            </CardBody>
          </Card>

          {productShipmentList.length > 0 && (
            <Card>
              <CardHeader divider>
                <CardTitle icon={<Truck size={20} />}>发货流向明细</CardTitle>
                <span className="text-xs text-gray-500">{productShipmentList.length} 条发运记录</span>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {productShipmentList.map((ship) => (
                    <div
                      key={ship.id}
                      className="p-4 rounded-card border border-gray-100 flex flex-col md:flex-row md:items-center gap-4 hover:border-brand-100 hover:bg-brand-50/20 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
                          <Truck size={18} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-800">{ship.dealerName}</span>
                            <ShipmentStatusTag status={ship.status} size={12} />
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                            <span className="flex items-center gap-1">
                              <MapPin size={12} />
                              {ship.storeNames.join('、') || '直配'}
                            </span>
                            {ship.trackingNo && (
                              <span className="font-mono">运单：{ship.trackingNo}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 md:gap-6 md:text-right">
                        <div>
                          <p className="text-xs text-gray-400">数量</p>
                          <p className="text-sm font-medium text-gray-800">
                            {ship.quantity.toLocaleString()} 件
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">发运日期</p>
                          <p className="text-sm text-gray-700">{formatDate(ship.shipmentDate)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <QrCodeDisplay
            value={batch.traceCode}
            size={200}
            label={`${batch.productName} · ${batch.batchNo}`}
          />

          <Card>
            <CardHeader divider>
              <CardTitle icon={<Store size={18} />}>数量概况</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">生产总量</span>
                  <span className="text-lg font-serif font-bold text-gray-800">
                    {batch.quantity.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all"
                    style={{
                      width: `${batch.quantity > 0 ? (batch.remainingQty / batch.quantity) * 100 : 0}%`,
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-brand-50 border border-brand-100">
                    <p className="text-xs text-brand-600 mb-1">在库剩余</p>
                    <p className="text-base font-bold text-brand-700">
                      {batch.remainingQty.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                    <p className="text-xs text-amber-700 mb-1">已发下游</p>
                    <p className="text-base font-bold text-amber-800">
                      {totalShippedQty.toLocaleString()}
                    </p>
                  </div>
                </div>
                {totalShippedQty > 0 && (
                  <div className="text-center text-xs text-gray-400 pt-2 border-t border-gray-50">
                    发运率：
                    <span className="text-brand-600 font-medium">
                      {((totalShippedQty / batch.quantity) * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {recall && (
            <Card>
              <CardHeader divider>
                <div className="flex items-center justify-between w-full">
                  <CardTitle icon={<AlertTriangle size={18} />}>召回信息</CardTitle>
                  <span className="text-xs text-alert-danger bg-red-50 px-2 py-0.5 rounded-full font-medium">
                    召回中
                  </span>
                </div>
              </CardHeader>
              <CardBody className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">召回单号</p>
                  <p className="text-sm font-mono font-medium text-alert-danger">{recall.recallNo}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">召回等级</p>
                  <p className="text-sm text-gray-800">
                    {recall.level === 'level1' ? '一级(紧急)' : recall.level === 'level2' ? '二级(重要)' : '三级(一般)'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">召回原因</p>
                  <p className="text-sm text-gray-700">{recall.reason}</p>
                </div>
                <div className="pt-3 border-t border-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">召回完成进度</span>
                    <span className="text-xs font-medium text-brand-700">
                      {useRecallStore.getState().getRecallStats(recall.id).completionRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-alert-danger to-alert-warn rounded-full"
                      style={{
                        width: `${useRecallStore.getState().getRecallStats(recall.id).completionRate}%`,
                      }}
                    />
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardBody>
              <div className="flex flex-col gap-2">
                <Button variant="secondary" icon={<CheckCircle2 size={16} />} onClick={() => navigate('/batches')}>
                  返回批次列表
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
