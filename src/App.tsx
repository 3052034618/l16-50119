import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Truck,
  AlertTriangle,
  FileSpreadsheet,
  Building2,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';

import Dashboard from '@/pages/Dashboard';
import Home from '@/pages/Home';
import BatchList from '@/pages/batches/BatchList';
import BatchForm from '@/pages/batches/BatchForm';
import BatchDetail from '@/pages/batches/BatchDetail';
import ShipmentList from '@/pages/shipments/ShipmentList';
import ShipmentForm from '@/pages/shipments/ShipmentForm';
import RecallList from '@/pages/recalls/RecallList';
import RecallInitiate from '@/pages/recalls/RecallInitiate';
import RecallDetail from '@/pages/recalls/RecallDetail';
import ConsumerTrace from '@/pages/ConsumerTrace';
import ExportCenter from '@/pages/ExportCenter';
import DealerManagement from '@/pages/master/DealerManagement';
import StoreManagement from '@/pages/master/StoreManagement';
import SupplierManagement from '@/pages/master/SupplierManagement';

function NotFound() {
  return (
    <div className="page-container">
      <div className="text-center py-24">
        <div className="w-24 h-24 rounded-3xl bg-red-50 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={48} className="text-alert-danger" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-gray-800 mb-3">页面未找到</h1>
        <p className="text-gray-500 mb-8">您访问的页面不存在或已被移除</p>
        <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
          <Link to="/" className="p-4 rounded-xl bg-brand-50 cursor-pointer hover:bg-brand-100 transition-colors">
            <LayoutDashboard size={24} className="text-brand-700 mx-auto mb-2" />
            <p className="text-sm text-brand-700 font-medium">仪表盘</p>
          </Link>
          <Link to="/batches" className="p-4 rounded-xl bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors">
            <Package size={24} className="text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-blue-700 font-medium">批次管理</p>
          </Link>
          <Link to="/export" className="p-4 rounded-xl bg-amber-50 cursor-pointer hover:bg-amber-100 transition-colors">
            <FileSpreadsheet size={24} className="text-amber-600 mx-auto mb-2" />
            <p className="text-sm text-amber-700 font-medium">数据导出</p>
          </Link>
          <Link to="/dealers" className="p-4 rounded-xl bg-purple-50 cursor-pointer hover:bg-purple-100 transition-colors">
            <Building2 size={24} className="text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-purple-700 font-medium">基础数据</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/trace/:code" element={<ConsumerTrace />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/home" element={<Home />} />

          <Route path="/batches" element={<BatchList />} />
          <Route path="/batches/new" element={<BatchForm />} />
          <Route path="/batches/:id" element={<BatchDetail />} />

          <Route path="/shipments" element={<ShipmentList />} />
          <Route path="/shipments/new" element={<ShipmentForm />} />

          <Route path="/recalls" element={<RecallList />} />
          <Route path="/recalls/new" element={<RecallInitiate />} />
          <Route path="/recalls/:id" element={<RecallDetail />} />

          <Route path="/export" element={<ExportCenter />} />

          <Route path="/dealers" element={<DealerManagement />} />
          <Route path="/stores" element={<StoreManagement />} />
          <Route path="/suppliers" element={<SupplierManagement />} />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}
