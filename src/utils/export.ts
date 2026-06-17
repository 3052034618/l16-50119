import * as XLSX from 'xlsx';
import type { Batch, Shipment, Recall, RecallStats } from '@/types';
import type { DisposalSummaryItem } from '@/store/recallStore';
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

const dedupeNotifications = (notifications: Recall['notifications']) => {
  const seen = new Map<string, Recall['notifications'][number]>();
  notifications.forEach((n) => {
    const key = `${n.recipientType}-${n.recipientId}`;
    if (seen.has(key)) {
      const existing = seen.get(key)!;
      seen.set(key, {
        ...existing,
        quantity: existing.quantity + n.quantity,
        sentAt: existing.sentAt || n.sentAt,
        respondedAt: existing.respondedAt || n.respondedAt,
        urgeCount: Math.max(existing.urgeCount ?? 0, n.urgeCount ?? 0),
        lastUrgedAt: existing.lastUrgedAt || n.lastUrgedAt,
        disposalRemark: existing.disposalRemark || n.disposalRemark,
        returnedQty: existing.returnedQty ?? n.returnedQty,
        voucherNo: existing.voucherNo || n.voucherNo,
        remark: existing.remark || n.remark,
      });
    } else {
      seen.set(key, { ...n });
    }
  });
  return Array.from(seen.values());
};

