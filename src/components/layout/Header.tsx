import { Bell, Search, User, Settings, LogOut, ShieldCheck } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useState } from 'react';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: '工作台仪表盘', subtitle: '掌握全局数据，洞察生产质量态势' },
  '/batches': { title: '批次管理', subtitle: '录入产品批次信息与检验结果' },
  '/batches/new': { title: '新建批次', subtitle: '录入新批次的完整信息' },
  '/shipments': { title: '发货流向', subtitle: '追踪产品出库与下游流向' },
  '/shipments/new': { title: '新建发货', subtitle: '登记产品出库信息' },
  '/recalls': { title: '召回管理', subtitle: '发起召回并追踪响应状态' },
  '/recalls/new': { title: '发起召回', subtitle: '启动产品召回流程' },
  '/trace': { title: '溯源查询', subtitle: '消费者扫码查询结果' },
  '/export': { title: '数据导出', subtitle: '导出流转记录与召回报告' },
  '/dealers': { title: '经销商管理', subtitle: '维护经销商档案信息' },
  '/stores': { title: '门店管理', subtitle: '维护终端门店档案信息' },
  '/suppliers': { title: '原料供应商', subtitle: '维护原料供应商资质信息' },
};

export function Header() {
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getPageTitle = () => {
    const path = location.pathname;
    for (const [pattern, info] of Object.entries(pageTitles)) {
      if (pattern === '/' && path === '/') return info;
      if (pattern !== '/' && path.startsWith(pattern.replace('/new', ''))) {
        if (path.includes('/new') && pattern.includes('/new')) return info;
        if (!path.includes('/new') && !pattern.includes('/new')) return info;
      }
      if (path.match(/^\/batches\/[^/]+$/)) {
        return { title: '批次详情', subtitle: '查看批次完整信息与流向链路' };
      }
      if (path.match(/^\/recalls\/[^/]+$/)) {
        return { title: '召回详情', subtitle: '追踪召回进度与响应状态' };
      }
      if (path.match(/^\/trace\/[^/]+$/)) {
        return { title: '溯源查询结果', subtitle: '消费者扫码查看的批次信息' };
      }
    }
    return { title: '食品溯源管理系统', subtitle: '' };
  };

  const pageInfo = getPageTitle();
  const unreadNotifications = 3;

  return (
    <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-30">
      <div className="flex flex-col">
        <h1 className="font-serif text-xl font-bold text-gray-800">{pageInfo.title}</h1>
        {pageInfo.subtitle && (
          <p className="text-xs text-gray-500 mt-0.5">{pageInfo.subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索批次号、溯源码..."
            className="pl-9 pr-4 py-1.5 w-64 rounded-lg border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
          />
        </div>

        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
          <Bell size={20} />
          {unreadNotifications > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-alert-danger text-white text-[10px] font-bold flex items-center justify-center animate-pulse-slow">
              {unreadNotifications}
            </span>
          )}
        </button>

        <div className="h-6 w-px bg-gray-200" />

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
              <User size={16} className="text-brand-800" />
            </div>
            <div className="text-left hidden lg:block">
              <p className="text-sm font-medium text-gray-800">质量管理部</p>
              <p className="text-[11px] text-gray-400 flex items-center gap-1">
                <ShieldCheck size={11} className="text-brand-600" />
                系统管理员
              </p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-card bg-white shadow-hover border border-gray-100 py-2 z-50 animate-scale-in">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="font-medium text-gray-800">质量管理部</p>
                <p className="text-xs text-gray-500 mt-0.5">admin@foodtrace.com</p>
              </div>
              <div className="py-1">
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-brand-50 flex items-center gap-2">
                  <User size={16} /> 个人信息
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-brand-50 flex items-center gap-2">
                  <Settings size={16} /> 系统设置
                </button>
              </div>
              <div className="border-t border-gray-100 pt-1">
                <button className="w-full px-4 py-2 text-left text-sm text-alert-danger hover:bg-red-50 flex items-center gap-2">
                  <LogOut size={16} /> 退出登录
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
