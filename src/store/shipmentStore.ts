import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Shipment, ShipmentFilterParams, ShipmentStatus } from '@/types/shipment';
import { generateId } from '@/utils/idGenerator';
import { now } from '@/utils/date';
import { seedShipments } from '@/mock/seedShipments';
import { useBatchStore } from './batchStore';

interface ShipmentStore {
  shipments: Shipment[];
  initialized: boolean;
  initShipments: () => void;
  createShipment: (data: Partial<Shipment>) => Shipment;
  listShipments: (params?: ShipmentFilterParams) => Shipment[];
  getShipmentsByBatch: (batchId: string) => Shipment[];
  updateShipmentStatus: (id: string, status: ShipmentStatus) => void;
}

export const useShipmentStore = create<ShipmentStore>()(
  persist(
    (set, get) => ({
      shipments: [],
      initialized: false,

      initShipments: () => {
        if (!get().initialized) {
          set({ shipments: seedShipments, initialized: true });
        }
      },

      createShipment: (data) => {
        const { updateBatchRemainingQty, getBatch } = useBatchStore.getState();
        const batch = getBatch(data.batchId || '');

        const newShipment: Shipment = {
          id: generateId('ship_'),
          batchId: data.batchId || '',
          batchNo: data.batchNo || batch?.batchNo || '',
          dealerId: data.dealerId || '',
          dealerName: data.dealerName || '',
          storeIds: data.storeIds || [],
          storeNames: data.storeNames || [],
          quantity: data.quantity || 0,
          shipmentDate: data.shipmentDate || new Date().toISOString().split('T')[0],
          trackingNo: data.trackingNo || '',
          status: data.status || 'transit',
          remark: data.remark,
        };

        if (batch && newShipment.quantity > 0) {
          updateBatchRemainingQty(batch.id, newShipment.quantity);
          const updatedBatch = useBatchStore.getState().getBatch(batch.id);
          if (updatedBatch && updatedBatch.remainingQty <= 0) {
            useBatchStore.getState().updateBatchStatus(batch.id, 'shipped');
          }
        }

        set({ shipments: [...get().shipments, newShipment], createdAt: now() } as Partial<ShipmentStore>);
        return newShipment;
      },

      listShipments: (params) => {
        let result = [...get().shipments];

        if (params?.keyword) {
          const kw = params.keyword.toLowerCase();
          result = result.filter(
            (s) =>
              s.batchNo.toLowerCase().includes(kw) ||
              s.dealerName.toLowerCase().includes(kw) ||
              s.trackingNo.toLowerCase().includes(kw) ||
              s.storeNames.some((n) => n.toLowerCase().includes(kw))
          );
        }

        if (params?.batchId) {
          result = result.filter((s) => s.batchId === params.batchId);
        }

        if (params?.dealerId) {
          result = result.filter((s) => s.dealerId === params.dealerId);
        }

        if (params?.status) {
          result = result.filter((s) => s.status === params.status);
        }

        if (params?.startDate) {
          result = result.filter((s) => s.shipmentDate >= params.startDate!);
        }

        if (params?.endDate) {
          result = result.filter((s) => s.shipmentDate <= params.endDate!);
        }

        return result.sort((a, b) => b.shipmentDate.localeCompare(a.shipmentDate));
      },

      getShipmentsByBatch: (batchId) =>
        get()
          .shipments.filter((s) => s.batchId === batchId)
          .sort((a, b) => b.shipmentDate.localeCompare(a.shipmentDate)),

      updateShipmentStatus: (id, status) => {
        set({
          shipments: get().shipments.map((s) =>
            s.id === id ? { ...s, status } : s
          ),
        });
      },
    }),
    {
      name: 'food-trace-shipments',
    }
  )
);
