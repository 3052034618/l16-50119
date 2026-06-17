import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Package, AlertTriangle, FileText, User, Check, Eye, Building2, Store } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { RecallLevelTag } from '@/components/ui/StatusTag';
import { useBatchStore } from '@/store/batchStore';
import { useRecallStore } from '@/store/recallStore';
import type { Batch } from '@/types/batch';
import type { RecallLevel, RecallNotification } from '@/types/recall';
import { clsx } from 'clsx';

interface FormData {
  batchId: string;
  reason: string;
  level: RecallLevel;
  scope: string;
  initiator: string;
}

interface FormErrors {
  batchId?: string;
  reason?: string;
  level?: string;
  scope?: string;
  initiator?: string;
}

export default function RecallInitiate() {
  const { batches, initBatches, getBatch } = useBatchStore();
  const { createRecall, queryDownstream } = useRecallStore();

  const [formData, setFormData] = useState<FormData>({
    batchId: '',
    reason: '',
    level: 'level2',
    scope: '',
    initiator: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downstreamPreview, setDownstreamPreview] = useState<RecallNotification[]>([]);

  useEffect(() => {
    initBatches();
  }, [initBatches]);

  const shippedBatches = useMemo(() => {
    return batches.filter(
      (b) => b.status === 'shipped' || b.status === 'recalling' || b.remainingQty < b.quantity
    );
  }, [batches]);

  const selectedBatch: Batch | undefined = useMemo(() => {
    return getBatch(formData.batchId);
  }, [getBatch, formData.batchId]);

  useEffect(() => {
    if (formData.batchId) {
      setPreviewLoading(true);
      setTimeout(() => {
        const preview = queryDownstream(formData.batchId);
        setDownstreamPreview(preview);
        setPreviewLoading(false);
      }, 300);
    } else {
      setDownstreamPreview([]);
    }
  }, [formData.batchId, queryDownstream]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value as never }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.batchId) {
      newErrors.batchId = '请选择召回批次';
    } else if (downstreamPreview.length === 0) {
      newErrors.batchId = '该批次暂无可召回的下游流向';
    }

    if (!formData.reason.trim()) {
      newErrors.reason = '请填写召回原因';
    }

    if (!formData.level) {
      newErrors.level = '请选择召回等级';
    }

    if (!formData.scope.trim()) {
      newErrors.scope = '请填写召回范围';
    }

    if (!formData.initiator.trim()) {
      newErrors.initiator = '请填写发起人姓名';
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

      createRecall({
        batchId: formData.batchId,
        batchNo: batch?.batchNo,
        productName: batch?.productName,
        reason: formData.reason,
        level: formData.level,
        scope: formData.scope,
        initiator: formData.initiator,
        status: 'pending',
      });

      setSuccessMsg('召回事件创建成功！');

      setTimeout(() => {
        setFormData({
          batchId: '',
          reason: '',
          level: 'level2',
          scope: '',
          initiator: '',
        });
        setDownstreamPreview([]);
        setSuccessMsg('');
      }, 2000);
    } catch (error) {
      console.error('创建召回失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      batchId: '',
      reason: '',
      level: 'level2',
      scope: '',
      initiator: '',
    });
    setErrors({});
    setSuccessMsg('');
    setDownstreamPreview([]);
  };

  const totalNotified = downstreamPreview.length;
  const dealerCount = downstreamPreview.filter((n) => n.recipientType === 'dealer').length;
  const storeCount = downstreamPreview.filter((n) => n.recipientType === 'store').length;
  const totalQty = downstreamPreview.reduce((sum, n) => sum + n.quantity, 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <button
            className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            onClick={() => {}}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">发起质量召回</h1>
            <p className="page-subtitle">选择问题批次，系统自动查询下游流向并发起召回通知</p>
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
              <CardTitle icon={<Package size={18} />}>选择召回批次</CardTitle>
            </CardHeader>
            <CardBody className="p-6 space-y-5">
              <div>
                <Select
                  label="问题批次"
                  required
                  value={formData.batchId}
                  onChange={(e) => handleInputChange('batchId', e.target.value)}
                  error={errors.batchId}
                >
                  <option value="">请选择需要召回的批次</option>
                  {shippedBatches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batchNo} - {b.productName} (已发: {(b.quantity - b.remainingQty).toLocaleString()})
                    </option>
                  ))}
                </Select>
              </div>

              {selectedBatch && (
                <div className="p-4 rounded-lg bg-red-50/50 border border-red-100 space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">批次号</p>
                      <p className="font-medium text-alert-danger">{selectedBatch.batchNo}</p>
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
                  <div className="grid grid-cols-3 gap-4 pt-3 border-t border-red-100/60 text-sm">
                    <div>
                      <p className="text-gray-500">总生产数量</p>
                      <p className="font-medium text-gray-800">{selectedBatch.quantity.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">已发货数量</p>
                      <p className="font-semibold text-alert-danger text-lg">
                        {(selectedBatch.quantity - selectedBatch.remainingQty).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">剩余在库</p>
                      <p className="font-medium text-gray-800">
                        {selectedBatch.remainingQty.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card padding="none">
            <CardHeader divider className="px-6 pt-4">
              <CardTitle icon={<AlertTriangle size={18} />}>召回信息</CardTitle>
            </CardHeader>
            <CardBody className="p-6 space-y-5">
              <div>
                <Select
                  label="召回等级"
                  required
                  value={formData.level}
                  onChange={(e) => handleInputChange('level', e.target.value)}
                  error={errors.level}
                >
                  <option value="level1">一级召回（紧急）- 存在严重健康风险</option>
                  <option value="level2">二级召回（重要）- 存在潜在健康风险</option>
                  <option value="level3">三级召回（一般）- 标签或包装问题</option>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(['level1', 'level2', 'level3'] as RecallLevel[]).map((level) => (
                  <div
                    key={level}
                    onClick={() => handleInputChange('level', level)}
                    className={clsx(
                      'p-3 rounded-lg border-2 cursor-pointer transition-all text-center',
                      formData.level === level
                        ? level === 'level1'
                          ? 'border-red-500 bg-red-50'
                          : level === 'level2'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    )}
                  >
                    <RecallLevelTag level={level} />
                  </div>
                ))}
              </div>

              <Textarea
                label="召回原因"
                required
                placeholder="请详细描述召回原因，如：检测出XX指标超标、消费者投诉反映XX问题、供应商通知原料存在风险等"
                rows={4}
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                error={errors.reason}
              />

              <Textarea
                label="召回范围"
                required
                placeholder="请描述召回的地理范围、渠道范围等，如：全国范围内所有经销商和门店、华东地区所有大卖场渠道等"
                rows={3}
                value={formData.scope}
                onChange={(e) => handleInputChange('scope', e.target.value)}
                error={errors.scope}
              />

              <Input
                label="发起人"
                required
                placeholder="请输入召回发起人姓名"
                icon={<User size={16} />}
                value={formData.initiator}
                onChange={(e) => handleInputChange('initiator', e.target.value)}
                error={errors.initiator}
              />
            </CardBody>
          </Card>

          <Card padding="none">
            <CardHeader divider className="px-6 pt-4">
              <CardTitle icon={<Eye size={18} />}>下游流向预览</CardTitle>
            </CardHeader>
            <CardBody className="p-6">
              {!formData.batchId ? (
                <div className="p-12 text-center text-gray-400">
                  <Package size={48} className="mx-auto mb-3 opacity-40" />
                  <p>请先选择批次以预览下游流向</p>
                </div>
              ) : previewLoading ? (
                <div className="p-12 text-center text-gray-400">
                  <div className="animate-spin h-8 w-8 mx-auto mb-3 border-4 border-brand-200 border-t-brand-600 rounded-full" />
                  <p>正在查询下游流向...</p>
                </div>
              ) : downstreamPreview.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <AlertTriangle size={48} className="mx-auto mb-3 opacity-40" />
                  <p>该批次暂无可召回的下游流向记录</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                      <p className="text-xs text-blue-600 mb-1">通知总数</p>
                      <p className="text-xl font-bold text-blue-700">{totalNotified}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-brand-50 border border-brand-100">
                      <p className="text-xs text-brand-600 mb-1">经销商</p>
                      <p className="text-xl font-bold text-brand-700">{dealerCount}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                      <p className="text-xs text-indigo-600 mb-1">终端门店</p>
                      <p className="text-xl font-bold text-indigo-700">{storeCount}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <p className="text-xs text-amber-600 mb-1">涉及总数量</p>
                      <p className="text-xl font-bold text-amber-700">{totalQty.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="border border-gray-100 rounded-lg overflow-hidden">
                    <div className="max-h-[300px] overflow-y-auto scrollbar-thin">
                      <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="table-header text-left">类型</th>
                            <th className="table-header text-left">接收方</th>
                            <th className="table-header text-left">联系人</th>
                            <th className="table-header text-right">涉及数量</th>
                          </tr>
                        </thead>
                        <tbody>
                          {downstreamPreview.map((item, idx) => (
                            <tr key={item.id} className={clsx('table-row', idx % 2 === 1 && 'bg-gray-50/30')}>
                              <td className="table-cell">
                                <span className={clsx(
                                  'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
                                  item.recipientType === 'dealer'
                                    ? 'bg-brand-50 text-brand-700'
                                    : 'bg-blue-50 text-blue-700'
                                )}>
                                  {item.recipientType === 'dealer' ? (
                                    <><Building2 size={12} />经销商</>
                                  ) : (
                                    <><Store size={12} />门店</>
                                  )}
                                </span>
                              </td>
                              <td className="table-cell font-medium text-gray-800">
                                {item.recipientName}
                              </td>
                              <td className="table-cell text-gray-600 text-sm">
                                {item.contact}
                              </td>
                              <td className="table-cell text-right font-medium text-gray-800">
                                {item.quantity.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card padding="md" hover>
            <CardHeader divider>
              <CardTitle icon={<FileText size={18} />}>召回信息汇总</CardTitle>
            </CardHeader>
            <CardBody className="pt-4 space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">召回批次</span>
                  <span className="font-medium text-alert-danger">
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
                  <span className="text-gray-500">召回等级</span>
                  <RecallLevelTag level={formData.level} size={12} />
                </div>
                <div className="h-px bg-gray-100" />
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">下游通知</span>
                  <span className="font-medium text-brand-700">{totalNotified} 条</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">涉及数量</span>
                  <span className="font-bold text-lg text-alert-warn">
                    {totalQty.toLocaleString()}
                  </span>
                </div>
                <div className="h-px bg-gray-100" />
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">发起人</span>
                  <span className="font-medium text-gray-800">
                    {formData.initiator || '-'}
                  </span>
                </div>
              </div>

              {formData.reason && (
                <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">召回原因</p>
                  <p className="text-sm text-gray-700 line-clamp-3">{formData.reason}</p>
                </div>
              )}

              {formData.scope && (
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">召回范围</p>
                  <p className="text-sm text-gray-700 line-clamp-2">{formData.scope}</p>
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
                variant="danger"
                icon={<AlertTriangle size={16} />}
                loading={submitting}
                onClick={handleSubmit}
              >
                确认发起召回
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
