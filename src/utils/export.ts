import * as XLSX from 'xlsx';
import type { Batch, Shipment, Recall, RecallStats } from '@/types';
import { formatDateTime, formatDate } from './date';

export const exportToExcel = <T>(
  data: T[],
  headers: Record<string, string>,
  filename: string
) => {
  const exportData = data.map((row) => {
    const newRow: Record<string, unknown> = {};
    Object.keys(headers).forEach((key) => {
      const r = row as Record<string, unknown>;
      newRow[headers[key]] = r[key];
    });
    return newRow;
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportBatchRecords = (batches: Batch[]) => {
  const headers = {
    batchNo: '批次号',
    productName: '产品名称',
    productionDate: '生产日期',
    expiryDate: '保质期至',
    quantity: '生产数量',
    remainingQty: '剩余数量',
    status: '状态',
    traceCode: '溯源码',
    createdAt: '创建时间',
  };

  const exportData = batches.map((b) => ({
    ...b,
    status: getBatchStatusText(b.status),
    productionDate: formatDate(b.productionDate),
    expiryDate: formatDate(b.expiryDate),
    createdAt: formatDateTime(b.createdAt),
  }));

  exportToExcel(exportData, headers, `批次记录_${formatDate(new Date())}`);
};

export const exportShipmentRecords = (shipments: Shipment[]) => {
  const headers = {
    batchNo: '批次号',
    dealerName: '经销商',
    storeNames: '门店',
    quantity: '发货数量',
    shipmentDate: '发货日期',
    trackingNo: '运单号',
    status: '状态',
  };

  const exportData = shipments.map((s) => ({
    ...s,
    storeNames: s.storeNames.join(', '),
    status: s.status === 'transit' ? '运输中' : '已送达',
    shipmentDate: formatDate(s.shipmentDate),
  }));

  exportToExcel(exportData, headers, `发货流向记录_${formatDate(new Date())}`);
};

export const exportRecallReport = (
  recall: Recall,
  stats: RecallStats
) => {
  const recallInfo = [
    { 项目: '召回单号', 内容: recall.recallNo },
    { 项目: '关联批次', 内容: recall.batchNo },
    { 项目: '产品名称', 内容: recall.productName },
    { 项目: '召回等级', 内容: getRecallLevelText(recall.level) },
    { 项目: '召回原因', 内容: recall.reason },
    { 项目: '召回范围', 内容: recall.scope },
    { 项目: '发起时间', 内容: formatDateTime(recall.createdAt) },
    { 项目: '发起人', 内容: recall.initiator },
    { 项目: '当前状态', 内容: getRecallStatusText(recall.status) },
  ];

  const summary = [
    { 统计项: '通知总数', 数量: stats.total },
    { 统计项: '已发送', 数量: stats.sent },
    { 统计项: '已收到', 数量: stats.received },
    { 统计项: '已下架', 数量: stats.offShelf },
    { 统计项: '已退回', 数量: stats.returned },
    { 统计项: '已催促', 数量: stats.urged },
    { 统计项: '待处理', 数量: stats.pending },
    { 统计项: '完成率(%)', 数量: stats.completionRate.toFixed(1) },
  ];

  const notifications = recall.notifications.map((n) => ({
    接收方类型: n.recipientType === 'dealer' ? '经销商' : '门店',
    接收方名称: n.recipientName,
    联系人: n.contact,
    涉及数量: n.quantity,
    状态: getNotificationStatusText(n.status),
    发送时间: formatDateTime(n.sentAt),
    响应时间: formatDateTime(n.respondedAt),
    备注: n.remark || '',
  }));

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(recallInfo);
  const ws2 = XLSX.utils.json_to_sheet(summary);
  const ws3 = XLSX.utils.json_to_sheet(notifications);
  XLSX.utils.book_append_sheet(wb, ws1, '召回信息');
  XLSX.utils.book_append_sheet(wb, ws2, '召回统计');
  XLSX.utils.book_append_sheet(wb, ws3, '通知详情');
  XLSX.writeFile(wb, `召回报告_${recall.recallNo}.xlsx`);
};

export const getBatchStatusText = (status: string): string => {
  const map: Record<string, string> = {
    pending: '待检验',
    qualified: '检验合格',
    unqualified: '检验不合格',
    in_stock: '在库',
    shipped: '已发货',
    recalling: '召回中',
  };
  return map[status] || status;
};

export const getRecallLevelText = (level: string): string => {
  const map: Record<string, string> = {
    level1: '一级(紧急)',
    level2: '二级(重要)',
    level3: '三级(一般)',
  };
  return map[level] || level;
};

export const getRecallStatusText = (status: string): string => {
  const map: Record<string, string> = {
    pending: '待处理',
    notifying: '通知发送中',
    in_progress: '进行中',
    completed: '已完成',
  };
  return map[status] || status;
};

export const getNotificationStatusText = (status: string): string => {
  const map: Record<string, string> = {
    pending: '待发送',
    sent: '已发送',
    received: '已收到',
    off_shelf: '已下架',
    returned: '已退回',
    urged: '已催促',
  };
  return map[status] || status;
};
