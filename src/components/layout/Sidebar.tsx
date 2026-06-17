import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Truck,
  AlertTriangle,
  QrCode,
  FileDown,
  Building2,
  Store,
  Leaf,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: '仪表盘', path: '/', icon: LayoutDashboard },
  { label: '批次管理', path: '/batches', icon: Package },
  { label: '发货流向', path: '/shipments', icon: Truck },
  { label: '召回管理', path: '/recalls', icon: AlertTriangle, badge: '1' },
  { label: '溯源查询', path: '/trace', icon: QrCode },
  { label: '数据导出', path: '/export', icon: FileDown },
];

const masterDataItems: NavItem[] = [
  { label: '经销商', path: '/dealers', icon: Building2 },
  { label: '门店管理', path: '/stores', icon: Store },
  { label: '原料供应商', path: '/suppliers', icon: Leaf },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = isActive(item.path);

    return (
      <button
        key={item.path}
        onClick={() => navigate(item.path)}
        className={clsx(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative group',
          active
            ? 'bg-brand-700 text-white shadow-md shadow-brand-700/20'
            : 'text-gray-600 hover:bg-brand-50 hover:text-brand-700'
        )}
      >
        <Icon size={20} className={clsx('flex-shrink-0', active && 'text-white')} />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <span
                className={clsx(
                  'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold',
                  active ? 'bg-white text-alert-danger' : 'bg-alert-danger text-white'
                )}
              >
                {item.badge}
              </span>
            )}
          </>
        )}
        {collapsed && item.badge && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-alert-danger text-white text-[10px] font-bold flex items-center justify-center">
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside
      className={clsx(
        'relative flex flex-col h-screen bg-white border-r border-gray-100 transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[248px]'
      )}
    >
      <div
        className={clsx(
          'flex items-center h-16 px-4 border-b border-gray-100 flex-shrink-0',
          collapsed && 'justify-center px-2'
        )}
      >
        <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0 shadow-md">
          <Leaf size={20} className="text-brand-800" />
        </div>
        {!collapsed && (
          <div className="ml-3 overflow-hidden">
            <p className="font-serif font-bold text-base text-gray-800 whitespace-nowrap">
              溯源管理系统
            </p>
            <p className="text-[10px] text-gray-400 whitespace-nowrap">
              Food Traceability Platform
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3 space-y-6">
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              核心功能
            </p>
          )}
          {navItems.map(renderNavItem)}
        </div>

        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              基础数据
            </p>
          )}
          {masterDataItems.map(renderNavItem)}
        </div>
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className={clsx(
          'absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-500 hover:text-brand-700 hover:border-brand-300 transition-all z-10',
          collapsed && 'rotate-180'
        )}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}

export default Sidebar;
