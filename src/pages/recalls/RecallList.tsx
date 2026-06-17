import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Search,
  Plus,
  RefreshCw,
  ChevronRight,
  BarChart3,
  Package,
  Clock,
  Bell,
  Filter,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DataTable, Column } from '@/components/DataTable';
import { Input, Select } from '@/components/ui/Input';
import { RecallLevelTag, RecallStatusTag, NotificationStatusTag } from '@/components/ui/StatusTag';
import { useRecallStore } from '@/store/recallStore';
import type { Recall, RecallStatus, RecallLevel } from '@/types/recall';
import { formatDateTime } from '@/utils/date';
import { clsx } from 'clsx';

export default function RecallList() {
  const navigate = useNavigate();
  const { listRecalls, getRecallStats, initRecalls } = useRecallStore();

  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [completionRateFilter, setCompletionRateFilter] = useState<string>('');
  const [unresponsiveFilter, setUnresponsiveFilter] = useState<string>('');
  const [sortByRisk, setSortByRisk] = useState(false);
  const [highRiskOnly, setHighRiskOnly] = useState(false);

  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    initRecalls();
  }, [initRecalls]);

  const recalls = useMemo(() => {
    let minCompletionRate: number | undefined;
    let maxCompletionRate: number | undefined;
    if (completionRateFilter) {
      if (completionRateFilter === '0-50') {
        minCompletionRate = 0;
        maxCompletionRate = 50;
      } else if (completionRateFilter === '50-80') {
        minCompletionRate = 50;
        maxCompletionRate = 80;
      } else if (completionRateFilter === '80-100') {
        minCompletionRate = 80;
        maxCompletionRate = 99.99;
      } else if (completionRateFilter === '100') {
        minCompletionRate = 100;
        maxCompletionRate = 100;
      }
    }

    const hasUnresponsive =
      unresponsiveFilter === 'yes' ? true : unresponsiveFilter === 'no' ? false : undefined;

    return listRecalls({
      keyword: keyword || undefined,
      status: (statusFilter as RecallStatus) || undefined,
      level: (levelFilter as RecallLevel) || undefined,
      startDate: dateFilter || undefined,
      endDate: dateFilter || undefined,
      minCompletionRate,
      maxCompletionRate,
      hasUnresponsive,
      sortByRisk,
      highRiskOnly,
    });
  }, [listRecalls, keyword, statusFilter, levelFilter, dateFilter, completionRateFilter, unresponsiveFilter, sortByRisk, highRiskOnly]);

  const total = recalls.length;

  const handleRefresh = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 300);
  };

  const handleReset = () => {
    setKeyword('');
    setStatusFilter('');
    setLevelFilter('');
    setDateFilter('');
    setCompletionRateFilter('');
    setUnresponsiveFilter('');
    setSortByRisk(false);
    setHighRiskOnly(false);
  };

  const columns: Column<Recall>[] = [
    {
      key: 'recallNo',
      title: '召回单号',
      width: '140px',
      render: (row) => (
        <div>
          <p className="font-mono font-semibold text-gray-800">{row.recallNo}</p>
          <p className="text-xs text-gray-500 font-mono mt-0.5">{row.id}</p>
        </div>
      ),
    },
    {
      key: 'batchNo',
      title: '关联批次/产品',
      width: '200px',
      render: (row) => (
        <div>
          <p className="font-semibold text-gray-800">{row.productName}</p>
          <p className="text-xs text-gray-500 font-mono mt-0.5">批次: {row.batchNo}</p>
        </div>
      ),
    },
    {
      key: 'level',
      title: '召回等级',
      width: '100px',
      render: (row) => <RecallLevelTag level={row.level} />,
    },
    {
      key: 'riskScore',
      title: '风险评分',
      width: '110px',
      render: (row) => {
        const stats = getRecallStats(row.id);
        const isHighRisk = stats.riskScore >= 40 || stats.totalUrgeCount >= 2 || stats.overdueDays >= 3;
        return (
          <div>
            <p className={clsx(
              'font-bold',
              stats.riskScore >= 40 ? 'text-alert-danger' : stats.riskScore >= 20 ? 'text-alert-warn' : 'text-gray-700'
            )}>
              {stats.riskScore} 分
            </p>
            {isHighRisk && (
              <p className="text-[10px] text-alert-warn mt-0.5 flex items-center gap-0.5">
                <AlertTriangle size={10} />
                高风险
              </p>
            )}
            {stats.totalUrgeCount > 0 && (
              <p className="text-[10px] text-gray-500 mt-0.5">
                催促 {stats.totalUrgeCount} 次 · 逾期 {stats.overdueDays} 天
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      title: '召回状态',
      width: '100px',
      render: (row) => <RecallStatusTag status={row.status} />,
    },
    {
      key: 'completion',
      title: '召回进度',
      width: '220px',
      render: (row) => {
        const stats = getRecallStats(row.id);
        const barValue = Math.min(100, Math.max(0, stats.completionRate));
        return (
          <div className="w-full">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-500">
                <Package size={10} className="inline -mt-0.5 mr-1" />
                {stats.returned}/{stats.total} 已退回
              </span>
              <span className={clsx('text-sm font-bold', barValue >= 100 ? 'text-brand-700' : 'text-gray-700')}>
                {barValue}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={clsx(
                  'h-full rounded-full transition-all duration-500',
                  barValue >= 100 ? 'bg-brand-500' : barValue >= 80 ? 'bg-brand-400' : barValue >= 50 ? 'bg-blue-400' : 'bg-amber-400'
                )}
                style={{ width: `${barValue}%` }}
              />
            </div>
            {stats.unresponsive > 0 && (
              <p className="text-xs text-alert-danger mt-1.5 flex items-center gap-1">
                <Bell size={10} />
                待跟进 {stats.unresponsive} 个
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: 'downstreamSummary',
      title: '下游响应概览',
      width: '260px',
      render: (row) => {
        const stats = getRecallStats(row.id);
        return (
          <div className="flex flex-wrap gap-2">
            {stats.pending > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-gray-50 text-gray-600 text-xs">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                待发送 {stats.pending}
              </div>
            )}
            {stats.sent > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                已发 {stats.sent}
              </div>
            )}
            {stats.urged > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-orange-50 text-orange-700 text-xs">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                已催 {stats.urged}
              </div>
            )}
            {stats.received > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                已收 {stats.received}
              </div>
            )}
            {stats.offShelf > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                下架 {stats.offShelf}
              </div>
            )}
            {stats.returned > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-brand-50 text-brand-700 text-xs">
                <span className="w-2 h-2 rounded-full bg-brand-500" />
                退回 {stats.returned}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      title: '发起时间',
      width: '150px',
      render: (row) => (
        <div>
          <p className="text-gray-800">{formatDateTime(row.createdAt, 'YYYY-MM-DD')}</p>
          <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(row.createdAt, 'HH:mm:ss')}</p>
        </div>
      ),
    },
    {
      key: 'initiator',
      title: '发起人',
      width: '110px',
      render: (row) => <span className="text-gray-700">{row.initiator || '-'}</span>,
    },
    {
      key: 'action',
      title: '操作',
      width: '90px',
      render: (row) => (
        <div className="flex gap-1">
          <Button variant="secondary" size="sm" onClick={() => navigate(`/recalls/${row.id}`)}>
            详情
          </Button>
          <button
            className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
            onClick={() => navigate(`/recalls/${row.id}`)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      ),
    },
  ];

  const totalStats = useMemo(() => {
    return recalls.reduce(
      (acc, r) => {
        const stats = getRecallStats(r.id);
        acc.total += stats.total;
        acc.returned += stats.returned;
        acc.unresponsive += stats.unresponsive;
        return acc;
      },
      { total: 0, returned: 0, unresponsive: 0 }
    );
  }, [recalls, getRecallStats]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3">
            <AlertTriangle size={28} className="text-alert-warn" />
            <h1 className="page-title">质量召回管理</h1>
          </div>
          <p className="page-subtitle">批次问题产品快速召回、通知追踪与状态闭环管理</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSortByRisk(!sortByRisk)}
            className={clsx(
              'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all border-2',
              sortByRisk
                ? 'bg-alert-warn/10 text-alert-warn border-alert-warn/30'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            )}
          >
            <AlertTriangle size={16} />
            {sortByRisk ? '高风险优先 ✓' : '高风险优先'}
          </button>
          <button
            onClick={() => setHighRiskOnly(!highRiskOnly)}
            className={clsx(
              'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all border-2',
              highRiskOnly
                ? 'bg-alert-danger/10 text-alert-danger border-alert-danger/30'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            )}
          >
            <Filter size={16} />
            {highRiskOnly ? '只看高风险 ✓' : '只看高风险'}
          </button>
          <Button variant="secondary" icon={<RefreshCw size={16} />} loading={loading} onClick={handleRefresh}>
            刷新列表
          </Button>
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => navigate('/recalls/new')}>
            发起质量召回
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <Card padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">召回事件总数</p>
              <p className="text-3xl font-bold text-gray-800">{total}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <AlertTriangle size={20} className="text-gray-500" />
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">进行中召回</p>
              <p className="text-3xl font-bold text-blue-700">
                {recalls.filter((r) => r.status === 'in_progress').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Clock size={20} className="text-blue-600" />
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">完成召回</p>
              <p className="text-3xl font-bold text-brand-700">
                {recalls.filter((r) => r.status === 'completed').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <BarChart3 size={20} className="text-brand-600" />
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">涉及下游接收方</p>
              <p className="text-3xl font-bold text-indigo-700">{totalStats.total}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Package size={20} className="text-indigo-600" />
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">未响应/待跟进</p>
              <p className={clsx('text-3xl font-bold', totalStats.unresponsive > 0 ? 'text-alert-danger' : 'text-gray-500')}>
                {totalStats.unresponsive}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <Bell size={20} className={clsx(totalStats.unresponsive > 0 ? 'text-alert-danger' : 'text-gray-400')} />
            </div>
          </div>
        </Card>
      </div>

      <Card padding="md" className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <span className="font-medium text-gray-700">召回筛选</span>
          </div>
          <button
            className="text-xs text-brand-600 hover:text-brand-700"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? '收起筛选' : '展开筛选'}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">关键词</label>
              <Input
                placeholder="搜索单号/批次/产品/原因"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                icon={<Search size={16} />}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">召回状态</label>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">全部状态</option>
                <option value="pending">待发起</option>
                <option value="in_progress">进行中</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">召回等级</label>
              <Select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
              >
                <option value="">全部等级</option>
                <option value="level1">一级（最严重）</option>
                <option value="level2">二级（较严重）</option>
                <option value="level3">三级（一般）</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">发起日期</label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">完成率</label>
              <Select
                value={completionRateFilter}
                onChange={(e) => setCompletionRateFilter(e.target.value)}
              >
                <option value="">全部完成率</option>
                <option value="0-50">0% - 50%（滞后）</option>
                <option value="50-80">50% - 80%（进行中）</option>
                <option value="80-100">80% - 100%（即将完成）</option>
                <option value="100">100% 已全部退回</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">未响应</label>
              <Select
                value={unresponsiveFilter}
                onChange={(e) => setUnresponsiveFilter(e.target.value)}
              >
                <option value="">全部</option>
                <option value="yes">有未响应对象（高风险）</option>
                <option value="no">全部已响应（闭环）</option>
              </Select>
            </div>
            <div className="space-y-1.5 flex items-end">
              <div className="flex gap-2 w-full">
                <Button variant="secondary" size="md" className="flex-1" onClick={handleReset}>
                  重置
                </Button>
                <Button variant="primary" size="md" className="flex-1" onClick={handleRefresh}>
                  查询
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card padding="none">
        <CardHeader divider className="px-6 py-4">
          <CardTitle icon={<AlertTriangle size={18} />}>
            召回事件列表
            <span className="ml-3 text-sm text-gray-400 font-normal">
              共 {total} 条记录
              {(completionRateFilter || unresponsiveFilter || sortByRisk || highRiskOnly) && (
                <span className="text-brand-600 ml-2 bg-brand-50 px-2 py-0.5 rounded">
                  已应用高级筛选
                  {sortByRisk && ' · 高风险排序'}
                  {highRiskOnly && ' · 仅高风险'}
                </span>
              )}
            </span>
          </CardTitle>
        </CardHeader>
        <CardBody>
          {recalls.length === 0 ? (
            <div className="p-24 text-center">
              <AlertTriangle size={64} className="mx-auto mb-4 opacity-30 text-gray-400" />
              <p className="text-lg font-medium text-gray-700 mb-2">暂无符合条件的召回事件</p>
              <p className="text-sm text-gray-500 mb-6">
                {total === 0
                  ? '尚未发起任何质量召回事件，点击右上按钮发起第一条召回'
                  : '请尝试调整筛选条件以查询更多结果'}
              </p>
              <Button variant="primary" icon={<Plus size={16} />} onClick={() => navigate('/recalls/new')}>
                发起质量召回
              </Button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={recalls}
              rowKey="id"
              emptyText="暂无召回事件"
              onRowClick={(row) => navigate(`/recalls/${row.id}`)}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
