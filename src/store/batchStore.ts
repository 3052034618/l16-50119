import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Batch,
  BatchStatus,
  FilterParams,
  RawMaterial,
  InspectionResult,
} from '@/types/batch';
import { generateId, generateBatchNo, generateTraceCode } from '@/utils/idGenerator';
import { now, addDays } from '@/utils/date';
import { seedBatches } from '@/mock/seedBatches';

interface BatchStore {
  batches: Batch[];
  initialized: boolean;
  initBatches: () => void;
  createBatch: (data: Partial<Batch>) => Batch;
  getBatch: (id: string) => Batch | undefined;
  getBatchByTraceCode: (code: string) => Batch | undefined;
  listBatches: (params?: FilterParams) => Batch[];
  updateBatchStatus: (id: string, status: BatchStatus) => void;
  updateBatchRemainingQty: (id: string, qtyChange: number) => void;
  addRawMaterials: (batchId: string, materials: RawMaterial[]) => void;
  updateInspection: (batchId: string, inspection: InspectionResult) => void;
}

export const useBatchStore = create<BatchStore>()(
  persist(
    (set, get) => ({
      batches: [],
      initialized: false,

      initBatches: () => {
        const state = get();
        if (!state.initialized || state.batches.length === 0) {
          set({ batches: seedBatches, initialized: true });
        }
      },

      createBatch: (data) => {
        const productionDate = data.productionDate || new Date().toISOString().split('T')[0];
        const shelfLife = data.shelfLife || 180;
        const newBatch: Batch = {
          id: generateId('batch_'),
          batchNo: data.batchNo || generateBatchNo(),
          productName: data.productName || '',
          productionDate,
          shelfLife,
          expiryDate: data.expiryDate || addDays(productionDate, shelfLife),
          quantity: data.quantity || 0,
          remainingQty: data.remainingQty || data.quantity || 0,
          rawMaterials: data.rawMaterials || [],
          inspection: data.inspection || {
            items: [],
            overall: 'qualified',
            inspector: '',
            inspectedAt: now(),
          },
          traceCode: data.traceCode || generateTraceCode(),
          status: data.status || 'pending',
          createdAt: now(),
          remark: data.remark,
        };
        set({ batches: [...get().batches, newBatch] });
        return newBatch;
      },

      getBatch: (id) => get().batches.find((b) => b.id === id),

      getBatchByTraceCode: (code) =>
        get().batches.find((b) => b.traceCode === code || b.batchNo === code),

      listBatches: (params) => {
        let result = [...get().batches];

        if (params?.keyword) {
          const kw = params.keyword.toLowerCase();
          result = result.filter(
            (b) =>
              b.batchNo.toLowerCase().includes(kw) ||
              b.productName.toLowerCase().includes(kw) ||
              b.traceCode.toLowerCase().includes(kw)
          );
        }

        if (params?.status) {
          result = result.filter((b) => b.status === params.status);
        }

        if (params?.startDate) {
          result = result.filter((b) => b.productionDate >= params.startDate!);
        }

        if (params?.endDate) {
          result = result.filter((b) => b.productionDate <= params.endDate!);
        }

        return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      },

      updateBatchStatus: (id, status) => {
        set({
          batches: get().batches.map((b) =>
            b.id === id ? { ...b, status } : b
          ),
        });
      },

      updateBatchRemainingQty: (id, qtyChange) => {
        set({
          batches: get().batches.map((b) =>
            b.id === id
              ? { ...b, remainingQty: Math.max(0, b.remainingQty - qtyChange) }
              : b
          ),
        });
      },

      addRawMaterials: (batchId, materials) => {
        set({
          batches: get().batches.map((b) =>
            b.id === batchId
              ? { ...b, rawMaterials: [...b.rawMaterials, ...materials] }
              : b
          ),
        });
      },

      updateInspection: (batchId, inspection) => {
        set({
          batches: get().batches.map((b) =>
            b.id === batchId
              ? {
                  ...b,
                  inspection,
                  status:
                    inspection.overall === 'qualified' ? 'qualified' : 'unqualified',
                }
              : b
          ),
        });
      },
    }),
    {
      name: 'food-trace-batches',
    }
  )
);
