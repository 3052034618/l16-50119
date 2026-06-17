import { useEffect, useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Eye,
  Filter,
  Calendar,
  Download,
  RefreshCw,
  Package,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/DataTable';
import { BatchStatusTag, InspectionResultTag } from '@/components/ui/StatusTag';
import { useBatchStore } from '@/store/batchStore';
import { useBaseStore } from '@/store/baseStore';
import type { Batch, BatchStatus } from '@/types';
import { formatDate, today, addDays } from '@/utils/date';
import { exportBatchRecords } from '@/utils/export';

const statusOptions: Array<{ value: BatchStatus | ''; label: string }> = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待检验' },
  { value: 'qualified', label: '检验合格' },
  { value: 'unqualified', label: '检验不合格' },
  { value: 'in_stock', label: '在库' },
  { value: 'shipped', label: '已发货' },
  { value: 'recalling', label: '召回中' },
];

export default function BatchList() {
  const navigate = useNavigate();
  const { batches, initBatches, listBatches } = useBatchStore();
  const { initBase } = useBaseStore();

  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<BatchStatus | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    initBatches();
    initBase();
  }, [initBatches, initBase]);

  const filteredBatches = useMemo(() => {
    return listBatches({
      keyword: keyword || undefined,
      status: status || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  }, [keyword, status, startDate, endDate, listBatches]);

  const totalPages = Math.ceil(filteredBatches.length / pageSize);

  const handleReset = () => {
    setKeyword('');
    setStatus('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleExport = () => {
    if (filteredBatches.length === 0) return;
    exportBatchRecords(filteredBatches);
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  const handleQuickDate = (days: number) => {
    setEndDate(today());
    setStartDate(addDays(today(), -days));
  };

  const columns: Column<Batch>[] = [
    {
      key: 'batchNo',
      title: '批次号',
      width: '150px',
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-800 font-mono">{row.batchNo}</span>
          <span className="text-xs text-gray-400 mt-0.5">{row.traceCode}</span>
        </div>
      ),
    },
    {
      key: 'productName',
      title: '产品名称',
      width: '160px',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
            <Package size={16} className="text-brand-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{row.productName}</p>
            <p className="text-xs text-gray-400">
              {formatDate(row.productionDate)} 生产
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'quantity',
      title: '数量',
      width: '100px',
      align: 'right',
      render: (row) => (
        <div className="text-right">
          <p className="text-sm font-medium text-gray-800">{row.quantity.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            剩余 <span className="text-brand-600">{row.remainingQty.toLocaleString()}</span>
          </p>
        </div>
      ),
    },
    {
      key: 'expiryDate',
      title: '保质期',
      width: '130px',
      render: (row) => (
        <div>
          <p className="text-sm text-gray-700">{formatDate(row.expiryDate)}</p>
          <p className="text-xs text-gray-400">{row.shelfLife} 天</p>
        </div>
      ),
    },
    {
      key: 'inspection',
      title: '检验结果',
      width: '110px',
      render: (row) => (
        <div>
          <InspectionResultTag result={row.inspection.overall === 'qualified' ? 'pass' : 'fail'} />
          {row.inspection.inspector && (
            <p className="text-xs text-gray-400 mt-1">{row.inspection.inspector}</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      title: '批次状态',
      width: '110px',
      render: (row) => <BatchStatusTag status={row.status} />,
    },
    {
      key: 'createdAt',
      title: '录入时间',
      width: '130px',
      render: (row) => (
        <span className="text-sm text-gray-500">{formatDate(row.createdAt, 'YYYY-MM-DD HH:mm')}</span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: '120px',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/batches/${row.id}`);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md text-brand-700 hover:bg-brand-50 transition-colors"
          >
            <Eye size={14} />
            查看
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">批次管理</h1>
          <p className="page-subtitle">
            管理产品生产批次信息，共 <span className="text-brand-600 font-medium">{batches.length}</span> 条批次记录
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={handleRefresh}>
            刷新
          </Button>
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => navigate('/batches/new')}>
            新增批次
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardBody>
          <div className="flex items-center gap-2 mb-4">
            <Filter size={16} className="text-brand-600" />
            <span className="text-sm font-medium text-gray-700">筛选条件</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <Input
                label="关键词搜索"
                placeholder="请输入批次号/产品名称/溯源码"
                icon={<Search size={16} />}
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div>
              <Select
                label="批次状态"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as BatchStatus | '');
                  setPage(1);
                }}
                options={statusOptions.map((o) => ({ value: o.value, label: o.label }))}
              />
            </div>
            <div>
              <Input
                label="开始日期"
                type="date"
                icon={<Calendar size={16} />}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div>
              <Input
                label="结束日期"
                type="date"
                icon={<Calendar size={16} />}
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">快捷筛选：</span>
              {[7, 30, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => handleQuickDate(days)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                    startDate === addDays(today(), -days) && endDate === today()
                      ? 'bg-brand-700 text-white'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  近{days}天
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={handleReset}
                size="sm"
              >
                重置
              </Button>
              <Button
                variant="secondary"
                icon={<Download size={16} />}
                onClick={handleExport}
                size="sm"
                disabled={filteredBatches.length === 0}
              >
                导出Excel
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader divider>
          <CardTitle icon={<Package size={20} />}>批次列表</CardTitle>
          <div className="flex items-center gap-3 text-xs">
            {statusOptions.slice(1).map((opt) => {
              const count = batches.filter((b) => b.status === opt.value).length;
              return (
                <div
                  key={opt.value}
                  onClick={() => {
                    setStatus(opt.value as BatchStatus);
                    setPage(1);
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer transition-colors ${
                    status === opt.value
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className={`font-medium ${status === opt.value ? 'text-brand-700' : 'text-gray-400'}`}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <DataTable<Batch>
            columns={columns}
            data={filteredBatches}
            rowKey="id"
            loading={loading}
            emptyText="暂无批次数据，请点击'新增批次'按钮创建"
            pagination={{
              current: page,
              pageSize,
              total: filteredBatches.length,
              onChange: setPage,
            }}
            onRowClick={(row) => navigate(`/batches/${row.id}`)}
          />
        </CardBody>
      </Card>
    </div>
  );
}
