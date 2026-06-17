import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FileSpreadsheet,
  Truck,
  AlertTriangle,
  Search,
  Download,
  Calendar,
  Eye,
  Filter,
  FileText,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  Package,
  Users,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { useBatchStore } from '@/store/batchStore';
import { useShipmentStore } from '@/store/shipmentStore';
import { useRecallStore } from '@/store/recallStore';
import { useBaseStore } from '@/store/baseStore';
import {
  exportBatchRecords,
  exportShipmentRecords,
  exportRecallReport,
} from '@/utils/export';
import { formatDate, formatDateTime } from '@/utils/date';
import {
  BatchStatusTag,
  ShipmentStatusTag,
  RecallLevelTag,
  RecallStatusTag,
  NotificationStatusTag,
} from '@/components/ui/StatusTag';
import type { Batch, Shipment, Recall } from '@/types';
import { today } from '@/utils/date';

export default function ExportCenter() {
  const initBase = useBaseStore((s) => s.initBase);
  const initBatches = useBatchStore((s) => s.initBatches);
  const initShipments = useShipmentStore((s) => s.initShipments);
  const initRecalls = useRecallStore((s) => s.initRecalls);
  const listBatches = useBatchStore((s) => s.listBatches);
  const listShipments = useShipmentStore((s) => s.listShipments);
  const listRecalls = useRecallStore((s) => s.listRecalls);
  const getRecall = useRecallStore((s) => s.getRecall);
  const getRecallStats = useRecallStore((s) => s.getRecallStats);

  useState(() => {
    initBase();
    initBatches();
    initShipments();
    initRecalls();
  });

  const [batchFilters, setBatchFilters] = useState({
    keyword: '',
    status: '',
    startDate: '',
    endDate: '',
  });
  const [shipmentFilters, setShipmentFilters] = useState({
    keyword: '',
    dealerId: '',
    status: '',
    startDate: '',
    endDate: '',
  });
  const [selectedRecallId, setSelectedRecallId] = useState<string>('');
  const [showRecallPreview, setShowRecallPreview] = useState(false);

  const dealers = useBaseStore((s) => s.dealers);

  const filteredBatches: Batch[] = useMemo(() => {
    return listBatches({
      keyword: batchFilters.keyword || undefined,
      status: (batchFilters.status as Batch['status']) || undefined,
      startDate: batchFilters.startDate || undefined,
      endDate: batchFilters.endDate || undefined,
    });
  }, [listBatches, batchFilters]);

  const filteredShipments: Shipment[] = useMemo(() => {
    return listShipments({
      keyword: shipmentFilters.keyword || undefined,
      dealerId: shipmentFilters.dealerId || undefined,
      status: (shipmentFilters.status as Shipment['status']) || undefined,
      startDate: shipmentFilters.startDate || undefined,
      endDate: shipmentFilters.endDate || undefined,
    });
  }, [listShipments, shipmentFilters]);

  const recalls: Recall[] = useMemo(() => listRecalls(), [listRecalls]);

  const selectedRecall = selectedRecallId ? getRecall(selectedRecallId) : undefined;
  const selectedRecallStats = selectedRecallId ? getRecallStats(selectedRecallId) : undefined;

  const handleExportBatches = () => {
    exportBatchRecords(filteredBatches);
  };

  const handleExportShipments = () => {
    exportShipmentRecords(filteredShipments);
  };

  const handleExportRecall = () => {
    if (selectedRecall && selectedRecallStats) {
      exportRecallReport(selectedRecall, selectedRecallStats);
    }
  };

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="page-header"
      >
        <div>
          <h1 className="page-title">数据导出中心</h1>
          <p className="page-subtitle">批量导出批次记录、发货流向及召回报告，支持 Excel 格式</p>
        </div>
      </motion.div>

      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card>
            <CardHeader divider>
              <CardTitle icon={<FileSpreadsheet size={20} />}>
                批次记录导出
                <span className="ml-2 text-xs font-normal text-gray-400">
                  共 {filteredBatches.length} 条记录
                </span>
              </CardTitle>
              <Button variant="primary" icon={<Download size={16} />} onClick={handleExportBatches}>
                导出 Excel
              </Button>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <Input
                  label="关键词搜索"
                  placeholder="批次号/产品名/溯源码"
                  icon={<Search size={16} />}
                  value={batchFilters.keyword}
                  onChange={(e) =>
                    setBatchFilters({ ...batchFilters, keyword: e.target.value })
                  }
                />
                <Select
                  label="批次状态"
                  value={batchFilters.status}
                  onChange={(e) =>
                    setBatchFilters({ ...batchFilters, status: e.target.value })
                  }
                  options={[
                    { value: 'pending', label: '待检验' },
                    { value: 'qualified', label: '检验合格' },
                    { value: 'unqualified', label: '检验不合格' },
                    { value: 'in_stock', label: '在库' },
                    { value: 'shipped', label: '已发货' },
                    { value: 'recalling', label: '召回中' },
                  ]}
                />
                <Input
                  type="date"
                  label="开始日期"
                  icon={<Calendar size={16} />}
                  max={today()}
                  value={batchFilters.startDate}
                  onChange={(e) =>
                    setBatchFilters({ ...batchFilters, startDate: e.target.value })
                  }
                />
                <Input
                  type="date"
                  label="结束日期"
                  icon={<Calendar size={16} />}
                  max={today()}
                  value={batchFilters.endDate}
                  onChange={(e) =>
                    setBatchFilters({ ...batchFilters, endDate: e.target.value })
                  }
                />
                <div className="flex items-end">
                  <Button
                    variant="secondary"
                    icon={<Filter size={16} />}
                    onClick={() =>
                      setBatchFilters({
                        keyword: '',
                        status: '',
                        startDate: '',
                        endDate: '',
                      })
                    }
                    className="w-full"
                  >
                    重置筛选
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto scrollbar-thin rounded-lg border border-gray-100">
                <table className="w-full">
                  <thead>
                    <tr className="bg-brand-50/60">
                      <th className="table-header">批次号</th>
                      <th className="table-header">产品名称</th>
                      <th className="table-header">生产日期</th>
                      <th className="table-header">保质期至</th>
                      <th className="table-header">数量</th>
                      <th className="table-header">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBatches.slice(0, 5).map((b, idx) => (
                      <tr key={b.id} className={idx % 2 === 1 ? 'bg-gray-50/30' : ''}>
                        <td className="table-cell font-mono text-sm">{b.batchNo}</td>
                        <td className="table-cell">{b.productName}</td>
                        <td className="table-cell">{formatDate(b.productionDate)}</td>
                        <td className="table-cell">{formatDate(b.expiryDate)}</td>
                        <td className="table-cell">{b.quantity.toLocaleString()}</td>
                        <td className="table-cell">
                          <BatchStatusTag status={b.status} />
                        </td>
                      </tr>
                    ))}
                    {filteredBatches.length === 0 && (
                      <tr>
                        <td colSpan={6} className="table-cell text-center py-8 text-gray-400">
                          暂无符合条件的数据
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {filteredBatches.length > 5 && (
                <p className="text-sm text-gray-400 mt-3 text-center">
                  仅展示前 5 条，导出将包含全部 {filteredBatches.length} 条记录
                </p>
              )}
            </CardBody>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card>
            <CardHeader divider>
              <CardTitle icon={<Truck size={20} />}>
                发货流向导出
                <span className="ml-2 text-xs font-normal text-gray-400">
                  共 {filteredShipments.length} 条记录
                </span>
              </CardTitle>
              <Button variant="primary" icon={<Download size={16} />} onClick={handleExportShipments}>
                导出 Excel
              </Button>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <Input
                  label="关键词搜索"
                  placeholder="批次号/经销商/运单号"
                  icon={<Search size={16} />}
                  value={shipmentFilters.keyword}
                  onChange={(e) =>
                    setShipmentFilters({ ...shipmentFilters, keyword: e.target.value })
                  }
                />
                <Select
                  label="经销商"
                  value={shipmentFilters.dealerId}
                  onChange={(e) =>
                    setShipmentFilters({ ...shipmentFilters, dealerId: e.target.value })
                  }
                  options={dealers.map((d) => ({ value: d.id, label: d.name }))}
                />
                <Select
                  label="发货状态"
                  value={shipmentFilters.status}
                  onChange={(e) =>
                    setShipmentFilters({ ...shipmentFilters, status: e.target.value })
                  }
                  options={[
                    { value: 'transit', label: '运输中' },
                    { value: 'delivered', label: '已送达' },
                  ]}
                />
                <Input
                  type="date"
                  label="开始日期"
                  icon={<Calendar size={16} />}
                  max={today()}
                  value={shipmentFilters.startDate}
                  onChange={(e) =>
                    setShipmentFilters({ ...shipmentFilters, startDate: e.target.value })
                  }
                />
                <div className="flex items-end gap-2">
                  <Input
                    type="date"
                    label="结束日期"
                    icon={<Calendar size={16} />}
                    max={today()}
                    value={shipmentFilters.endDate}
                    onChange={(e) =>
                      setShipmentFilters({ ...shipmentFilters, endDate: e.target.value })
                    }
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="flex justify-end mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Filter size={14} />}
                  onClick={() =>
                    setShipmentFilters({
                      keyword: '',
                      dealerId: '',
                      status: '',
                      startDate: '',
                      endDate: '',
                    })
                  }
                >
                  重置筛选
                </Button>
              </div>

              <div className="overflow-x-auto scrollbar-thin rounded-lg border border-gray-100">
                <table className="w-full">
                  <thead>
                    <tr className="bg-brand-50/60">
                      <th className="table-header">批次号</th>
                      <th className="table-header">经销商</th>
                      <th className="table-header">门店</th>
                      <th className="table-header">数量</th>
                      <th className="table-header">发货日期</th>
                      <th className="table-header">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredShipments.slice(0, 5).map((s, idx) => (
                      <tr key={s.id} className={idx % 2 === 1 ? 'bg-gray-50/30' : ''}>
                        <td className="table-cell font-mono text-sm">{s.batchNo}</td>
                        <td className="table-cell">{s.dealerName}</td>
                        <td className="table-cell">{s.storeNames.join('、')}</td>
                        <td className="table-cell">{s.quantity.toLocaleString()}</td>
                        <td className="table-cell">{formatDate(s.shipmentDate)}</td>
                        <td className="table-cell">
                          <ShipmentStatusTag status={s.status} />
                        </td>
                      </tr>
                    ))}
                    {filteredShipments.length === 0 && (
                      <tr>
                        <td colSpan={6} className="table-cell text-center py-8 text-gray-400">
                          暂无符合条件的数据
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {filteredShipments.length > 5 && (
                <p className="text-sm text-gray-400 mt-3 text-center">
                  仅展示前 5 条，导出将包含全部 {filteredShipments.length} 条记录
                </p>
              )}
            </CardBody>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card>
            <CardHeader divider>
              <CardTitle icon={<AlertTriangle size={20} />}>
                召回报告导出
              </CardTitle>
              <div className="flex items-center gap-2">
                {selectedRecall && (
                  <Button
                    variant="secondary"
                    icon={<Eye size={16} />}
                    onClick={() => setShowRecallPreview(!showRecallPreview)}
                  >
                    {showRecallPreview ? '收起预览' : '预览详情'}
                  </Button>
                )}
                <Button
                  variant="primary"
                  icon={<Download size={16} />}
                  disabled={!selectedRecall || !selectedRecallStats}
                  onClick={handleExportRecall}
                >
                  一键导出
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              <div className="mb-6">
                <Select
                  label="选择召回事件"
                  required
                  value={selectedRecallId}
                  onChange={(e) => {
                    setSelectedRecallId(e.target.value);
                    setShowRecallPreview(!!e.target.value);
                  }}
                  options={recalls.map((r) => ({
                    value: r.id,
                    label: `${r.recallNo} - ${r.productName}`,
                  }))}
                />
              </div>

              {selectedRecall && selectedRecallStats && showRecallPreview && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 border border-red-100">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-serif text-xl font-bold text-gray-800">
                            {selectedRecall.recallNo}
                          </h3>
                          <RecallLevelTag level={selectedRecall.level} />
                          <RecallStatusTag status={selectedRecall.status} />
                        </div>
                        <p className="text-gray-600 mt-2">{selectedRecall.productName}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          关联批次：<span className="font-mono">{selectedRecall.batchNo}</span>
                          {' · '} 发起时间：{formatDateTime(selectedRecall.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">发起人</p>
                        <p className="font-medium text-gray-800">{selectedRecall.initiator}</p>
                      </div>
                    </div>
                    <div className="divider" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">召回原因</p>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {selectedRecall.reason}
                      </p>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">召回范围</p>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {selectedRecall.scope}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-gray-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <Users size={16} /> 通知总数
                      </div>
                      <p className="text-2xl font-bold text-gray-800 mt-2">
                        {selectedRecallStats.total}
                      </p>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <Package size={16} /> 已退回
                      </div>
                      <p className="text-2xl font-bold text-brand-700 mt-2">
                        {selectedRecallStats.returned}
                      </p>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <TrendingUp size={16} /> 完成率
                      </div>
                      <p className="text-2xl font-bold text-brand-700 mt-2">
                        {selectedRecallStats.completionRate.toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <CheckCircle2 size={16} /> 已下架
                      </div>
                      <p className="text-2xl font-bold text-amber-600 mt-2">
                        {selectedRecallStats.offShelf}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText size={18} className="text-brand-700" />
                      <h4 className="font-semibold text-gray-800">通知响应详情</h4>
                      <ChevronRight
                        size={16}
                        className={`text-gray-400 transition-transform ${
                          showRecallPreview ? 'rotate-90' : ''
                        }`}
                      />
                    </div>
                    <div className="overflow-x-auto scrollbar-thin rounded-lg border border-gray-100">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-brand-50/60">
                            <th className="table-header">接收方</th>
                            <th className="table-header">类型</th>
                            <th className="table-header">联系人</th>
                            <th className="table-header">涉及数量</th>
                            <th className="table-header">状态</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedRecall.notifications.map((n, idx) => (
                            <tr key={n.id} className={idx % 2 === 1 ? 'bg-gray-50/30' : ''}>
                              <td className="table-cell">{n.recipientName}</td>
                              <td className="table-cell">
                                {n.recipientType === 'dealer' ? '经销商' : '门店'}
                              </td>
                              <td className="table-cell">{n.contact}</td>
                              <td className="table-cell">{n.quantity.toLocaleString()}</td>
                              <td className="table-cell">
                                <NotificationStatusTag status={n.status} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {!selectedRecall && (
                <div className="py-12 text-center text-gray-400">
                  <ChevronDown size={32} className="mx-auto mb-3 animate-bounce" />
                  <p>请选择上方的召回事件以查看预览详情</p>
                </div>
              )}
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
