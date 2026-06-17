import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, RefreshCw, AlertTriangle, Clock, CheckCircle, Send, Eye, Activity } from 'lucide-react';
import { DataTable, Column } from '@/components/DataTable';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { RecallLevelTag, RecallStatusTag } from '@/components/ui/StatusTag';
import { useRecallStore } from '@/store/recallStore';
import type { Recall, RecallStatus, RecallLevel, RecallFilterParams } from '@/types/recall';
import { formatDateTime } from '@/utils/date';

export default function RecallList() {
  const navigate = useNavigate();
  const { recalls, initRecalls, listRecalls, getRecallStats } = useRecallStore();

  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<RecallStatus | ''>('');
  const [level, setLevel] = useState<RecallLevel | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    initRecalls();
  }, [initRecalls]);

  const filters: RecallFilterParams = useMemo(() => ({
    keyword: keyword || undefined,
    status: status || undefined,
    level: level || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  }), [keyword, status, level, startDate, endDate]);

  const filteredData = useMemo(() => listRecalls(filters), [listRecalls, filters]);

  const handleReset = () => {
    setKeyword('');
    setStatus('');
    setLevel('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleViewDetail = (id: string) => {
    navigate('/recalls/' + id);
  };

  const columns: Column<Recall>[] = [
    {
      key: 'recallNo',
      title: '召回单号',
      width: '140px',
      render: (row) => (
        <span className="font-medium text-brand-700 font-mono text-xs">{row.recallNo}</span>
      ),
    },
    {
      key: 'batchNo',
      title: '关联批次',
      width: '130px',
      render: (row) => (
        <span className="font-medium text-gray-800">{row.batchNo}</span>
      ),
    },
    {
      key: 'productName',
      title: '产品名称',
      width: '140px',
    },
    {
      key: 'level',
      title: '召回等级',
      width: '110px',
      render: (row) => <RecallLevelTag level={row.level} />,
    },
    {
      key: 'reason',
      title: '召回原因',
      render: (row) => (
        <span className="text-gray-600 text-sm line-clamp-1" title={row.reason}>
          {row.reason || '-'}
        </span>
      ),
    },
    {
      key: 'initiator',
      title: '发起人',
      width: '90px',
      render: (row) => (
        <span className="text-gray-600 text-sm">{row.initiator || '-'}</span>
      ),
    },
    {
      key: 'createdAt',
      title: '发起时间',
      width: '150px',
      render: (row) => formatDateTime(row.createdAt, 'MM-DD HH:mm'),
    },
    {
      key: 'completion',
      title: '完成进度',
      width: '110px',
      render: (row) => {
        const stats = getRecallStats(row.id);
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden min-w-[60px]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700 transition-all duration-500"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-600 w-10 text-right">
              {stats.completionRate.toFixed(0)}%
            </span>
          </div>
        );
      },
    },
    {
      key: 'status',
      title: '状态',
      width: '110px',
      render: (row) => <RecallStatusTag status={row.status} />,
    },
    {
      key: 'actions',
      title: '操作',
      width: '90px',
      align: 'center',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewDetail(row.id);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-brand-700 bg-brand-50 rounded-md hover:bg-brand-100 transition-colors"
        >
          <Eye size={12} />
          详情
        </button>
      ),
    },
  ];

  const totalRecalls = recalls.length;
  const pendingRecalls = recalls.filter(r => r.status === 'pending').length;
  const inProgressRecalls = recalls.filter(r => r.status === 'in_progress' || r.status === 'notifying').length;
  const completedRecalls = recalls.filter(r => r.status === 'completed').length;
  const urgentRecalls = recalls.filter(r => r.level === 'level1').length;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">召回事件管理</h1>
          <p className="page-subtitle">管理产品质量召回事件，追踪下游响应进度</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => navigate('/recalls/new')}
          >
            发起召回
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card hover padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">召回总事件</p>
              <p className="text-3xl font-bold font-serif text-gray-800">
                {totalRecalls}
              </p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center">
              <Activity size={28} className="text-gray-500" />
            </div>
          </div>
        </Card>

        <Card hover padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">待处理</p>
              <p className="text-3xl font-bold font-serif text-gray-700">
                {pendingRecalls}
              </p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center">
              <Clock size={28} className="text-gray-500" />
            </div>
          </div>
        </Card>

        <Card hover padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">进行中</p>
              <p className="text-3xl font-bold font-serif text-alert-warn">
                {inProgressRecalls}
              </p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center">
              <Send size={28} className="text-alert-warn" />
            </div>
          </div>
        </Card>

        <Card hover padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">已完成</p>
              <p className="text-3xl font-bold font-serif text-brand-700">
                {completedRecalls}
              </p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-brand-50 flex items-center justify-center">
              <CheckCircle size={28} className="text-brand-600" />
            </div>
          </div>
        </Card>

        <Card hover padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">紧急召回</p>
              <p className="text-3xl font-bold font-serif text-alert-danger">
                {urgentRecalls}
              </p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle size={28} className="text-alert-danger" />
            </div>
          </div>
        </Card>
      </div>

      <Card padding="none">
        <CardHeader divider className="px-6 pt-4 pb-4">
          <CardTitle icon={<Filter size={18} />}>搜索筛选</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={<RefreshCw size={14} />}
              onClick={handleReset}
            >
              重置
            </Button>
          </div>
        </CardHeader>

        <CardBody className="px-6 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Input
              label="关键词搜索"
              placeholder="召回号/批次号/产品名"
              icon={<Search size={16} />}
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(1);
              }}
            />

            <Select
              label="召回状态"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as RecallStatus | '');
                setPage(1);
              }}
            >
              <option value="">全部状态</option>
              <option value="pending">待处理</option>
              <option value="notifying">通知发送中</option>
              <option value="in_progress">进行中</option>
              <option value="completed">已完成</option>
            </Select>

            <Select
              label="召回等级"
              value={level}
              onChange={(e) => {
                setLevel(e.target.value as RecallLevel | '');
                setPage(1);
              }}
            >
              <option value="">全部等级</option>
              <option value="level1">一级(紧急)</option>
              <option value="level2">二级(重要)</option>
              <option value="level3">三级(一般)</option>
            </Select>

            <Input
              label="开始日期"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
            />

            <Input
              label="结束日期"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </CardBody>

        <div className="px-6 pb-6">
          <DataTable<Recall>
            columns={columns}
            data={filteredData}
            rowKey="id"
            pagination={{
              current: page,
              pageSize,
              total: filteredData.length,
              onChange: setPage,
            }}
            emptyText="暂无召回事件"
          />
        </div>
      </Card>
    </div>
  );
}
