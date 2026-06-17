import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Recall,
  RecallStats,
  RecallNotification,
  RecallNotificationStatus,
  RecallStatus,
  RecallFilterParams,
  RecallTimelineEvent,
} from '@/types/recall';
import { generateId, generateRecallNo } from '@/utils/idGenerator';
import { now, diffDays } from '@/utils/date';
import { seedRecalls } from '@/mock/seedRecalls';
import { useBatchStore } from './batchStore';
import { useShipmentStore } from './shipmentStore';
import { useBaseStore } from './baseStore';

interface RecallStore {
  recalls: Recall[];
  initialized: boolean;
  initRecalls: () => void;
  createRecall: (data: Partial<Recall>) => Recall;
  listRecalls: (params?: RecallFilterParams) => Recall[];
  getRecall: (id: string) => Recall | undefined;
  queryDownstream: (batchId: string) => RecallNotification[];
  sendNotifications: (recallId: string) => Promise<{ success: number; failed: number }>;
  updateNotificationStatus: (
    notificationId: string,
    status: RecallNotificationStatus,
    respondedAt?: string
  ) => void;
  updateNotificationDisposal: (
    notificationId: string,
    data: Partial<Pick<RecallNotification, 'disposalRemark' | 'returnedQty' | 'voucherNo'>>
  ) => void;
  urgeRecipients: (recallId: string) => string[];
  getRecallStats: (recallId: string) => RecallStats;
  updateRecallStatus: (id: string, status: RecallStatus) => void;
}

const ensureDependenciesInitialized = () => {
  useShipmentStore.getState().initShipments();
  useBaseStore.getState().initBase();
};

const buildTimelineEvent = (
  type: RecallTimelineEvent['type'],
  title: string,
  description?: string,
  operator?: string,
  relatedId?: string
): RecallTimelineEvent => ({
  id: generateId('tl_'),
  type,
  title,
  description,
  time: now(),
  operator,
  relatedId,
});

const appendTimeline = (recall: Recall, events: RecallTimelineEvent[]): Recall => ({
  ...recall,
  timeline: [...(recall.timeline || []), ...events],
});

const mockSendNotification = async (notifications: RecallNotification[]) => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  const success = notifications.map((n) => n.id);
  return { success, failed: [] };
};

const calculateRiskScore = (recall: Recall, stats: RecallStats): number => {
  let score = 0;
  const daysPassed = diffDays(now(), recall.createdAt);
  score += stats.totalUrgeCount * 25;
  score += stats.overdueDays * 8;
  score += Math.max(0, (100 - stats.completionRate) * 2);
  if (recall.level === 'level1') score += 50;
  if (recall.level === 'level2') score += 25;
  return Math.round(score);
};

const isHighRisk = (recall: Recall, stats: RecallStats): boolean => {
  return stats.riskScore >= 40 || stats.totalUrgeCount >= 2 || stats.overdueDays >= 3 || stats.completionRate < 50;
};

