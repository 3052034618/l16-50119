import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Building2, Truck, FileText, Check, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { useBatchStore } from '@/store/batchStore';
import { useShipmentStore } from '@/store/shipmentStore';
import { useBaseStore } from '@/store/baseStore';
import type { Batch } from '@/types/batch';
import type { Dealer, Store } from '@/types/master';
import { today } from '@/utils/date';
import { clsx } from 'clsx';

interface FormData {
  batchId: string;
  dealerId: string;
  storeIds: string[];
  quantity: string;
  shipmentDate: string;
  trackingNo: string;
  remark: string;
}

interface FormErrors {
  batchId?: string;
  dealerId?: string;
  storeIds?: string;
  quantity?: string;
  shipmentDate?: string;
  trackingNo?: string;
}

export default function ShipmentForm() {
  const navigate = useNavigate();
  const { batches, initBatches, getBatch } = useBatchStore();
  const { createShipment } = useShipmentStore();
  const { dealers, initBase, getStoresByDealer } = useBaseStore();

  const [formData, setFormData] = useState<FormData>({
    batchId: '',
    dealerId: '',
    storeIds: [],
    quantity: '',
    shipmentDate: today(),
    trackingNo: '',
    remark: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    initBatches();
    initBase();
  }, [initBatches, initBase]);

  const availableBatches = useMemo(() => {
    return batches.filter(
      (b) =>
        (b.status === 'in_stock' || b.status === 'qualified' || b.status === 'shipped') &&
        b.remainingQty > 0
    );
  }, [batches]);

  const selectedBatch: Batch | undefined = useMemo(() => {
    return getBatch(formData.batchId);
  }, [getBatch, formData.batchId]);

  const dealerStores: Store[] = useMemo(() => {
    if (!formData.dealerId) return [];
    return getStoresByDealer(formData.dealerId);
  }, [getStoresByDealer, formData.dealerId]);

  const selectedDealer: Dealer | undefined = useMemo(() => {
    return dealers.find((d) => d.id === formData.dealerId);
  }, [dealers, formData.dealerId]);

  const handleBatchChange = (batchId: string) => {
    setFormData((prev) => ({ ...prev, batchId }));
    setErrors((prev) => ({ ...prev, batchId: undefined }));
  };

  const handleDealerChange = (dealerId: string) => {
    setFormData((prev) => ({ ...prev, dealerId, storeIds: [] }));
    setErrors((prev) => ({ ...prev, dealerId: undefined, storeIds: undefined }));
  };

  const handleStoreToggle = (storeId: string) => {
    setFormData((prev) => {
      const newStoreIds = prev.storeIds.includes(storeId)
        ? prev.storeIds.filter((id) => id !== storeId)
        : [...prev.storeIds, storeId];
      return { ...prev, storeIds: newStoreIds };
    });
    setErrors((prev) => ({ ...prev, storeIds: undefined }));
  };

  const handleSelectAllStores = () => {
    if (formData.storeIds.length === dealerStores.length && dealerStores.length > 0) {
      setFormData((prev) => ({ ...prev, storeIds: [] }));
    } else {
      setFormData((prev) => ({
        ...prev,
        storeIds: dealerStores.map((s) => s.id),
      }));
    }
    setErrors((prev) => ({ ...prev, storeIds: undefined }));
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.batchId) {
      newErrors.batchId = '请选择发货批次';
    }

    if (!formData.dealerId) {
      newErrors.dealerId = '请选择经销商';
    }

    if (formData.storeIds.length === 0) {
      newErrors.storeIds = '请至少选择一个门店';
    }

    const qty = parseInt(formData.quantity);
    if (!formData.quantity || isNaN(qty) || qty <= 0) {
      newErrors.quantity = '请输入有效的发货数量';
    } else if (selectedBatch && qty > selectedBatch.remainingQty) {
      newErrors.quantity = `发货数量不能超过剩余库存 ${selectedBatch.remainingQty.toLocaleString()}`;
    }

    if (!formData.shipmentDate) {
      newErrors.shipmentDate = '请选择发货日期';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    setSuccessMsg('');

    try {
      const batch = getBatch(formData.batchId);
      const dealer = dealers.find((d) => d.id === formData.dealerId);
      const selectedStores = dealerStores.filter((s) =>
        formData.storeIds.includes(s.id)
      );

      createShipment({
        batchId: formData.batchId,
        batchNo: batch?.batchNo,
        dealerId: formData.dealerId,
        dealerName: dealer?.name,
        storeIds: formData.storeIds,
        storeNames: selectedStores.map((s) => s.name),
        quantity: parseInt(formData.quantity),
        shipmentDate: formData.shipmentDate,
        trackingNo: formData.trackingNo,
        status: 'transit',
        remark: formData.remark,
      });

      setSuccessMsg('发货登记成功！');

      setTimeout(() => {
        navigate('/shipments');
      }, 1500);
    } catch (error) {
      console.error('提交失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      batchId: '',
      dealerId: '',
      storeIds: [],
      quantity: '',
      shipmentDate: today(),
      trackingNo: '',
      remark: '',
    });
    setErrors({});
    setSuccessMsg('');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <button
            className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            onClick={() => navigate('/shipments')}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">新建发货登记</h1>
            <p className="page-subtitle">登记产品出库信息，分配经销商及门店，更新库存流向</p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 rounded-lg bg-brand-50 border border-brand-200 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
            <Check size={18} className="text-brand-700" />
          </div>
          <span className="font-medium text-brand-800">{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card padding="none">
            <CardHeader divider className="px-6 pt-4">
              <CardTitle icon={<Package size={18} />}>批次信息</CardTitle>
            </CardHeader>
            <CardBody className="p-6 space-y-5">
              <div>
                <Select
                  label="选择出库批次"
                  required
                  value={formData.batchId}
                  onChange={(e) => handleBatchChange(e.target.value)}
                  error={errors.batchId}
                >
                  <option value="">请选择批次</option>
                  {availableBatches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batchNo} - {b.productName} (剩余: {b.remainingQty.toLocaleString()})
                    </option>
                  ))}
                </Select>
              </div>

              {selectedBatch && (
                <div className="p-4 rounded-lg bg-brand-50/50 border border-brand-100 space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">批次号</p>
                      <p className="font-medium text-brand-700">{selectedBatch.batchNo}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">产品名称</p>
                      <p className="font-medium text-gray-800">{selectedBatch.productName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">生产日期</p>
                      <p className="font-medium text-gray-800">{selectedBatch.productionDate}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">保质期至</p>
                      <p className="font-medium text-gray-800">{selectedBatch.expiryDate}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-3 border-t border-brand-100/60 text-sm">
                    <div>
                      <p className="text-gray-500">总生产数量</p>
                      <p className="font-medium text-gray-800">{selectedBatch.quantity.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">剩余可发</p>
                      <p className="font-semibold text-brand-700 text-lg">{selectedBatch.remainingQty.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">已发货</p>
                      <p className="font-medium text-gray-800">
                        {(selectedBatch.quantity - selectedBatch.remainingQty).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card padding="none">
            <CardHeader divider className="px-6 pt-4">
              <CardTitle icon={<Building2 size={18} />}>经销商与门店</CardTitle>
            </CardHeader>
            <CardBody className="p-6 space-y-5">
              <div>
                <Select
                  label="选择经销商"
                  required
                  value={formData.dealerId}
                  onChange={(e) => handleDealerChange(e.target.value)}
                  error={errors.dealerId}
                >
                  <option value="">请选择经销商</option>
                  {dealers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} - {d.region}
                    </option>
                  ))}
                </Select>
              </div>

              {selectedDealer && (
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-100 text-sm mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <span className="text-gray-500">联系人：</span>
                      <span className="font-medium text-gray-800">{selectedDealer.contact}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">电话：</span>
                      <span className="font-medium text-gray-800">{selectedDealer.phone}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">地址：</span>
                      <span className="font-medium text-gray-800">{selectedDealer.address}</span>
                    </div>
                  </div>
                </div>
              )}

              {dealerStores.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="label-base !mb-0">
                      选择发货门店
                      <span className="text-alert-danger ml-0.5">*</span>
                      <span className="ml-2 text-xs text-gray-400 font-normal">
                        (已选 {formData.storeIds.length}/{dealerStores.length})
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={handleSelectAllStores}
                      className="text-xs text-brand-700 hover:text-brand-800 font-medium"
                    >
                      {formData.storeIds.length === dealerStores.length ? '取消全选' : '全选'}
                    </button>
                  </div>
                  {errors.storeIds && (
                    <p className="text-xs text-alert-danger mb-2">{errors.storeIds}</p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {dealerStores.map((store) => {
                      const isSelected = formData.storeIds.includes(store.id);
                      return (
                        <div
                          key={store.id}
                          onClick={() => handleStoreToggle(store.id)}
                          className={clsx(
                            'p-4 rounded-lg border-2 cursor-pointer transition-all',
                            isSelected
                              ? 'border-brand-500 bg-brand-50/70'
                              : 'border-gray-200 bg-white hover:border-brand-300 hover:bg-brand-50/30'
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div
                                className={clsx(
                                  'w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                                  isSelected
                                    ? 'border-brand-600 bg-brand-600'
                                    : 'border-gray-300 bg-white'
                                )}
                              >
                                {isSelected && <Check size={12} className="text-white" />}
                              </div>
                              <div>
                                <p className={clsx(
                                  'font-medium text-sm',
                                  isSelected ? 'text-brand-800' : 'text-gray-800'
                                )}>
                                  {store.name}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {store.contact} · {store.phone}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5 truncate">
                                  {store.address}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {formData.dealerId && dealerStores.length === 0 && (
                <div className="p-8 rounded-lg bg-gray-50 border border-gray-100 text-center">
                  <AlertCircle size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500 text-sm">该经销商暂未配置下属门店</p>
                </div>
              )}
            </CardBody>
          </Card>

          <Card padding="none">
            <CardHeader divider className="px-6 pt-4">
              <CardTitle icon={<Truck size={18} />}>物流信息</CardTitle>
            </CardHeader>
            <CardBody className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="发货数量"
                  type="number"
                  required
                  placeholder="请输入发货数量"
                  min={1}
                  max={selectedBatch?.remainingQty}
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  error={errors.quantity}
                />
                <Input
                  label="发货日期"
                  type="date"
                  required
                  value={formData.shipmentDate}
                  onChange={(e) => handleInputChange('shipmentDate', e.target.value)}
                  error={errors.shipmentDate}
                />
                <Input
                  label="运单号"
                  placeholder="请输入物流运单号"
                  value={formData.trackingNo}
                  onChange={(e) => handleInputChange('trackingNo', e.target.value)}
                  error={errors.trackingNo}
                  className="md:col-span-2"
                />
              </div>

              <Textarea
                label="备注"
                placeholder="可填写特殊说明，如运输要求、注意事项等"
                rows={3}
                value={formData.remark}
                onChange={(e) => handleInputChange('remark', e.target.value)}
              />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card padding="md" hover>
            <CardHeader divider>
              <CardTitle icon={<FileText size={18} />}>发货信息汇总</CardTitle>
            </CardHeader>
            <CardBody className="pt-4 space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">出库批次</span>
                  <span className="font-medium text-brand-700">
                    {selectedBatch?.batchNo || '未选择'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">产品名称</span>
                  <span className="font-medium text-gray-800">
                    {selectedBatch?.productName || '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">剩余库存</span>
                  <span className="font-medium text-gray-800">
                    {selectedBatch ? selectedBatch.remainingQty.toLocaleString() : '-'}
                  </span>
                </div>
                <div className="h-px bg-gray-100" />
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">经销商</span>
                  <span className="font-medium text-gray-800">
                    {selectedDealer?.name || '未选择'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">发货门店</span>
                  <span className="font-medium text-brand-700">
                    {formData.storeIds.length} 家
                  </span>
                </div>
                <div className="h-px bg-gray-100" />
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">发货数量</span>
                  <span className="font-bold text-lg text-alert-warn">
                    {formData.quantity ? parseInt(formData.quantity).toLocaleString() : '0'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">发货日期</span>
                  <span className="font-medium text-gray-800">
                    {formData.shipmentDate || '-'}
                  </span>
                </div>
              </div>

              {selectedBatch && formData.quantity && parseInt(formData.quantity) > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <p className="text-xs text-amber-700">
                    发货后剩余库存：
                    <span className="font-bold ml-1">
                      {Math.max(0, selectedBatch.remainingQty - parseInt(formData.quantity)).toLocaleString()}
                    </span>
                  </p>
                </div>
              )}
            </CardBody>
            <CardFooter>
              <Button
                variant="secondary"
                onClick={handleReset}
              >
                重置表单
              </Button>
              <Button
                variant="primary"
                loading={submitting}
                onClick={handleSubmit}
              >
                确认发货
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
