import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Recall,
  RecallFilterParams,
  RecallNotification,
  RecallNotificationStatus,
  RecallStats,
  RecallStatus,
} from '@/types/recall';
import type { Dealer, Store } from '@/types/master';
import { generateId, generateRecallNo } from '@/utils/idGenerator';
import { now } from '@/utils/date';
import { seedRecalls } from '@/mock/seedRecalls';
import { useShipmentStore } from './shipmentStore';
import { useBatchStore } from './batchStore';
import { useBaseStore } from './baseStore';
import { mockSendNotification } from '@/utils/notification';

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
  urgeRecipients: (recallId: string) => string[];
  getRecallStats: (recallId: string) => RecallStats;
  updateRecallStatus: (id: string, status: RecallStatus) => void;
}

export const useRecallStore = create<RecallStore>()(
  persist(
    (set, get) => ({
      recalls: [],
      initialized: false,

      initRecalls: () => {
        if (!get().initialized) {
          set({ recalls: seedRecalls, initialized: true });
        }
      },

      createRecall: (data) => {
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
          notifications,
        };

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

        return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      },

      getRecall: (id) => get().recalls.find((r) => r.id === id),

      queryDownstream: (batchId) => {
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
              sentAt: undefined,
              respondedAt: undefined,
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
                recipientName:
                  shipment.storeNames[idx] || store.name,
                contact: `${store.contact} ${store.phone}`,
                status: 'pending',
                quantity: storeQty,
                sentAt: undefined,
                respondedAt: undefined,
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
          (n) => n.status === 'pending' || n.status === 'urged'
        );

        set({
          recalls: get().recalls.map((r) =>
            r.id === recallId ? { ...r, status: 'notifying' } : r
          ),
        });

        const result = await mockSendNotification(pendingNotifs);
        const sentAt = now();

        set({
          recalls: get().recalls.map((r) => {
            if (r.id !== recallId) return r;
            return {
              ...r,
              status: 'in_progress',
              notifications: r.notifications.map((n) =>
                result.success.includes(n.id)
                  ? { ...n, status: 'sent' as const, sentAt }
                  : n
              ),
            };
          }),
        });

        return {
          success: result.success.length,
          failed: result.failed.length,
        };
      },

      updateNotificationStatus: (notificationId, status, respondedAt) => {
        set({
          recalls: get().recalls.map((r) => ({
            ...r,
            notifications: r.notifications.map((n) =>
              n.id === notificationId
                ? {
                    ...n,
                    status,
                    respondedAt: respondedAt || n.respondedAt || now(),
                  }
                : n
            ),
          })),
        });

        setTimeout(() => {
          const currentRecall = get()
            .recalls.flatMap((r) => r.notifications)
            .find((n) => n.id === notificationId);
          if (currentRecall) {
            get().recalls.forEach((r) => {
              const stats = get().getRecallStats(r.id);
              if (stats.total > 0 && stats.returned === stats.total) {
                set({
                  recalls: get().recalls.map((rec) =>
                    rec.id === r.id ? { ...rec, status: 'completed' } : rec
                  ),
                });
              }
            });
          }
        }, 100);
      },

      urgeRecipients: (recallId) => {
        const recall = get().getRecall(recallId);
        if (!recall) return [];

        const unresponsiveIds: string[] = [];
        const sentTime = now();

        set({
          recalls: get().recalls.map((r) => {
            if (r.id !== recallId) return r;
            return {
              ...r,
              notifications: r.notifications.map((n) => {
                const isUnresponsive =
                  n.status === 'sent' || n.status === 'received';
                if (isUnresponsive) {
                  unresponsiveIds.push(n.id);
                  return { ...n, status: 'urged' as const, sentAt: sentTime };
                }
                return n;
              }),
            };
          }),
        });

        return unresponsiveIds;
      },

      getRecallStats: (recallId) => {
        const recall = get().getRecall(recallId);
        const total = recall?.notifications.length || 0;
        const countBy = (status: RecallNotificationStatus) =>
          recall?.notifications.filter((n) => n.status === status).length || 0;

        const sent = countBy('sent');
        const received = countBy('received');
        const offShelf = countBy('off_shelf');
        const returned = countBy('returned');
        const urged = countBy('urged');
        const pending = countBy('pending');

        const completedCount = returned;
        const completionRate = total > 0 ? (completedCount / total) * 100 : 0;

        return {
          total,
          sent,
          received,
          offShelf,
          returned,
          urged,
          pending,
          completionRate,
        };
      },

      updateRecallStatus: (id, status) => {
        set({
          recalls: get().recalls.map((r) =>
            r.id === id ? { ...r, status } : r
          ),
        });
      },
    }),
    {
      name: 'food-trace-recalls',
    }
  )
);
