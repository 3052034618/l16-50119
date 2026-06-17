import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useBatchStore } from '@/store/batchStore';
import { useShipmentStore } from '@/store/shipmentStore';
import { useRecallStore } from '@/store/recallStore';
import { useBaseStore } from '@/store/baseStore';

function useInitStores() {
  const initBase = useBaseStore((s) => s.initBase);
  const initBatches = useBatchStore((s) => s.initBatches);
  const initShipments = useShipmentStore((s) => s.initShipments);
  const initRecalls = useRecallStore((s) => s.initRecalls);

  useEffect(() => {
    initBase();
    initBatches();
    initShipments();
    initRecalls();
  }, [initBase, initBatches, initShipments, initRecalls]);
}

function ConsumerLayout({ children }: { children: ReactNode }) {
  useInitStores();
  return <div className="min-h-screen">{children}</div>;
}

export function Layout() {
  const location = useLocation();

  useInitStores();

  if (location.pathname.startsWith('/trace/') && location.pathname !== '/trace') {
    return (
      <ConsumerLayout>
        <Outlet />
      </ConsumerLayout>
    );
  }

  return (
    <ConsumerLayout>
      <div className="flex h-screen overflow-hidden bg-[#F8FAF8]">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto scrollbar-thin">
            <Outlet />
          </main>
        </div>
      </div>
    </ConsumerLayout>
  );
}

export default Layout;
