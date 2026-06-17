import { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  Package,
  Factory,
  ClipboardCheck,
  QrCode,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { InspectionResultTag } from '@/components/ui/StatusTag';
import { QrCodeSmall } from '@/components/QrCode';
import { useBatchStore } from '@/store/batchStore';
import { useBaseStore } from '@/store/baseStore';
import type { RawMaterial, InspectionItem, InspectionResult } from '@/types';
import { generateBatchNo, generateTraceCode, generateId } from '@/utils/idGenerator';
import { addDays, today, now } from '@/utils/date';
import type { Supplier } from '@/types/master';

interface FormState {
  productName: string;
  batchNo: string;
  productionDate: string;
  shelfLife: string;
  expiryDate: string;
  quantity: string;
  remark: string;
  inspector: string;
  rawMaterials: (RawMaterial & { _key?: string })[];
  inspectionItems: (InspectionItem & { _key?: string })[];
  traceCode: string;
}

function emptyRawMaterial(suppliers: Supplier[]): RawMaterial & { _key: string } {
  return {
    _key: Math.random().toString(36).slice(2, 10),
    id: '',
    name: '',
    supplierId: suppliers[0]?.id || '',
    supplierName: suppliers[0]?.name || '',
    batchNo: '',
    quantity: 0,
  };
}

function emptyInspectionItem(): InspectionItem & { _key: string } {
  return {
    _key: Math.random().toString(36).slice(2, 10),
    name: '',
    standard: '',
    result: '',
    status: 'pass',
  };
}

export default function BatchForm() {
  const navigate = useNavigate();
  const { createBatch, initBatches } = useBatchStore();
  const { suppliers, initBase } = useBaseStore();

  const [form, setForm] = useState<FormState>({
    productName: '',
    batchNo: generateBatchNo(),
    productionDate: today(),
    shelfLife: '180',
    expiryDate: addDays(today(), 180),
    quantity: '',
    remark: '',
    inspector: '',
    rawMaterials: [],
    inspectionItems: [],
    traceCode: generateTraceCode(),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    initBatches();
    initBase();
  }, [initBatches, initBase]);

  useEffect(() => {
    if (form.productionDate && form.shelfLife) {
      const days = parseInt(form.shelfLife) || 0;
      if (days > 0) {
        setForm((prev) => ({ ...prev, expiryDate: addDays(prev.productionDate, days) }));
      }
    }
  }, [form.productionDate, form.shelfLife]);

  const supplierOptions = suppliers.map((s) => ({ value: s.id, label: s.name }));

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as string];
        return next;
      });
    }
  };

  const regenerateBatchNo = () => updateField('batchNo', generateBatchNo());
  const regenerateTraceCode = () => updateField('traceCode', generateTraceCode());

  const addRawMaterial = () => {
    updateField('rawMaterials', [
      ...form.rawMaterials,
      emptyRawMaterial(suppliers),
    ] as FormState['rawMaterials']);
  };

  const removeRawMaterial = (idx: number) => {
    updateField('rawMaterials', form.rawMaterials.filter((_, i) => i !== idx));
  };

  const updateRawMaterial = (idx: number, field: keyof RawMaterial, value: unknown) => {
    const next = [...form.rawMaterials];
    const rm = { ...next[idx], [field]: value };
    if (field === 'supplierId') {
      const supplier = suppliers.find((s) => s.id === value);
      rm.supplierName = supplier?.name || '';
    }
    next[idx] = rm;
    updateField('rawMaterials', next);
  };

  const addInspectionItem = () => {
    updateField('inspectionItems', [
      ...form.inspectionItems,
      emptyInspectionItem(),
    ] as FormState['inspectionItems']);
  };

  const removeInspectionItem = (idx: number) => {
    updateField('inspectionItems', form.inspectionItems.filter((_, i) => i !== idx));
  };

  const updateInspectionItem = (idx: number, field: keyof InspectionItem, value: unknown) => {
    const next = [...form.inspectionItems];
    next[idx] = { ...next[idx], [field]: value } as FormState['inspectionItems'][number];
    updateField('inspectionItems', next);
  };

  const toggleInspectionStatus = (idx: number) => {
    const next = [...form.inspectionItems];
    next[idx] = {
      ...next[idx],
      status: next[idx].status === 'pass' ? 'fail' : 'pass',
    };
    updateField('inspectionItems', next);
  };

  const inspectionOverall = (): 'qualified' | 'unqualified' => {
    if (form.inspectionItems.length === 0) return 'qualified';
    return form.inspectionItems.every((i) => i.status === 'pass') ? 'qualified' : 'unqualified';
  };

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!form.productName.trim()) nextErrors.productName = '请输入产品名称';
    if (!form.batchNo.trim()) nextErrors.batchNo = '请输入批次号';
    if (!form.productionDate) nextErrors.productionDate = '请选择生产日期';
    const sl = parseInt(form.shelfLife);
    if (!form.shelfLife || isNaN(sl) || sl <= 0) nextErrors.shelfLife = '请输入有效的保质期';
    const qty = parseInt(form.quantity);
    if (!form.quantity || isNaN(qty) || qty <= 0) nextErrors.quantity = '请输入有效的生产数量';

    form.rawMaterials.forEach((rm, idx) => {
      if (!rm.name.trim()) nextErrors[`rm_name_${idx}`] = '请输入原料名称';
      if (!rm.batchNo.trim()) nextErrors[`rm_batchNo_${idx}`] = '请输入原料批次号';
      if (!rm.quantity || rm.quantity <= 0) nextErrors[`rm_qty_${idx}`] = '请输入数量';
    });

    form.inspectionItems.forEach((item, idx) => {
      if (!item.name.trim()) nextErrors[`insp_name_${idx}`] = '请输入检验项目名称';
      if (!item.standard.trim()) nextErrors[`insp_std_${idx}`] = '请输入检验标准';
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);

    const qty = parseInt(form.quantity);
    const shelfLife = parseInt(form.shelfLife);

    const cleanRaws: RawMaterial[] = form.rawMaterials.map((rm) => ({
      id: rm.id || generateId('rm_'),
      name: rm.name,
      supplierId: rm.supplierId,
      supplierName: rm.supplierName,
      batchNo: rm.batchNo,
      quantity: Number(rm.quantity),
    }));

    const cleanItems: InspectionItem[] = form.inspectionItems.map((it) => ({
      name: it.name,
      standard: it.standard,
      result: it.result,
      status: it.status,
    }));

    const inspection: InspectionResult = {
      items: cleanItems,
      overall: inspectionOverall(),
      inspector: form.inspector || '系统录入',
      inspectedAt: now(),
    };

    const status = inspection.overall === 'qualified' ? 'qualified' : 'unqualified';

    createBatch({
      productName: form.productName.trim(),
      batchNo: form.batchNo.trim(),
      productionDate: form.productionDate,
      shelfLife,
      expiryDate: form.expiryDate,
      quantity: qty,
      remainingQty: qty,
      rawMaterials: cleanRaws,
      inspection,
      traceCode: form.traceCode,
      status,
      remark: form.remark,
    });

    setTimeout(() => {
      setSubmitting(false);
      navigate('/batches');
    }, 400);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/batches')}
            className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title">新建批次</h1>
            <p className="page-subtitle">录入产品生产批次的完整信息，建立溯源档案</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/batches')}>
            取消
          </Button>
          <Button
            variant="primary"
            icon={<Save size={16} />}
            onClick={handleSubmit}
            loading={submitting}
          >
            保存批次
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader divider>
              <CardTitle icon={<Package size={20} />}>产品信息</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <Input
                    label="产品名称"
                    placeholder="请输入产品名称"
                    required
                    icon={<Package size={16} />}
                    value={form.productName}
                    onChange={(e) => updateField('productName', e.target.value)}
                    error={errors.productName}
                  />
                </div>
                <div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Input
                        label="批次号"
                        placeholder="系统自动生成"
                        required
                        value={form.batchNo}
                        onChange={(e) => updateField('batchNo', e.target.value)}
                        error={errors.batchNo}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={regenerateBatchNo}
                      className="shrink-0 h-[38px] px-3 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-brand-600 transition-colors"
                      title="重新生成"
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>
                </div>
                <div>
                  <Input
                    label="生产数量"
                    type="number"
                    min="1"
                    placeholder="请输入生产数量"
                    required
                    value={form.quantity}
                    onChange={(e) => updateField('quantity', e.target.value)}
                    error={errors.quantity}
                  />
                </div>
                <div>
                  <Input
                    label="生产日期"
                    type="date"
                    required
                    value={form.productionDate}
                    onChange={(e) => updateField('productionDate', e.target.value)}
                    error={errors.productionDate}
                  />
                </div>
                <div>
                  <Input
                    label="保质期(天)"
                    type="number"
                    min="1"
                    placeholder="例如：180"
                    required
                    value={form.shelfLife}
                    onChange={(e) => updateField('shelfLife', e.target.value)}
                    error={errors.shelfLife}
                  />
                </div>
                <div>
                  <Input
                    label="到期日期"
                    type="date"
                    value={form.expiryDate}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Input
                    label="检验员"
                    placeholder="请输入检验员姓名"
                    value={form.inspector}
                    onChange={(e) => updateField('inspector', e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <Textarea
                    label="备注"
                    placeholder="选填，输入批次备注信息"
                    rows={3}
                    value={form.remark}
                    onChange={(e) => updateField('remark', e.target.value)}
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader divider>
              <CardTitle icon={<Factory size={20} />}>原料来源</CardTitle>
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={addRawMaterial}
              >
                添加原料
              </Button>
            </CardHeader>
            <CardBody>
              {form.rawMaterials.length === 0 ? (
                <div className="border-2 border-dashed border-brand-100 rounded-card py-10 flex flex-col items-center text-center">
                  <Factory size={36} className="text-brand-300 mb-2" />
                  <p className="text-sm text-gray-500 mb-3">暂无原料信息，请添加使用的原料</p>
                  <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={addRawMaterial}>
                    添加第一条原料
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {form.rawMaterials.map((rm, idx) => (
                    <div
                      key={rm._key || idx}
                      className="p-4 rounded-card border border-gray-100 bg-gray-50/30"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-700 text-white text-xs font-medium">
                            {idx + 1}
                          </span>
                          <span className="text-sm font-medium text-gray-700">原料记录</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRawMaterial(idx)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-alert-danger hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <Input
                            label="原料名称"
                            placeholder="如：小麦粉"
                            required
                            value={rm.name}
                            onChange={(e) => updateRawMaterial(idx, 'name', e.target.value)}
                            error={errors[`rm_name_${idx}`]}
                          />
                        </div>
                        <div>
                          <Select
                            label="供应商"
                            required
                            value={rm.supplierId}
                            onChange={(e) => updateRawMaterial(idx, 'supplierId', e.target.value)}
                            options={supplierOptions}
                          />
                        </div>
                        <div>
                          <Input
                            label="原料批次号"
                            placeholder="原料生产批次"
                            required
                            value={rm.batchNo}
                            onChange={(e) => updateRawMaterial(idx, 'batchNo', e.target.value)}
                            error={errors[`rm_batchNo_${idx}`]}
                          />
                        </div>
                        <div>
                          <Input
                            label="使用数量"
                            type="number"
                            min="1"
                            placeholder="使用量"
                            required
                            value={rm.quantity || ''}
                            onChange={(e) =>
                              updateRawMaterial(idx, 'quantity', Number(e.target.value))
                            }
                            error={errors[`rm_qty_${idx}`]}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader divider>
              <CardTitle icon={<ClipboardCheck size={20} />}>检验项目</CardTitle>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">综合判定：</span>
                  <InspectionResultTag result={inspectionOverall() === 'qualified' ? 'pass' : 'fail'} />
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Plus size={14} />}
                  onClick={addInspectionItem}
                >
                  添加检验项
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {form.inspectionItems.length === 0 ? (
                <div className="border-2 border-dashed border-brand-100 rounded-card py-10 flex flex-col items-center text-center">
                  <ClipboardCheck size={36} className="text-brand-300 mb-2" />
                  <p className="text-sm text-gray-500 mb-3">暂无检验项目，请添加质量检验记录</p>
                  <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={addInspectionItem}>
                    添加第一条检验项
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {form.inspectionItems.map((item, idx) => (
                    <div
                      key={item._key || idx}
                      className={`p-4 rounded-card border transition-colors ${
                        item.status === 'fail'
                          ? 'border-red-100 bg-red-50/30'
                          : 'border-gray-100 bg-gray-50/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                              item.status === 'pass'
                                ? 'bg-brand-700 text-white'
                                : 'bg-alert-danger text-white'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="text-sm font-medium text-gray-700">检验项目</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleInspectionStatus(idx)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                              item.status === 'pass'
                                ? 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                                : 'bg-red-50 text-alert-danger hover:bg-red-100'
                            }`}
                          >
                            {item.status === 'pass' ? (
                              <><CheckCircle2 size={12} />合格</>
                            ) : (
                              <><XCircle size={12} />不合格</>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeInspectionItem(idx)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-alert-danger hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <Input
                            label="检验项目"
                            placeholder="如：水分含量"
                            required
                            value={item.name}
                            onChange={(e) => updateInspectionItem(idx, 'name', e.target.value)}
                            error={errors[`insp_name_${idx}`]}
                          />
                        </div>
                        <div>
                          <Input
                            label="检验标准"
                            placeholder="如：≤5.0%"
                            required
                            value={item.standard}
                            onChange={(e) => updateInspectionItem(idx, 'standard', e.target.value)}
                            error={errors[`insp_std_${idx}`]}
                          />
                        </div>
                        <div>
                          <Input
                            label="检验结果"
                            placeholder="如：3.8%"
                            value={item.result}
                            onChange={(e) => updateInspectionItem(idx, 'result', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader divider>
              <CardTitle icon={<QrCode size={20} />}>溯源码预览</CardTitle>
              <button
                type="button"
                onClick={regenerateTraceCode}
                className="inline-flex items-center gap-1 text-xs text-brand-700 hover:text-brand-800 transition-colors"
              >
                <RefreshCw size={12} />
                重新生成
              </button>
            </CardHeader>
            <CardBody>
              <div className="flex flex-col items-center">
                <div className="p-4 rounded-card bg-gradient-to-br from-brand-50 to-white border border-brand-100">
                  <QrCodeSmall value={form.traceCode} size={160} />
                </div>
                <div className="mt-4 text-center w-full">
                  <p className="text-xs text-gray-500 mb-1">产品溯源码</p>
                  <p className="text-sm font-mono font-medium text-gray-800 break-all bg-gray-50 px-3 py-2 rounded-md border border-gray-100">
                    {form.traceCode}
                  </p>
                </div>
                <div className="mt-4 w-full p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-alert-warn flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-alert-warn">提示</p>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                        溯源码是产品全链路追踪的唯一标识，保存后将用于生产环节扫码记录及消费者查询溯源信息。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader divider>
              <CardTitle>录入摘要</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">产品</span>
                  <span className="text-gray-800 font-medium truncate max-w-[180px]">
                    {form.productName || '待填写'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">批次号</span>
                  <span className="text-gray-800 font-mono">{form.batchNo}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">生产数量</span>
                  <span className="text-gray-800 font-medium">
                    {form.quantity ? `${form.quantity} 件` : '待填写'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">原料记录</span>
                  <span className="text-brand-600 font-medium">{form.rawMaterials.length} 条</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">检验项目</span>
                  <span className="text-brand-600 font-medium">{form.inspectionItems.length} 项</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">质量判定</span>
                  <InspectionResultTag result={inspectionOverall() === 'qualified' ? 'pass' : 'fail'} />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
                <Button
                  variant="primary"
                  icon={<Save size={16} />}
                  onClick={handleSubmit}
                  loading={submitting}
                >
                  保存并创建批次
                </Button>
                <Button variant="ghost" onClick={() => navigate('/batches')}>
                  返回列表
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