export const useRecallStore = create<RecallStore>()(
  persist(
    (set, get) => ({
      recalls: [],
      initialized: false,

      initRecalls: () => {
        const state = get();
        if (!state.initialized || state.recalls.length === 0) {
          const migrated = seedRecalls.map((r) => ({
            ...r,
            timeline: r.timeline && r.timeline.length > 0
              ? r.timeline
              : [
                  buildTimelineEvent('created', '创建召回单', `${r.recallNo} - ${r.reason}`, r.initiator),
                ],
            notifications: r.notifications.map((n) => ({
              ...n,
              urgeCount: n.urgeCount ?? 0,
              lastUrgedAt: n.lastUrgedAt,
              disposalRemark: n.disposalRemark,
              returnedQty: n.returnedQty,
              voucherNo: n.voucherNo,
            })),
          }));
          set({ recalls: migrated, initialized: true });
        }
      },

      createRecall: (data) => {
        ensureDependenciesInitialized();
        const batch = useBatchStore.getState().getBatch(data.batchId || '');
        const notifications = data.batchId
          ? get().queryDownstream(data.batchId)
          : [];

        const newRecall: Recall = {
          id: generateId('recall_'),
          recallNo: data.recallNo || generateRecallNo(),
          batchId: data.batchId || '',
          batchNo: data.batchNo || batch?.batchNo || '',
          productName: data.productName || batch?.productName || '',
          reason: data.reason || '',
          level: data.level || 'level2',
          scope: data.scope || '',
          createdAt: now(),
          initiator: data.initiator || '',
          status: data.status || 'pending',
          notifications: notifications.map((n) => ({ ...n, recallId: '', urgeCount: 0 })),
          timeline: [],
        };

        newRecall.timeline.push(
          buildTimelineEvent(
            'created',
            '创建召回单',
            `批次 ${newRecall.batchNo} - ${newRecall.reason}（下游 ${notifications.length} 个接收方）`,
            newRecall.initiator
          )
        );

        if (batch) {
          useBatchStore.getState().updateBatchStatus(batch.id, 'recalling');
        }

        set({ recalls: [...get().recalls, newRecall] });
        return newRecall;
      },

      listRecalls: (params) => {
        let result = [...get().recalls];

        if (params?.keyword) {
          const kw = params.keyword.toLowerCase();
          result = result.filter(
            (r) =>
              r.recallNo.toLowerCase().includes(kw) ||
              r.batchNo.toLowerCase().includes(kw) ||
              r.productName.toLowerCase().includes(kw) ||
              r.reason.toLowerCase().includes(kw)
          );
        }

        if (params?.status) {
          result = result.filter((r) => r.status === params.status);
        }

        if (params?.level) {
          result = result.filter((r) => r.level === params.level);
        }

        if (params?.startDate) {
          result = result.filter((r) => r.createdAt >= params.startDate!);
        }

        if (params?.endDate) {
          result = result.filter((r) => r.createdAt <= params.endDate!);
        }

        if (typeof params?.minCompletionRate === 'number') {
          result = result.filter((r) => {
            const stats = get().getRecallStats(r.id);
            return stats.completionRate >= params.minCompletionRate!;
          });
        }

        if (typeof params?.maxCompletionRate === 'number') {
          result = result.filter((r) => {
            const stats = get().getRecallStats(r.id);
            return stats.completionRate <= params.maxCompletionRate!;
          });
        }

        if (typeof params?.hasUnresponsive === 'boolean') {
          result = result.filter((r) => {
            const stats = get().getRecallStats(r.id);
            return params.hasUnresponsive ? stats.unresponsive > 0 : stats.unresponsive === 0;
          });
        }

        if (params?.highRiskOnly) {
          result = result.filter((r) => {
            const stats = get().getRecallStats(r.id);
            return isHighRisk(r, stats);
          });
        }

        if (params?.sortByRisk) {
          result.sort((a, b) => {
            const statsA = get().getRecallStats(a.id);
            const statsB = get().getRecallStats(b.id);
            return statsB.riskScore - statsA.riskScore;
          });
        } else {
          result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        }

        return result;
      },

      getRecall: (id) => get().recalls.find((r) => r.id === id),

      queryDownstream: (batchId) => {
        ensureDependenciesInitialized();
        const shipments = useShipmentStore.getState().getShipmentsByBatch(batchId);
        const { getDealerById, getStoreById } = useBaseStore.getState();
        const notifications: RecallNotification[] = [];

        shipments.forEach((shipment) => {
          const dealer = getDealerById(shipment.dealerId);
          if (dealer) {
            notifications.push({
              id: generateId('notif_'),
              recallId: '',
              recipientType: 'dealer',
              recipientId: dealer.id,
              recipientName: dealer.name,
              contact: `${dealer.contact} ${dealer.phone}`,
              status: 'pending',
              quantity: shipment.quantity,
              urgeCount: 0,
            });
          }

          shipment.storeIds.forEach((storeId, idx) => {
            const store = getStoreById(storeId);
            if (store) {
              const storeQty =
                shipment.storeIds.length > 1
                  ? Math.floor(shipment.quantity / shipment.storeIds.length)
                  : shipment.quantity;
              notifications.push({
                id: generateId('notif_'),
                recallId: '',
                recipientType: 'store',
                recipientId: store.id,
                recipientName: shipment.storeNames[idx] || store.name,
                contact: `${store.contact} ${store.phone}`,
                status: 'pending',
                quantity: storeQty,
                urgeCount: 0,
              });
            }
          });
        });

        const seen = new Map<string, RecallNotification>();
        notifications.forEach((n) => {
          const key = `${n.recipientType}-${n.recipientId}`;
          if (seen.has(key)) {
            const existing = seen.get(key)!;
            existing.quantity += n.quantity;
          } else {
            seen.set(key, { ...n });
          }
        });

        return Array.from(seen.values());
      },

      sendNotifications: async (recallId) => {
        const recall = get().getRecall(recallId);
        if (!recall) return { success: 0, failed: 0 };

        const pendingNotifs = recall.notifications.filter(
          (n) => n.status === 'pending'
        );

        set({
          recalls: get().recalls.map((r) =>
            r.id === recallId ? { ...r, status: 'notifying' } : r
          ),
        });

        const result = await mockSendNotification(pendingNotifs);
        const sentAt = now();
        const successNames = result.success
          .map((id) => recall.notifications.find((n) => n.id === id)?.recipientName)
          .filter(Boolean) as string[];

        const event = buildTimelineEvent(
          'notification_sent',
          `通知发送完成（成功 ${result.success.length} 条，失败 ${result.failed.length} 条）`,
          successNames.length > 0 ? `已送达：${successNames.slice(0, 5).join('、')}${successNames.length > 5 ? ' 等' : ''}` : undefined,
          '系统'
        );

        set({
          recalls: get().recalls.map((r) => {
            if (r.id !== recallId) return r;
            const updatedNotifications = r.notifications.map((n) =>
              result.success.includes(n.id)
                ? { ...n, status: 'sent' as const, sentAt, urgeCount: n.urgeCount ?? 0 }
                : n
            );
            return appendTimeline(
              { ...r, status: 'in_progress', notifications: updatedNotifications },
              [event]
            );
          }),
        });

        return {
          success: result.success.length,
          failed: result.failed.length,
        };
      },

      updateNotificationStatus: (notificationId, status, respondedAt) => {
        const timestamp = respondedAt || now();

        let changedRecallId: string | undefined;
        let changedNotif: RecallNotification | undefined;
        let eventType: RecallTimelineEvent['type'] = 'status_changed';
        let eventTitle = '';

        const statusTitleMap: Record<RecallNotificationStatus, { type: RecallTimelineEvent['type']; label: string }> = {
          pending: { type: 'status_changed', label: '状态重置为待发送' },
          sent: { type: 'notification_sent', label: '通知已发送' },
          received: { type: 'notification_received', label: '接收方已确认收到通知' },
          off_shelf: { type: 'off_shelf', label: '产品已完成下架' },
          returned: { type: 'returned', label: '产品已退回至仓库' },
          urged: { type: 'urged', label: '已发送催促提醒' },
        };

        set({
          recalls: get().recalls.map((r) => {
            const matched = r.notifications.find((n) => n.id === notificationId);
            if (!matched) return r;

            changedRecallId = r.id;
            changedNotif = { ...matched, status, respondedAt: timestamp };
            const map = statusTitleMap[status];
            eventType = map.type;
            eventTitle = `${matched.recipientName}：${map.label}`;

            const updatedNotifications = r.notifications.map((n) =>
              n.id === notificationId
                ? {
                    ...n,
                    status,
                    respondedAt: timestamp,
                  }
                : n
            );

            const event = buildTimelineEvent(
              eventType,
              eventTitle,
              matched.recipientType === 'dealer' ? '经销商' : '终端门店',
              undefined,
              matched.id
            );

            return appendTimeline({ ...r, notifications: updatedNotifications }, [event]);
          }),
        });

        setTimeout(() => {
          if (!changedRecallId) return;
          const stats = get().getRecallStats(changedRecallId);
          if (stats.total > 0 && stats.returned === stats.total) {
            const completeEvent = buildTimelineEvent(
              'status_changed',
              '召回事件完成',
              `全部 ${stats.total} 个接收方已完成产品退回`,
              '系统'
            );
            set({
              recalls: get().recalls.map((r) =>
                r.id === changedRecallId
                  ? appendTimeline({ ...r, status: 'completed' }, [completeEvent])
                  : r
              ),
            });
          }
        }, 100);
      },

      updateNotificationDisposal: (notificationId, data) => {
        set({
          recalls: get().recalls.map((r) => {
            const matched = r.notifications.find((n) => n.id === notificationId);
            if (!matched) return r;

            const updatedNotifications = r.notifications.map((n) =>
              n.id === notificationId ? { ...n, ...data } : n
            );

            const fields: string[] = [];
            if (data.disposalRemark !== undefined) fields.push('处置说明');
            if (data.returnedQty !== undefined) fields.push(`退回数量 ${data.returnedQty}`);
            if (data.voucherNo !== undefined) fields.push(`凭证号 ${data.voucherNo}`);

            const event = buildTimelineEvent(
              'status_changed',
              `${matched.recipientName}：更新处置凭证`,
              fields.length > 0 ? `已更新：${fields.join('、')}` : undefined,
              undefined,
              matched.id
            );

            return appendTimeline({ ...r, notifications: updatedNotifications }, [event]);
          }),
        });
      },

      urgeRecipients: (recallId) => {
        const recall = get().getRecall(recallId);
        if (!recall) return [];

        const unresponsiveIds: string[] = [];
        const urgedAt = now();
        const urgedNames: string[] = [];

        set({
          recalls: get().recalls.map((r) => {
            if (r.id !== recallId) return r;
            const updatedNotifications = r.notifications.map((n) => {
              const isUnresponsive =
                n.status === 'sent' || n.status === 'received';
              if (isUnresponsive) {
                unresponsiveIds.push(n.id);
                urgedNames.push(n.recipientName);
                const currentCount = n.urgeCount ?? 0;
                return {
                  ...n,
                  urgeCount: currentCount + 1,
                  lastUrgedAt: urgedAt,
                  urgedAt: n.urgedAt || urgedAt,
                };
              }
              return n;
            });

            if (unresponsiveIds.length === 0) return r;

            const event = buildTimelineEvent(
              'urged',
              `已催促 ${unresponsiveIds.length} 个未及时响应的接收方`,
              urgedNames.length > 0
                ? `催促对象：${urgedNames.slice(0, 5).join('、')}${urgedNames.length > 5 ? ' 等' : ''}`
                : undefined,
              '系统'
            );

            return appendTimeline(
              { ...r, notifications: updatedNotifications },
              [event]
            );
          }),
        });

        return unresponsiveIds;
      },

      getRecallStats: (recallId) => {
        const recall = get().getRecall(recallId);
        if (!recall) {
          return {
            total: 0, sent: 0, received: 0, offShelf: 0, returned: 0,
            urged: 0, pending: 0, unresponsive: 0, completionRate: 0,
            totalUrgeCount: 0, overdueDays: 0, riskScore: 0,
          };
        }

        const total = recall.notifications.length;
        let pending = 0, sent = 0, received = 0, offShelf = 0, returned = 0, urged = 0;
        let totalUrgeCount = 0;

        recall.notifications.forEach((n) => {
          if (n.urgeCount && n.urgeCount > 0) urged++;
          totalUrgeCount += n.urgeCount ?? 0;
          if (n.status === 'pending') pending++;
          else if (n.status === 'sent') sent++;
          else if (n.status === 'received') received++;
          else if (n.status === 'off_shelf') offShelf++;
          else if (n.status === 'returned') returned++;
        });

        const unresponsive = sent + received;
        const completionRate = total > 0 ? Math.round((returned / total) * 100) : 0;
        const overdueDays = Math.max(0, diffDays(now(), recall.createdAt) - 2);

        const stats: RecallStats = {
          total, sent, received, offShelf, returned, urged, pending,
          unresponsive, completionRate, totalUrgeCount, overdueDays, riskScore: 0,
        };

        stats.riskScore = calculateRiskScore(recall, stats);
        return stats;
      },

      updateRecallStatus: (id, status) => {
        set({
          recalls: get().recalls.map((r) => (r.id === id ? { ...r, status } : r)),
        });
      },
    }),
    {
      name: 'food-trace-recalls',
    }
  )
);
