import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Truck as TruckIcon,
  Plus,
  Edit2,
  Trash2,
  Search,
  Phone,
  User,
  MapPin,
  Award,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileCheck2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { DataTable, Column } from '@/components/DataTable';
import { useBaseStore } from '@/store/baseStore';
import {
  formatDate,
  isExpiringSoon,
  isExpired,
  daysUntilExpiry,
  today,
} from '@/utils/date';
import Empty from '@/components/Empty';
import type { Supplier } from '@/types/master';

interface SupplierFormData {
  name: string;
  contact: string;
  phone: string;
  licenseNo: string;
  licenseExpiry: string;
  address: string;
}

const initialFormData: SupplierFormData = {
  name: '',
  contact: '',
  phone: '',
  licenseNo: '',
  licenseExpiry: '',
  address: '',
};

export default function SupplierManagement() {
  const suppliers = useBaseStore((s) => s.suppliers);
  const initBase = useBaseStore((s) => s.initBase);
  const createSupplier = useBaseStore((s) => s.createSupplier);
  const updateSupplier = useBaseStore((s) => s.updateSupplier);
  const deleteSupplier = useBaseStore((s) => s.deleteSupplier);

  useState(() => initBase());

  const [searchKeyword, setSearchKeyword] = useState('');
  const [licenseFilter, setLicenseFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [deleteConfirm, setDeleteConfirm] = useState<Supplier | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredSuppliers = useMemo(() => {
    let result = [...suppliers];
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(kw) ||
          s.contact.toLowerCase().includes(kw) ||
          s.phone.includes(kw) ||
          s.licenseNo.toLowerCase().includes(kw) ||
          s.address.toLowerCase().includes(kw)
      );
    }
    if (licenseFilter) {
      result = result.filter((s) => {
        const expired = isExpired(s.licenseExpiry);
        const expiringSoon = isExpiringSoon(s.licenseExpiry, 30);
        switch (licenseFilter) {
          case 'expired':
            return expired;
          case 'expiring':
            return expiringSoon && !expired;
          case 'valid':
            return !expired && !expiringSoon;
          default:
            return true;
        }
      });
    }
    return result;
  }, [suppliers, searchKeyword, licenseFilter]);

  const stats = useMemo(() => {
    let expired = 0;
    let expiring = 0;
    let valid = 0;
    suppliers.forEach((s) => {
      if (isExpired(s.licenseExpiry)) expired++;
      else if (isExpiringSoon(s.licenseExpiry, 30)) expiring++;
      else valid++;
    });
    return { total: suppliers.length, expired, expiring, valid };
  }, [suppliers]);

  const openCreateModal = () => {
    setEditingSupplier(null);
    setFormData(initialFormData);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact: supplier.contact,
      phone: supplier.phone,
      licenseNo: supplier.licenseNo,
      licenseExpiry: supplier.licenseExpiry,
      address: supplier.address,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = '请输入供应商名称';
    if (!formData.contact.trim()) errors.contact = '请输入联系人姓名';
    if (!formData.phone.trim()) {
      errors.phone = '请输入联系电话';
    } else if (!/^1[3-9]\d{9}$|^0\d{2,3}-?\d{7,8}$/.test(formData.phone.trim())) {
      errors.phone = '请输入正确的手机号码或固定电话';
    }
    if (!formData.licenseNo.trim()) errors.licenseNo = '请输入资质编号';
    if (!formData.licenseExpiry.trim()) {
      errors.licenseExpiry = '请选择资质有效期';
    } else if (formData.licenseExpiry < today()) {
      errors.licenseExpiry = '资质有效期不能早于今天';
    }
    if (!formData.address.trim()) errors.address = '请输入供应商地址';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, formData);
      showToast('success', `供应商"${formData.name}"更新成功`);
    } else {
      createSupplier(formData);
      showToast('success', `供应商"${formData.name}"创建成功`);
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    deleteSupplier(deleteConfirm.id);
    showToast('success', `供应商"${deleteConfirm.name}"已删除`);
    setDeleteConfirm(null);
  };

  const renderLicenseTag = (licenseExpiry: string) => {
    const expired = isExpired(licenseExpiry);
    const expiring = isExpiringSoon(licenseExpiry, 30);
    const daysLeft = daysUntilExpiry(licenseExpiry);

    if (expired) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-alert-danger text-xs font-medium">
          <AlertCircle size={12} />
          已过期
        </span>
      );
    }
    if (expiring) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-alert-warn text-xs font-medium animate-pulse">
          <AlertTriangle size={12} />
          临期 {daysLeft}天
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-medium">
        <CheckCircle2 size={12} />
        有效
      </span>
    );
  };

  const columns: Column<Supplier>[] = [
    {
      key: 'name',
      title: '供应商名称',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <TruckIcon size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="font-medium text-gray-800">{row.name}</p>
            <p className="text-xs text-gray-400">ID: {row.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'licenseNo',
      title: '资质编号',
      render: (row) => (
        <div className="flex items-center gap-2">
          <FileCheck2 size={14} className="text-gray-400" />
          <span className="font-mono text-sm text-gray-700">{row.licenseNo}</span>
        </div>
      ),
    },
    {
      key: 'licenseExpiry',
      title: '资质有效期',
      render: (row) => (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarIcon size={14} className="text-gray-400" />
            <span className="text-sm text-gray-700">{formatDate(row.licenseExpiry)}</span>
          </div>
          {renderLicenseTag(row.licenseExpiry)}
        </div>
      ),
    },
    {
      key: 'contact',
      title: '联系人',
      render: (row) => (
        <div className="flex items-center gap-2">
          <User size={14} className="text-gray-400" />
          <span className="text-gray-700">{row.contact}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      title: '联系电话',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Phone size={14} className="text-gray-400" />
          <span className="text-gray-700 font-mono text-sm">{row.phone}</span>
        </div>
      ),
    },
    {
      key: 'address',
      title: '地址',
      width: '240px',
      render: (row) => (
        <div className="flex items-start gap-2">
          <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <span className="text-gray-600 text-sm line-clamp-2">{row.address}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: '140px',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon={<Edit2 size={14} />}
            onClick={() => openEditModal(row)}
          >
            编辑
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-alert-danger hover:text-alert-danger hover:bg-red-50"
            icon={<Trash2 size={14} />}
            onClick={() => setDeleteConfirm(row)}
          >
            删除
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          className={`fixed top-6 left-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
            toast.type === 'success'
              ? 'bg-brand-700 text-white'
              : 'bg-alert-danger text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          {toast.message}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="page-header"
      >
        <div>
          <h1 className="page-title">原料供应商管理</h1>
          <p className="page-subtitle">管理原料供应商档案、资质有效期及预警提醒</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={openCreateModal}>
          新增供应商
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-4 gap-4 mb-6"
      >
        <Card padding="md" className="bg-gradient-to-br from-brand-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">供应商总数</p>
              <p className="text-3xl font-bold text-brand-700 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
              <TruckIcon size={24} className="text-brand-700" />
            </div>
          </div>
        </Card>
        <Card padding="md" className="bg-gradient-to-br from-brand-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">资质有效</p>
              <p className="text-3xl font-bold text-brand-700 mt-1">{stats.valid}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle2 size={24} className="text-green-600" />
            </div>
          </div>
        </Card>
        <Card padding="md" className="bg-gradient-to-br from-amber-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">临期预警</p>
              <p className="text-3xl font-bold text-alert-warn mt-1">{stats.expiring}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <AlertTriangle size={24} className="text-alert-warn" />
            </div>
          </div>
        </Card>
        <Card padding="md" className="bg-gradient-to-br from-red-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已过期</p>
              <p className="text-3xl font-bold text-alert-danger mt-1">{stats.expired}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertCircle size={24} className="text-alert-danger" />
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card>
          <CardHeader divider>
            <CardTitle icon={<Award size={20} />}>
              供应商列表
              <span className="ml-2 text-xs font-normal text-gray-400">
                共 {filteredSuppliers.length} 家供应商
              </span>
            </CardTitle>
            <div className="flex items-center gap-3">
              <Input
                placeholder="搜索供应商/联系人/资质编号"
                icon={<Search size={16} />}
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setPage(1);
                }}
                className="w-72"
              />
              <select
                className="select-base w-40"
                value={licenseFilter}
                onChange={(e) => {
                  setLicenseFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">全部资质状态</option>
                <option value="valid">资质有效</option>
                <option value="expiring">临期预警</option>
                <option value="expired">已过期</option>
              </select>
            </div>
          </CardHeader>
          <CardBody>
            {filteredSuppliers.length > 0 ? (
              <DataTable
                columns={columns}
                data={filteredSuppliers}
                rowKey="id"
                pagination={{
                  current: page,
                  pageSize,
                  total: filteredSuppliers.length,
                  onChange: setPage,
                }}
              />
            ) : (
              <Empty
                title="暂无供应商数据"
                description="点击右上角'新增供应商'按钮开始创建"
                icon={<TruckIcon size={48} className="text-gray-300" />}
              />
            )}
          </CardBody>
        </Card>
      </motion.div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSupplier ? '编辑供应商' : '新增供应商'}
        width="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              {editingSupplier ? '保存修改' : '确认创建'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="供应商名称"
                required
                placeholder="请输入供应商公司全称"
                icon={<TruckIcon size={16} />}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={formErrors.name}
              />
            </div>
            <Input
              label="资质编号"
              required
              placeholder="食品经营许可证/SC编号"
              icon={<Award size={16} />}
              value={formData.licenseNo}
              onChange={(e) => setFormData({ ...formData, licenseNo: e.target.value })}
              error={formErrors.licenseNo}
            />
            <Input
              type="date"
              label="资质有效期至"
              required
              icon={<CalendarIcon size={16} />}
              min={today()}
              value={formData.licenseExpiry}
              onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
              error={formErrors.licenseExpiry}
            />
            <Input
              label="联系人"
              required
              placeholder="请输入对接人姓名"
              icon={<User size={16} />}
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              error={formErrors.contact}
            />
            <Input
              label="联系电话"
              required
              placeholder="手机号码或固定电话"
              icon={<Phone size={16} />}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              error={formErrors.phone}
            />
          </div>
          <label className="label-base flex items-center gap-2">
            <MapPin size={14} className="text-gray-500" />
            公司地址
            <span className="text-alert-danger ml-0.5">*</span>
          </label>
          <Textarea
            placeholder="请输入供应商详细地址"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            rows={3}
            error={formErrors.address}
          />
        </div>
      </Modal>

      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="确认删除供应商"
        width="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
              取消
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              确认删除
            </Button>
          </>
        }
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-alert-danger" />
          </div>
          <p className="text-gray-800 font-medium mb-2">
            确定要删除供应商
            <span className="text-alert-danger font-bold"> "{deleteConfirm?.name}" </span>
            吗？
          </p>
          <p className="text-sm text-gray-500">
            删除后已关联的批次原料来源记录可能受影响，此操作不可撤销。
          </p>
        </div>
      </Modal>
    </div>
  );
}
