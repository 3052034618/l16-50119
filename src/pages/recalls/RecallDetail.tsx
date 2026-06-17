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
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RingProgress } from '@/components/RingProgress';
import { Kanban, KanbanColumn } from '@/components/Kanban';
import { RecallLevelTag, RecallStatusTag, NotificationStatusTag } from '@/components/ui/StatusTag';
import { useRecallStore } from '@/store/recallStore';
import type { Recall, RecallNotification, RecallNotificationStatus } from '@/types/recall';
import { formatDateTime } from '@/utils/date';
import { exportRecallReport } from '@/utils/export';
import { clsx } from 'clsx';

export default function RecallDetail() {
  const { id: urlId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    recalls,
    initRecalls,
    getRecall,
    getRecallStats,
    sendNotifications,
    urgeRecipients,
    updateNotificationStatus,
  } = useRecallStore();

  const [recallId, setRecallId] = useState<string>(urlId || '');
  const [sending, setSending] = useState(false);
  const [urging, setUrging] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

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

  const kanbanColumns: KanbanColumn[] = useMemo(() => {
    if (!recall) return [];

    const filterByStatus = (statuses: RecallNotificationStatus[]) =>
      recall.notifications.filter((n) => statuses.includes(n.status));

    return [
      {
        key: 'sent',
        title: '已发送',
        color: 'bg-blue-500',
        bgColor: 'bg-blue-50',
        items: filterByStatus(['sent', 'urged']),
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
      (n) => n.status === 'pending' || n.status === 'urged'
    ).length;
  }, [recall]);

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
      setSuccessMsg(`已催促 ${urgedIds.length} 个未及时响应的接收方`);
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
      exportRecallReport(recall, stats);
      setSuccessMsg('召回报告导出成功');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error('导出失败:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleAdvanceStatus = (notification: RecallNotification) => {
    const statusFlow: RecallNotificationStatus[] = [
      'pending',
      'sent',
      'received',
      'off_shelf',
      'returned',
    ];
    const currentIndex = statusFlow.indexOf(notification.status);
    if (currentIndex < statusFlow.length - 1) {
      const nextStatus = statusFlow[currentIndex + 1];
      updateNotificationStatus(notification.id, nextStatus);
    }
  };

  const renderItemActions = (item: RecallNotification) => {
    const statusFlow: RecallNotificationStatus[] = [
      'pending',
      'sent',
      'received',
      'off_shelf',
      'returned',
    ];
    const currentIndex = statusFlow.indexOf(item.status);
    const canAdvance = currentIndex < statusFlow.length - 1;
    const nextLabels: Record<string, string> = {
      pending: '标记已发',
      sent: '标记已收',
      received: '标记下架',
      off_shelf: '标记退回',
      urged: '标记已收',
    };

    return (
      <div className="flex gap-2">
        {canAdvance && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAdvanceStatus(item);
            }}
            className="flex-1 px-2 py-1 text-xs font-medium rounded bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors"
          >
            {nextLabels[item.status] || '推进状态'}
          </button>
        )}
      </div>
    );
  };

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
                    <div className="text-center p-2 rounded-lg bg-brand-50">
                      <p className="text-2xl font-bold text-brand-700">{stats.returned}</p>
                      <p className="text-xs text-brand-600">已退回</p>
                    </div>
                  </div>
                  {stats.urged > 0 && (
                    <div className="mt-3 w-full text-center p-2 rounded-lg bg-red-50">
                      <p className="text-sm font-medium text-alert-danger">
                        已催促 {stats.urged} 个接收方
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

      <Card padding="none">
        <CardHeader divider className="px-6 pt-4 pb-4">
          <div className="flex items-center justify-between w-full">
            <CardTitle icon={<RefreshCw size={18} />}>
              下游流向响应追踪
            </CardTitle>
            <div className="flex items-center gap-4 text-xs">
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
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-6">
          {recall.notifications.length === 0 ? (
            <div className="p-16 text-center text-gray-400">
              <Package size={48} className="mx-auto mb-3 opacity-40" />
              <p>暂无下游流向数据</p>
            </div>
          ) : (
            <Kanban
              columns={kanbanColumns}
              renderItemActions={renderItemActions}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