export const exportRecallReport = (
  recall: Recall,
  stats: RecallStats,
  disposalSummary?: DisposalSummaryItem[]
) => {
  const defaultDisposalSummary = (): DisposalSummaryItem[] => {
    const deduped = dedupeNotifications(recall.notifications);
    return deduped.map((n) => {
      const offShelfQty = n.status === 'off_shelf' || n.status === 'returned' ? n.quantity : 0;
      const actualReturnedQty = n.returnedQty ?? (n.status === 'returned' ? n.quantity : 0);
      const hasVoucher = !!n.voucherNo;
      const hasRemark = !!n.disposalRemark;
      const hasReturnQty = n.returnedQty !== undefined;
      let voucherStatus: DisposalSummaryItem['voucherStatus'] = 'none';
      if (hasVoucher && hasRemark && (n.status === 'returned' ? hasReturnQty : true)) {
        voucherStatus = 'complete';
      } else if (hasVoucher || hasRemark || hasReturnQty) {
        voucherStatus = 'partial';
      }
      const hasDiscrepancy = n.status === 'returned' && actualReturnedQty !== n.quantity;
      return {
        recipientType: n.recipientType,
        recipientId: n.recipientId,
        recipientName: n.recipientName,
        contact: n.contact,
        totalQty: n.quantity,
        offShelfQty,
        returnedQty: actualReturnedQty,
        voucherStatus,
        lastUpdatedAt: n.respondedAt || n.sentAt || recall.createdAt,
        hasDiscrepancy,
        notificationId: n.id,
      };
    });
  };

  const finalDisposalSummary = disposalSummary ?? defaultDisposalSummary();
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
    { 项目: '风险评分', 内容: `${stats.riskScore} 分` },
    { 项目: '逾期天数', 内容: `${stats.overdueDays} 天` },
    { 项目: '累计催促次数', 内容: stats.totalUrgeCount },
    { 项目: '未响应数量', 内容: stats.unresponsive },
  ];

  const summary = [
    { 统计项: '通知总数', 数量: stats.total },
    { 统计项: '已发送', 数量: stats.sent },
    { 统计项: '已收到', 数量: stats.received },
    { 统计项: '已下架', 数量: stats.offShelf },
    { 统计项: '已退回', 数量: stats.returned },
    { 统计项: '已催促对象', 数量: stats.urged },
    { 统计项: '累计催促次数', 数量: stats.totalUrgeCount },
    { 统计项: '待处理', 数量: stats.pending },
    { 统计项: '未响应/待退回', 数量: stats.unresponsive },
    { 统计项: '完成率(%)', 数量: Number(stats.completionRate.toFixed(1)) },
  ];

  const dedupedNotifications = dedupeNotifications(recall.notifications);
  const notifications = dedupedNotifications.map((n) => ({
    接收方类型: n.recipientType === 'dealer' ? '经销商' : '门店',
    接收方名称: n.recipientName,
    联系人: n.contact,
    涉及数量: n.quantity,
    状态: getNotificationStatusText(n.status),
    催促次数: n.urgeCount ?? 0,
    最后催促时间: formatDateTime(n.lastUrgedAt),
    发送时间: formatDateTime(n.sentAt),
    响应时间: formatDateTime(n.respondedAt),
    退回数量: n.returnedQty ?? '',
    凭证编号: n.voucherNo || '',
    处置说明: n.disposalRemark || '',
    备注: n.remark || '',
  }));

  const getVoucherStatusText = (status: DisposalSummaryItem['voucherStatus']) => {
    const map = { complete: '凭证齐全', partial: '部分填写', none: '未填写' };
    return map[status];
  };

  const disposalLedger = finalDisposalSummary.map((item, idx) => ({
    序号: idx + 1,
    接收方类型: item.recipientType === 'dealer' ? '经销商' : '门店',
    接收方名称: item.recipientName,
    联系人: item.contact,
    应召回数量: item.totalQty,
    已下架数量: item.offShelfQty,
    已退回数量: item.returnedQty,
    凭证状态: getVoucherStatusText(item.voucherStatus),
    数量对齐: item.hasDiscrepancy ? '不一致' : (item.returnedQty > 0 ? '对齐' : '-'),
    处置完成: item.returnedQty === item.totalQty && item.returnedQty > 0 ? '是' : '否',
    最后更新时间: formatDateTime(item.lastUpdatedAt),
  }));

  const timeline = [...(recall.timeline || [])]
    .sort((a, b) => a.time.localeCompare(b.time))
    .map((e, idx) => ({
      序号: idx + 1,
      事件时间: formatDateTime(e.time),
      事件类型: getTimelineEventTypeText(e.type),
      事件标题: e.title,
      事件描述: e.description || '',
      操作人: e.operator || '系统',
    }));

  const summaryAdjusted = [...summary];
  const totalIdx = summaryAdjusted.findIndex((s) => s.统计项 === '通知总数');
  if (totalIdx >= 0) {
    summaryAdjusted[totalIdx] = { ...summaryAdjusted[totalIdx], 数量: dedupedNotifications.length };
  }

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(recallInfo);
  const ws2 = XLSX.utils.json_to_sheet(summaryAdjusted);
  const ws3 = XLSX.utils.json_to_sheet(notifications);
  const ws4 = XLSX.utils.json_to_sheet(timeline);
  const ws5 = XLSX.utils.json_to_sheet(disposalLedger);

  ws1['!cols'] = [{ wch: 16 }, { wch: 40 }];
  ws2['!cols'] = [{ wch: 18 }, { wch: 12 }];
  ws3['!cols'] = [
    { wch: 10 }, { wch: 18 }, { wch: 16 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
    { wch: 10 }, { wch: 16 }, { wch: 30 }, { wch: 20 },
  ];
  ws4['!cols'] = [
    { wch: 6 }, { wch: 20 }, { wch: 12 }, { wch: 30 }, { wch: 40 }, { wch: 10 },
  ];
  ws5['!cols'] = [
    { wch: 6 }, { wch: 10 }, { wch: 20 }, { wch: 18 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(wb, ws1, '召回信息');
  XLSX.utils.book_append_sheet(wb, ws2, '召回统计');
  XLSX.utils.book_append_sheet(wb, ws3, '通知详情');
  XLSX.utils.book_append_sheet(wb, ws4, '事件时间线');
  XLSX.utils.book_append_sheet(wb, ws5, '处置台账汇总');
  XLSX.writeFile(wb, `召回报告_${recall.recallNo}.xlsx`);
};

const getTimelineEventTypeText = (type: string): string => {
  const map: Record<string, string> = {
    created: '创建召回',
    notification_sent: '通知发送',
    urged: '催促通知',
    notification_received: '确认收到',
    off_shelf: '产品下架',
    returned: '产品退回',
    status_changed: '状态变更',
  };
  return map[type] || type;
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
