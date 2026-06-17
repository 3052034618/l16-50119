import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Calendar,
  Package,
  Factory,
  UserCheck,
  MessageSquare,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Leaf,
  Clock,
  ArrowLeft,
  QrCode,
} from 'lucide-react';
import { useBatchStore } from '@/store/batchStore';
import { useRecallStore } from '@/store/recallStore';
import { formatDate, daysUntilExpiry, isExpired } from '@/utils/date';
import { InspectionResultTag } from '@/components/ui/StatusTag';
import { QRCodeSVG } from 'qrcode.react';
import Empty from '@/components/Empty';
import type { Recall } from '@/types/recall';

export default function ConsumerTrace() {
  const { code } = useParams<{ code: string }>();
  const getBatchByTraceCode = useBatchStore((s) => s.getBatchByTraceCode);
  const listRecalls = useRecallStore((s) => s.listRecalls);
  const initBatches = useBatchStore((s) => s.initBatches);
  const initRecalls = useRecallStore((s) => s.initRecalls);

  const [batch, setBatch] = useState<ReturnType<typeof getBatchByTraceCode>>(undefined);
  const [recall, setRecall] = useState<Recall | undefined>(undefined);

  useEffect(() => {
    initBatches();
    initRecalls();
  }, [initBatches, initRecalls]);

  useEffect(() => {
    if (code) {
      const b = getBatchByTraceCode(code);
      setBatch(b);
      if (b) {
        const allRecalls = listRecalls();
        const matched = allRecalls.filter((r) => r.batchId === b.id);
        setRecall(matched.find((r) => r.status !== 'completed'));
      }
    }
  }, [code, getBatchByTraceCode, listRecalls]);

  if (!code || !batch) {
    return (
      <div className="min-h-screen gradient-bg">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-24 h-24 rounded-3xl bg-amber-50 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={64} className="text-alert-warn" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-gray-800 mb-3">
              {code ? '未找到该溯源码对应的产品信息' : '请提供溯源码'}
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              {code ? '请检查溯源码是否正确，或联系客服获取帮助。' : '请扫描产品包装上的溯源二维码进行查询。'}
            </p>
          </div>
          <div className="mt-8 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-brand-700 hover:text-brand-800 transition-colors"
            >
              <ArrowLeft size={18} />
              返回管理后台
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const daysLeft = daysUntilExpiry(batch.expiryDate);
  const expired = isExpired(batch.expiryDate);
  const isRecalling = recall !== undefined;

  return (
    <div className="min-h-screen gradient-bg pb-16">
      <div className="bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Leaf size={36} className="text-white" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold">绿源食品溯源平台</h1>
              <p className="text-brand-100 mt-1 text-sm">GreenSource Food Traceability Platform</p>
            </div>
          </motion.div>
        </div>
      </div>

      {isRecalling && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.4 }}
          className="bg-gradient-to-r from-alert-danger to-red-600 text-white"
        >
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-start gap-3">
            <AlertTriangle size={24} className="flex-shrink-0 mt-0.5 animate-pulse" />
            <div className="flex-1">
              <h3 className="font-bold text-lg">产品召回公告</h3>
              <p className="text-red-100 mt-1 text-sm leading-relaxed">
                {recall?.reason}
              </p>
              <p className="text-red-100 mt-2 text-xs">
                召回单号：{recall?.recallNo} | 发起时间：{formatDate(recall?.createdAt)}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="max-w-4xl mx-auto px-4 -mt-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-card shadow-hover p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h2 className="font-serif text-xl font-bold text-gray-800">{batch.productName}</h2>
                  <p className="text-gray-500 mt-1 text-sm">批次号：{batch.batchNo}</p>
                </div>
                {isRecalling ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', duration: 0.6, delay: 0.3 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-alert-danger"
                  >
                    <ShieldAlert size={22} className="animate-pulse" />
                    <span className="font-semibold">召回中</span>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ type: 'spring', duration: 0.6, delay: 0.3 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 text-brand-700"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <ShieldCheck size={22} />
                    </motion.div>
                    <span className="font-semibold">安全合格</span>
                  </motion.div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-brand-50/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Calendar size={16} />
                    生产日期
                  </div>
                  <p className="font-semibold text-gray-800 mt-1">{formatDate(batch.productionDate)}</p>
                </div>
                <div className="bg-brand-50/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Clock size={16} />
                    保质期至
                  </div>
                  <p className={`font-semibold mt-1 ${
                    expired ? 'text-alert-danger' : daysLeft <= 30 ? 'text-alert-warn' : 'text-gray-800'
                  }`}>
                    {formatDate(batch.expiryDate)}
                    {!expired && daysLeft <= 30 && (
                      <span className="ml-2 text-xs">（剩余{daysLeft}天）</span>
                    )}
                    {expired && <span className="ml-2 text-xs">（已过期）</span>}
                  </p>
                </div>
                <div className="bg-brand-50/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Package size={16} />
                    生产数量
                  </div>
                  <p className="font-semibold text-gray-800 mt-1">{batch.quantity.toLocaleString()} 件</p>
                </div>
                <div className="bg-brand-50/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <UserCheck size={16} />
                    检验员
                  </div>
                  <p className="font-semibold text-gray-800 mt-1">{batch.inspection.inspector}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-3">
              <div className="p-4 bg-white border-2 border-brand-100 rounded-xl">
                <QRCodeSVG
                  value={`${window.location.origin}/trace/${batch.traceCode}`}
                  size={140}
                  level="H"
                  fgColor="#1B5E20"
                />
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 flex items-center gap-1 justify-center">
                  <QrCode size={14} />
                  溯源码
                </p>
                <p className="font-mono text-brand-700 font-semibold text-sm mt-0.5">{batch.traceCode}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-card shadow-card p-6 mb-6"
        >
          <h3 className="font-serif text-lg font-semibold text-gray-800 flex items-center gap-2">
            <CheckCircle2 size={20} className="text-brand-700" />
            质量检验报告
          </h3>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <span className="text-gray-600">综合检验结果</span>
              <InspectionResultTag result={batch.inspection.overall === 'qualified' ? 'pass' : 'fail'} />
            </div>
            <div className="space-y-3">
              {batch.inspection.items.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + idx * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">标准：{item.standard}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">{item.result}</p>
                    {item.status === 'pass' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-brand-700 mt-1">
                        <CheckCircle2 size={12} /> 通过
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-alert-danger mt-1">
                        <XCircle size={12} /> 不通过
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4 text-right">
              检验时间：{formatDate(batch.inspection.inspectedAt)}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-card shadow-card p-6 mb-6"
        >
          <h3 className="font-serif text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Factory size={20} className="text-brand-700" />
            原料来源追溯
          </h3>
          <div className="mt-4 space-y-3">
            {batch.rawMaterials.map((rm, idx) => (
              <motion.div
                key={rm.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + idx * 0.1 }}
                className="flex items-center justify-between p-4 border border-brand-100 rounded-xl bg-gradient-to-r from-brand-50/30 to-transparent"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center">
                    <Leaf size={22} className="text-brand-700" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{rm.name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      供应商：<span className="text-brand-700">{rm.supplierName}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">批次号</p>
                  <p className="font-mono text-gray-700">{rm.batchNo}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-gradient-to-br from-brand-700 to-brand-800 rounded-card shadow-card p-6 text-white"
        >
          <h3 className="font-serif text-lg font-semibold flex items-center gap-2">
            <MessageSquare size={20} />
            投诉与建议
          </h3>
          <p className="text-brand-100 mt-2 text-sm">
            如您对产品有任何疑问或建议，欢迎联系我们的客服团队。我们将第一时间为您处理。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Phone size={22} />
              </div>
              <div>
                <p className="text-brand-100 text-xs">客服热线</p>
                <p className="font-bold text-lg">400-888-6666</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Mail size={22} />
              </div>
              <div>
                <p className="text-brand-100 text-xs">投诉邮箱</p>
                <p className="font-bold text-lg">service@greensource.com</p>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-white/10 text-center">
            <p className="text-brand-200 text-xs">
              © 2026 绿源食品有限公司 版权所有 | 食品经营许可证：JY13101000000000
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
