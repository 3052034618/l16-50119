import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Dealer, Store, Supplier } from '@/types/master';
import { generateId } from '@/utils/idGenerator';
import { now } from '@/utils/date';
import { seedDealers, seedStores, seedSuppliers } from '@/mock/seedMaster';

interface BaseStore {
  dealers: Dealer[];
  stores: Store[];
  suppliers: Supplier[];
  initialized: boolean;
  initBase: () => void;

  getDealerById: (id: string) => Dealer | undefined;
  getStoresByDealer: (dealerId: string) => Store[];
  getStoreById: (id: string) => Store | undefined;
  getSupplierById: (id: string) => Supplier | undefined;

  createDealer: (data: Partial<Dealer>) => Dealer;
  updateDealer: (id: string, data: Partial<Dealer>) => void;
  deleteDealer: (id: string) => void;

  createStore: (data: Partial<Store>) => Store;
  updateStore: (id: string, data: Partial<Store>) => void;
  deleteStore: (id: string) => void;

  createSupplier: (data: Partial<Supplier>) => Supplier;
  updateSupplier: (id: string, data: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
}

export const useBaseStore = create<BaseStore>()(
  persist(
    (set, get) => ({
      dealers: [],
      stores: [],
      suppliers: [],
      initialized: false,

      initBase: () => {
        const state = get();
        if (!state.initialized || state.dealers.length === 0 || state.stores.length === 0) {
          set({
            dealers: seedDealers,
            stores: seedStores,
            suppliers: seedSuppliers,
            initialized: true,
          });
        }
      },

      getDealerById: (id) => get().dealers.find((d) => d.id === id),
      getStoresByDealer: (dealerId) =>
        get().stores.filter((s) => s.dealerId === dealerId),
      getStoreById: (id) => get().stores.find((s) => s.id === id),
      getSupplierById: (id) => get().suppliers.find((s) => s.id === id),

      createDealer: (data) => {
        const newDealer: Dealer = {
          id: generateId('dealer_'),
          name: data.name || '',
          contact: data.contact || '',
          phone: data.phone || '',
          region: data.region || '',
          address: data.address || '',
          createdAt: now(),
        };
        set({ dealers: [...get().dealers, newDealer] });
        return newDealer;
      },

      updateDealer: (id, data) => {
        set({
          dealers: get().dealers.map((d) =>
            d.id === id ? { ...d, ...data } : d
          ),
        });
      },

      deleteDealer: (id) => {
        set({
          dealers: get().dealers.filter((d) => d.id !== id),
          stores: get().stores.filter((s) => s.dealerId !== id),
        });
      },

      createStore: (data) => {
        const dealer = get().getDealerById(data.dealerId || '');
        const newStore: Store = {
          id: generateId('store_'),
          name: data.name || '',
          dealerId: data.dealerId || '',
          dealerName: dealer?.name || data.dealerName || '',
          contact: data.contact || '',
          phone: data.phone || '',
          address: data.address || '',
        };
        set({ stores: [...get().stores, newStore] });
        return newStore;
      },

      updateStore: (id, data) => {
        set({
          stores: get().stores.map((s) =>
            s.id === id ? { ...s, ...data } : s
          ),
        });
      },

      deleteStore: (id) => {
        set({ stores: get().stores.filter((s) => s.id !== id) });
      },

      createSupplier: (data) => {
        const newSupplier: Supplier = {
          id: generateId('supplier_'),
          name: data.name || '',
          contact: data.contact || '',
          phone: data.phone || '',
          licenseNo: data.licenseNo || '',
          licenseExpiry: data.licenseExpiry || '',
          address: data.address || '',
        };
        set({ suppliers: [...get().suppliers, newSupplier] });
        return newSupplier;
      },

      updateSupplier: (id, data) => {
        set({
          suppliers: get().suppliers.map((s) =>
            s.id === id ? { ...s, ...data } : s
          ),
        });
      },

      deleteSupplier: (id) => {
        set({ suppliers: get().suppliers.filter((s) => s.id !== id) });
      },
    }),
    {
      name: 'food-trace-base',
    }
  )
);
