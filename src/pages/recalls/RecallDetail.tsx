import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Bell,
  Download,
  RefreshCw,
  Package,
  User,
  Calendar,
  FileText,
  Check,
  AlertTriangle,
  Clock,
  History,
  ChevronDown,
  ChevronUp,
  Save,
  FileCheck,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RingProgress } from '@/components/RingProgress';
import { Kanban, KanbanColumn } from '@/components/Kanban';
import { Timeline, TimelineItem } from '@/components/Timeline';
import { RecallLevelTag, RecallStatusTag, NotificationStatusTag } from '@/components/ui/StatusTag';
import { useRecallStore, type DisposalSummaryItem } from '@/store/recallStore';
import type { Recall, RecallNotification, RecallNotificationStatus, RecallTimelineEvent } from '@/types/recall';
import { formatDateTime } from '@/utils/date';
import { exportRecallReport } from '@/utils/export';
import { clsx } from 'clsx';

const timelineColorMap: Record<RecallTimelineEvent['type'], TimelineItem['color']> = {
  created: 'info',
  notification_sent: 'success',
  urged: 'warning',
  notification_received: 'info',
  off_shelf: 'warning',
  returned: 'success',
  status_changed: 'default',
};

const NOTIFICATION_STATUS_LABEL: Record<RecallNotificationStatus, string> = {
  pending: '待发送',
  sent: '已发送',
  received: '已收到',
  off_shelf: '已下架',
  returned: '已退回',
  urged: '已催促',
};

interface DisposalFormData {
  disposalRemark: string;
  returnedQty: string;
  voucherNo: string;
}

