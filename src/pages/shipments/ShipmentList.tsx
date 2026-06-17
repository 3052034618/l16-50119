import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Filter, RefreshCw, Truck, Package, Download } from 'lucide-react';
import { DataTable, Column } from '@/components/DataTable';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { ShipmentStatusTag } from '@/components/ui/StatusTag';
import { useShipmentStore } from '@/store/shipmentStore';
import { useBaseStore } from '@/store/baseStore';
import type { Shipment, ShipmentStatus, ShipmentFilterParams } from '@/types/shipment';
import { formatDate } from '@/utils/date';
import { exportShipmentRecords } from '@/utils/export';

export default function ShipmentList() {
  const { shipments, initShipments, listShipments } = useShipmentStore();
  const { dealers, initBase } = useBaseStore();

  const [keyword, setKeyword] = useState('');
  const [dealerId, setDealerId] = useState('');
  const [status, setStatus] = useState<ShipmentStatus | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    initBase();
    initShipments();
  }, [initBase, initShipments]);

  const filters: ShipmentFilterParams = useMemo(() => ({
    keyword: keyword || undefined,
    dealerId: dealerId || undefined,
    status: status || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  }), [keyword, dealerId, status, startDate, endDate]);

  const filteredData = useMemo(() => listShipments(filters), [listShipments, filters]);

  const handleReset = () => {
    setKeyword('');
    setDealerId('');
    setStatus('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleExport = () => {
    exportShipmentRecords(filteredData);
  };

  const columns: Column<Shipment>[] = [
    {
      key: 'batchNo',
      title: '批次号',
      width: '140px',
      render: (row) => (
        <span className="font-medium text-brand-700">{row.batchNo}</span>
      ),
    },
    {
      key: 'dealerName',
      title: '经销商',
      width: '160px',
    },
    {
      key: 'storeNames',
      title: '发货门店',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.storeNames.map((name, idx) => (
            <span
              key={idx}
              className="inline-block px-2 py-0.5 bg-brand-50 text-brand-700 text-xs rounded"
            >
              {name}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'quantity',
      title: '发货数量',
      width: '100px',
      align: 'right',
      render: (row) => (
        <span className="font-medium">{row.quantity.toLocaleString()}</span>
      ),
    },
    {
      key: 'shipmentDate',
      title: '发货日期',
      width: '120px',
      render: (row) => formatDate(row.shipmentDate),
    },
    {
      key: 'trackingNo',
      title: '运单号',
      width: '160px',
      render: (row) => (
        <span className="text-gray-600 font-mono text-xs">{row.trackingNo || '-'}</span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      width: '100px',
      render: (row) => <ShipmentStatusTag status={row.status} />,
    },
    {
      key: 'remark',
      title: '备注',
      render: (row) => (
        <span className="text-gray-500 text-xs">{row.remark || '-'}</span>
      ),
    },
  ];

  const totalShipments = shipments.length;
  const inTransit = shipments.filter(s => s.status === 'transit').length;
  const delivered = shipments.filter(s => s.status === 'delivered').length;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">发货流向管理</h1>
          <p className="page-subtitle">管理产品出库登记、经销商分配及运输追踪</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon={<Download size={16} />}
            onClick={handleExport}
          >
            导出记录
          </Button>
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => {}}
          >
            新增发货
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card hover padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">发货总单数</p>
              <p className="text-3xl font-bold font-serif text-gray-800">
                {totalShipments}
              </p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-brand-50 flex items-center justify-center">
              <Package size={28} className="text-brand-600" />
            </div>
          </div>
        </Card>

        <Card hover padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">运输中</p>
              <p className="text-3xl font-bold font-serif text-blue-700">
                {inTransit}
              </p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center">
              <Truck size={28} className="text-blue-600" />
            </div>
          </div>
        </Card>

        <Card hover padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">已送达</p>
              <p className="text-3xl font-bold font-serif text-brand-700">
                {delivered}
              </p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-brand-50 flex items-center justify-center">
              <Package size={28} className="text-brand-600" />
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
              placeholder="批次号/经销商/运单号"
              icon={<Search size={16} />}
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(1);
              }}
            />

            <Select
              label="经销商"
              value={dealerId}
              onChange={(e) => {
                setDealerId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">全部经销商</option>
              {dealers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>

            <Select
              label="发货状态"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as ShipmentStatus | '');
                setPage(1);
              }}
            >
              <option value="">全部状态</option>
              <option value="transit">运输中</option>
              <option value="delivered">已送达</option>
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
          <DataTable<Shipment>
            columns={columns}
            data={filteredData}
            rowKey="id"
            pagination={{
              current: page,
              pageSize,
              total: filteredData.length,
              onChange: setPage,
            }}
            emptyText="暂无发货记录"
          />
        </div>
      </Card>
    </div>
  );
}