export default function RecallDetail() {
  const { id: urlId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    recalls,
    initRecalls,
    getRecall,
    getRecallStats,
    getDisposalSummary,
    sendNotifications,
    urgeRecipients,
    updateNotificationStatus,
    updateNotificationDisposal,
  } = useRecallStore();

  const [recallId, setRecallId] = useState<string>(urlId || '');
  const [sending, setSending] = useState(false);
  const [urging, setUrging] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'ledger'>('kanban');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [disposalForms, setDisposalForms] = useState<Record<string, DisposalFormData>>({});

  useEffect(() => {
    initRecalls();
  }, [initRecalls]);

  useEffect(() => {
    if (urlId) {
      setRecallId(urlId);
    } else if (recalls.length > 0 && !recallId) {
      setRecallId(recalls[0].id);
    }
  }, [urlId, recalls, recallId]);

  const recall: Recall | undefined = useMemo(() => {
    return recallId ? getRecall(recallId) : undefined;
  }, [getRecall, recallId]);

  const stats = useMemo(() => {
    return recall ? getRecallStats(recall.id) : null;
  }, [getRecallStats, recall]);

  const disposalSummary = useMemo((): DisposalSummaryItem[] => {
    return recall ? getDisposalSummary(recall.id) : [];
  }, [getDisposalSummary, recall]);

  useEffect(() => {
    if (!recall) return;
    const initialForms: Record<string, DisposalFormData> = {};
    recall.notifications.forEach((n) => {
      initialForms[n.id] = {
        disposalRemark: n.disposalRemark || '',
        returnedQty: n.returnedQty !== undefined ? String(n.returnedQty) : '',
        voucherNo: n.voucherNo || '',
      };
    });
    setDisposalForms(initialForms);
  }, [recall?.id, recall?.notifications.length]);

  const kanbanColumns: KanbanColumn[] = useMemo(() => {
    if (!recall) return [];

    const filterByStatus = (statuses: RecallNotificationStatus[]) =>
      recall.notifications.filter((n) => statuses.includes(n.status));

    return [
      {
        key: 'pending',
        title: '待发送',
        color: 'bg-gray-400',
        bgColor: 'bg-gray-50',
        items: filterByStatus(['pending']),
      },
      {
        key: 'sent',
        title: '已发送',
        color: 'bg-blue-500',
        bgColor: 'bg-blue-50',
        items: filterByStatus(['sent']),
      },
      {
        key: 'received',
        title: '已收到',
        color: 'bg-indigo-500',
        bgColor: 'bg-indigo-50',
        items: filterByStatus(['received']),
      },
      {
        key: 'off_shelf',
        title: '已下架',
        color: 'bg-amber-500',
        bgColor: 'bg-amber-50',
        items: filterByStatus(['off_shelf']),
      },
      {
        key: 'returned',
        title: '已退回',
        color: 'bg-brand-500',
        bgColor: 'bg-brand-50',
        items: filterByStatus(['returned']),
      },
    ];
  }, [recall]);

  const pendingCount = useMemo(() => {
    if (!recall) return 0;
    return recall.notifications.filter(
      (n) => n.status === 'pending'
    ).length;
  }, [recall]);

  const toggleCardExpand = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDisposalChange = (notificationId: string, field: keyof DisposalFormData, value: string) => {
    setDisposalForms((prev) => ({
      ...prev,
      [notificationId]: {
        ...prev[notificationId],
        [field]: value,
      },
    }));
  };

  const handleSaveDisposal = (notificationId: string) => {
    const form = disposalForms[notificationId];
    if (!form) return;
    setErrorMsg('');

    const result = updateNotificationDisposal(notificationId, {
      disposalRemark: form.disposalRemark || undefined,
      returnedQty: form.returnedQty ? Number(form.returnedQty) : undefined,
      voucherNo: form.voucherNo || undefined,
    });

    if (result.success) {
      setSuccessMsg('处置凭证已保存');
      setTimeout(() => setSuccessMsg(''), 2000);
    } else {
      setErrorMsg(result.error || '保存失败');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const handleSendNotifications = async () => {
    if (!recall) return;
    setSending(true);
    setSuccessMsg('');

    try {
      const result = await sendNotifications(recall.id);
      setSuccessMsg(`通知发送完成：成功 ${result.success} 条，失败 ${result.failed} 条`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error('发送通知失败:', error);
    } finally {
      setSending(false);
    }
  };

  const handleUrge = async () => {
    if (!recall) return;
    setUrging(true);
    setSuccessMsg('');

    try {
      const urgedIds = urgeRecipients(recall.id);
      if (urgedIds.length === 0) {
        setSuccessMsg('当前没有需要催促的接收方（已发送或已收到状态）');
      } else {
        setSuccessMsg(`已催促 ${urgedIds.length} 个未及时响应的接收方`);
      }
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error('催促失败:', error);
    } finally {
      setUrging(false);
    }
  };

  const handleExport = async () => {
    if (!recall || !stats) return;
    setExporting(true);

    try {
      exportRecallReport(recall, stats, disposalSummary);
      setSuccessMsg('召回报告导出成功');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error('导出失败:', error);
    } finally {
      setExporting(false);
    }
  };

  const getNextStatus = (current: RecallNotificationStatus): RecallNotificationStatus | null => {
    if (current === 'pending') return 'sent';
    if (current === 'sent') return 'received';
    if (current === 'received') return 'off_shelf';
    if (current === 'off_shelf') return 'returned';
    return null;
  };

  const handleAdvanceStatus = (notification: RecallNotification) => {
    const nextStatus = getNextStatus(notification.status);
    if (nextStatus) {
      updateNotificationStatus(notification.id, nextStatus);
    }
  };

  const getNextLabel = (status: RecallNotificationStatus): string => {
    const map: Record<RecallNotificationStatus, string> = {
      pending: '标记已发',
      sent: '标记已收',
      urged: '标记已收',
      received: '标记下架',
      off_shelf: '标记退回',
      returned: '已完成',
    };
    return map[status];
  };

  const renderItemBadge = (item: RecallNotification) => {
    if (item.urgeCount && item.urgeCount > 0) {
      return (
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-alert-danger border border-red-200">
          已催促{item.urgeCount > 1 ? ` ${item.urgeCount}次` : ''}
        </div>
      );
    }
    if (item.status === 'pending') {
      return (
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200">
          待发送
        </div>
      );
    }
    return null;
  };

  const canEditDisposal = (item: RecallNotification) => {
    return item.status === 'off_shelf' || item.status === 'returned';
  };

  const renderItemBody = (item: RecallNotification) => {
    const isExpanded = expandedCards.has(item.id);
    const canEdit = canEditDisposal(item);
    const form = disposalForms[item.id] || { disposalRemark: '', returnedQty: '', voucherNo: '' };
    const hasDisposalData = item.disposalRemark || item.returnedQty !== undefined || item.voucherNo;

    return (
      <div>
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            <p className="font-semibold text-gray-800 text-sm mb-1 pr-16">
              {item.recipientName}
            </p>
            <p className="text-xs text-gray-500 mb-1">
              {item.recipientType === 'dealer' ? '经销商' : '门店'}
              {' · '}
              涉及 {item.quantity} 件
            </p>
            <p className="text-xs text-gray-400 mb-1">{item.contact}</p>
            {hasDisposalData && !isExpanded && (
              <p className="text-xs text-indigo-600 flex items-center gap-1 mt-1">
                <FileCheck size={12} />
                已填写处置凭证
              </p>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleCardExpand(item.id);
            }}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            title={isExpanded ? '收起' : '展开处置凭证'}
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
            {canEdit ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    处置说明
                  </label>
                  <textarea
                    value={form.disposalRemark}
                    onChange={(e) => handleDisposalChange(item.id, 'disposalRemark', e.target.value)}
                    placeholder="请填写处置情况说明，如下架位置、现场处理方式等"
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100"
                    rows={2}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      退回数量
                    </label>
                    <input
                      type="number"
                      value={form.returnedQty}
                      onChange={(e) => handleDisposalChange(item.id, 'returnedQty', e.target.value)}
                      placeholder="件数"
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      凭证编号
                    </label>
                    <input
                      type="text"
                      value={form.voucherNo}
                      onChange={(e) => handleDisposalChange(item.id, 'voucherNo', e.target.value)}
                      placeholder="如入库单/退货单号"
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveDisposal(item.id);
                  }}
                  className="w-full flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-brand-600 text-white hover:bg-brand-700 transition-colors"
                >
                  <Save size={12} />
                  保存凭证
                </button>
              </>
            ) : (
              <div className="space-y-2 text-xs">
                <p className="text-gray-400">
                  完成下架或退回后可填写处置凭证
                </p>
                {item.disposalRemark && (
                  <div>
                    <span className="text-gray-500">处置说明：</span>
                    <span className="text-gray-700">{item.disposalRemark}</span>
                  </div>
                )}
                {item.returnedQty !== undefined && (
                  <div>
                    <span className="text-gray-500">退回数量：</span>
                    <span className="text-gray-700">{item.returnedQty} 件</span>
                  </div>
                )}
                {item.voucherNo && (
                  <div>
                    <span className="text-gray-500">凭证编号：</span>
                    <span className="text-gray-700">{item.voucherNo}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderItemActions = (item: RecallNotification) => {
    const nextStatus = getNextStatus(item.status);

    return (
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 items-center">
          <span className="flex-1 text-[11px] text-gray-400">
            {item.urgeCount && item.urgeCount > 0 && item.lastUrgedAt && (
              <span className="text-alert-warn mr-2">
                催促{formatDateTime(item.lastUrgedAt, 'MM-DD HH:mm')}
              </span>
            )}
            {item.status === 'sent' && item.sentAt && (
              <span>
                发送 {formatDateTime(item.sentAt, 'MM-DD HH:mm')}
              </span>
            )}
            {item.respondedAt && (
              <span>
                {item.status !== 'sent' ? ' · ' : ''}
                {formatDateTime(item.respondedAt, 'MM-DD HH:mm')}
              </span>
            )}
          </span>
          {nextStatus && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAdvanceStatus(item);
              }}
              className="px-2.5 py-1 text-xs font-medium rounded bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors"
            >
              {getNextLabel(item.status)}
            </button>
          )}
        </div>
        <div className="text-[10px] text-gray-400">
          当前状态：{NOTIFICATION_STATUS_LABEL[item.status]}
          {item.urgeCount && item.urgeCount > 0 ? ` · 已催促 ${item.urgeCount} 次` : ''}
        </div>
      </div>
    );
  };

  const timelineItems: TimelineItem[] = useMemo(() => {
    if (!recall) return [];
    const sortedEvents = [...(recall.timeline || [])].sort(
      (a, b) => a.time.localeCompare(b.time)
    );
    return sortedEvents.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      time: formatDateTime(event.time),
      status: 'completed',
      color: timelineColorMap[event.type] || 'default',
    }));
  }, [recall]);

  if (!recall) {
    return (
      <div className="page-container">
        <div className="p-16 text-center text-gray-400">
          <AlertTriangle size={48} className="mx-auto mb-3 opacity-40" />
          <p>暂无召回事件数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <button
            className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            onClick={() => navigate('/recalls')}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="page-title">召回详情</h1>
              <RecallLevelTag level={recall.level} />
              <RecallStatusTag status={recall.status} />
              {stats && stats.riskScore >= 40 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded bg-red-50 text-red-600 border border-red-200">
                  <AlertTriangle size={12} />
                  高风险
                </span>
              )}
            </div>
            <p className="page-subtitle">召回单号：{recall.recallNo}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon={<Download size={16} />}
            loading={exporting}
            onClick={handleExport}
          >
            导出报告
          </Button>
          <Button
            variant="warn"
            icon={<Bell size={16} />}
            loading={urging}
            onClick={handleUrge}
          >
            自动催促
            {stats && stats.urged > 0 ? ` (${stats.urged})` : ''}
          </Button>
          <Button
            variant="primary"
            icon={<Send size={16} />}
            loading={sending}
            onClick={handleSendNotifications}
          >
            {pendingCount > 0 ? `一键发送通知 (${pendingCount})` : '重新发送通知'}
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 rounded-lg bg-brand-50 border border-brand-200 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
            <Check size={18} className="text-brand-700" />
          </div>
          <span className="font-medium text-brand-800">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 rounded-lg bg-alert-danger-50 border border-alert-danger-200 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-alert-danger-100 flex items-center justify-center">
            <AlertTriangle size={18} className="text-alert-danger-700" />
          </div>
          <span className="font-medium text-alert-danger-800">{errorMsg}</span>
        </div>
      )}

      <Card padding="none" className="mb-6">
        <CardBody className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Package size={14} />
                    <span>关联批次</span>
                  </div>
                  <p className="font-semibold text-gray-800">{recall.batchNo}</p>
                  <p className="text-sm text-gray-600">{recall.productName}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <User size={14} />
                    <span>发起人</span>
                  </div>
                  <p className="font-semibold text-gray-800">{recall.initiator || '-'}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar size={14} />
                    <span>发起时间</span>
                  </div>
                  <p className="font-semibold text-gray-800">{formatDateTime(recall.createdAt)}</p>
                </div>
                {stats && (
                  <>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <AlertTriangle size={14} />
                        <span>风险评分</span>
                      </div>
                      <p className={clsx(
                        'font-semibold',
                        stats.riskScore >= 40 ? 'text-alert-danger' : stats.riskScore >= 20 ? 'text-alert-warn' : 'text-gray-800'
                      )}>
                        {stats.riskScore} 分
                      </p>
                      <p className="text-xs text-gray-500">
                        逾期 {stats.overdueDays} 天 · 累计催促 {stats.totalUrgeCount} 次
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1.5">
                    <FileText size={14} />
                    <span>召回原因</span>
                  </div>
                  <p className="text-gray-800 leading-relaxed bg-gray-50 rounded-lg p-4">
                    {recall.reason}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1.5">
                    <AlertTriangle size={14} />
                    <span>召回范围</span>
                  </div>
                  <p className="text-gray-800 leading-relaxed bg-gray-50 rounded-lg p-4">
                    {recall.scope}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l border-gray-100 pt-6 lg:pt-0 lg:pl-6">
              {stats && (
                <>
                  <RingProgress
                    value={stats.completionRate}
                    size={180}
                    strokeWidth={16}
                    label="召回完成率"
                    subLabel={`${stats.returned}/${stats.total} 已退回`}
                  />
                  <div className="grid grid-cols-2 gap-3 mt-6 w-full">
                    <div className="text-center p-2 rounded-lg bg-gray-50">
                      <p className="text-2xl font-bold text-gray-700">{stats.pending}</p>
                      <p className="text-xs text-gray-500">待发送</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-blue-50">
                      <p className="text-2xl font-bold text-blue-700">{stats.sent}</p>
                      <p className="text-xs text-blue-600">已发送</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-indigo-50">
                      <p className="text-2xl font-bold text-indigo-700">{stats.received}</p>
                      <p className="text-xs text-indigo-600">已收到</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-amber-50">
                      <p className="text-2xl font-bold text-amber-700">{stats.offShelf}</p>
                      <p className="text-xs text-amber-600">已下架</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-brand-50 col-span-2">
                      <p className="text-2xl font-bold text-brand-700">{stats.returned}</p>
                      <p className="text-xs text-brand-600">已退回</p>
                    </div>
                  </div>
                  {stats.urged > 0 && (
                    <div className="mt-3 w-full text-center p-2 rounded-lg bg-orange-50">
                      <p className="text-sm font-medium text-orange-700">
                        已催促 {stats.urged} 个 · 累计 {stats.totalUrgeCount} 次
                      </p>
                    </div>
                  )}
                  {stats.unresponsive > 0 && (
                    <div className="mt-3 w-full text-center p-2 rounded-lg bg-red-50">
                      <p className="text-sm font-medium text-alert-danger">
                        未响应/待退回 {stats.unresponsive} 个
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {recalls.length > 1 && (
        <Card padding="md" className="mb-6">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-thin pb-1">
            <span className="text-sm text-gray-500 flex-shrink-0">切换召回事件：</span>
            {recalls.map((r) => (
              <button
                key={r.id}
                onClick={() => setRecallId(r.id)}
                className={clsx(
                  'flex-shrink-0 px-3 py-1.5 rounded-md text-sm font-medium transition-all border-2',
                  r.id === (recallId || recall.id)
                    ? 'bg-brand-700 text-white border-brand-700'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                )}
              >
                {r.recallNo}
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <Card padding="none" className="xl:col-span-1">
          <CardHeader divider className="px-6 pt-4 pb-4">
            <CardTitle icon={<History size={18} />}>
              召回事件时间线
            </CardTitle>
          </CardHeader>
          <CardBody className="p-6">
            {timelineItems.length === 0 ? (
              <div className="py-8 text-center text-gray-400">
                <Clock size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">暂无时间记录</p>
              </div>
            ) : (
              <div className="max-h-[480px] overflow-y-auto pr-2 scrollbar-thin">
                <Timeline items={timelineItems} />
              </div>
            )}
          </CardBody>
        </Card>

        <Card padding="none" className="xl:col-span-2">
          <CardHeader divider className="px-6 pt-4 pb-4">
            <div className="flex items-center justify-between w-full flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <CardTitle icon={<RefreshCw size={18} />}>
                  下游流向响应追踪
                </CardTitle>
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={clsx(
                      'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                      viewMode === 'kanban'
                        ? 'bg-white text-gray-800 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    看板视图
                  </button>
                  <button
                    onClick={() => setViewMode('ledger')}
                    className={clsx(
                      'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                      viewMode === 'ledger'
                        ? 'bg-white text-gray-800 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    处置台账
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs flex-wrap">
                <div className="flex items-center gap-1.5">
                  <NotificationStatusTag status="pending" size={12} />
                </div>
                <div className="flex items-center gap-1.5">
                  <NotificationStatusTag status="sent" size={12} />
                </div>
                <div className="flex items-center gap-1.5">
                  <NotificationStatusTag status="received" size={12} />
                </div>
                <div className="flex items-center gap-1.5">
                  <NotificationStatusTag status="off_shelf" size={12} />
                </div>
                <div className="flex items-center gap-1.5">
                  <NotificationStatusTag status="returned" size={12} />
                </div>
                <div className="flex items-center gap-1.5 ml-2 pl-3 border-l border-gray-200">
                  <span className="w-3 h-3 rounded bg-red-100 border border-red-200"></span>
                  <span className="text-gray-500">已催促</span>
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {viewMode === 'kanban'
                ? '卡片右上角红色角标表示已催促（不影响当前状态），点击卡片右下角 ▾ 按钮可展开查看/填写处置凭证'
                : '按经销商/门店汇总展示，红色标记表示凭证缺失或数量不一致，需要跟进'}
            </p>
          </CardHeader>
          <CardBody className="p-0">
            {viewMode === 'ledger' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-gray-600">
                      <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">接收方</th>
                      <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">联系人</th>
                      <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider text-right">应召回</th>
                      <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider text-right">已下架</th>
                      <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider text-right">已退回</th>
                      <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider text-center">凭证状态</th>
                      <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider text-center">数量对齐</th>
                      <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">最后更新</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {disposalSummary.map((item) => {
                      const notification = recall.notifications.find((n) => n.id === item.notificationId);
                      return (
                        <tr key={item.recipientId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className={clsx(
                                'px-2 py-0.5 text-[10px] rounded',
                                item.recipientType === 'dealer' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'
                              )}>
                                {item.recipientType === 'dealer' ? '经销商' : '门店'}
                              </span>
                              <span className="font-medium text-gray-800">{item.recipientName}</span>
                              {notification && notification.urgeCount && notification.urgeCount > 0 && (
                                <span className="px-1.5 py-0.5 text-[10px] bg-red-100 text-red-700 rounded">
                                  已催促 {notification.urgeCount} 次
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{item.contact}</td>
                          <td className="px-6 py-4 text-right font-medium text-gray-800">{item.totalQty} 件</td>
                          <td className="px-6 py-4 text-right">
                            <span className={clsx(
                              'font-medium',
                              item.offShelfQty > 0 ? 'text-amber-700' : 'text-gray-400'
                            )}>
                              {item.offShelfQty || 0} 件
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={clsx(
                              'font-medium',
                              item.returnedQty > 0 ? 'text-brand-700' : 'text-gray-400'
                            )}>
                              {item.returnedQty || 0} 件
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {item.voucherStatus === 'complete' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-[11px] bg-green-100 text-green-700 rounded">
                                <Check size={12} /> 凭证齐全
                              </span>
                            ) : item.voucherStatus === 'partial' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-[11px] bg-amber-100 text-amber-700 rounded">
                                <AlertTriangle size={12} /> 部分填写
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-[11px] bg-gray-100 text-gray-500 rounded">
                                <Clock size={12} /> 未填写
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {item.hasDiscrepancy ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-[11px] bg-red-100 text-red-700 rounded">
                                <AlertTriangle size={12} /> 不一致
                              </span>
                            ) : item.returnedQty > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-[11px] bg-green-100 text-green-700 rounded">
                                <Check size={12} /> 对齐
                              </span>
                            ) : (
                              <span className="text-gray-400 text-[11px]">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-xs">
                            {formatDateTime(item.lastUpdatedAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : recall.notifications.length === 0 ? (
              <div className="p-16 text-center text-gray-400">
                <Package size={48} className="mx-auto mb-3 opacity-40" />
                <p>暂无下游流向数据</p>
              </div>
            ) : (
              <div className="p-6">
                <Kanban
                  columns={kanbanColumns}
                  renderItemBody={renderItemBody}
                  renderItemActions={renderItemActions}
                  renderItemBadge={renderItemBadge}
                />
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
