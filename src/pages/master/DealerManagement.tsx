import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Search,
  Phone,
  User,
  MapPin,
  Globe,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { DataTable, Column } from '@/components/DataTable';
import { useBaseStore } from '@/store/baseStore';
import { formatDate } from '@/utils/date';
import Empty from '@/components/Empty';
import type { Dealer } from '@/types/master';

interface DealerFormData {
  name: string;
  contact: string;
  phone: string;
  region: string;
  address: string;
}

const initialFormData: DealerFormData = {
  name: '',
  contact: '',
  phone: '',
  region: '',
  address: '',
};

const regionOptions = [
  '华东地区',
  '华北地区',
  '华南地区',
  '华中地区',
  '西南地区',
  '西北地区',
  '东北地区',
  '港澳台地区',
];

export default function DealerManagement() {
  const dealers = useBaseStore((s) => s.dealers);
  const initBase = useBaseStore((s) => s.initBase);
  const createDealer = useBaseStore((s) => s.createDealer);
  const updateDealer = useBaseStore((s) => s.updateDealer);
  const deleteDealer = useBaseStore((s) => s.deleteDealer);
  const getStoresByDealer = useBaseStore((s) => s.getStoresByDealer);

  useState(() => initBase());

  const [searchKeyword, setSearchKeyword] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDealer, setEditingDealer] = useState<Dealer | null>(null);
  const [formData, setFormData] = useState<DealerFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [deleteConfirm, setDeleteConfirm] = useState<Dealer | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredDealers = useMemo(() => {
    let result = [...dealers];
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(kw) ||
          d.contact.toLowerCase().includes(kw) ||
          d.phone.includes(kw) ||
          d.region.toLowerCase().includes(kw)
      );
    }
    if (regionFilter) {
      result = result.filter((d) => d.region === regionFilter);
    }
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [dealers, searchKeyword, regionFilter]);

  const openCreateModal = () => {
    setEditingDealer(null);
    setFormData(initialFormData);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (dealer: Dealer) => {
    setEditingDealer(dealer);
    setFormData({
      name: dealer.name,
      contact: dealer.contact,
      phone: dealer.phone,
      region: dealer.region,
      address: dealer.address,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = '请输入经销商名称';
    if (!formData.contact.trim()) errors.contact = '请输入联系人姓名';
    if (!formData.phone.trim()) {
      errors.phone = '请输入联系电话';
    } else if (!/^1[3-9]\d{9}$|^0\d{2,3}-?\d{7,8}$/.test(formData.phone.trim())) {
      errors.phone = '请输入正确的手机号码或固定电话';
    }
    if (!formData.region.trim()) errors.region = '请选择所属区域';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    if (editingDealer) {
      updateDealer(editingDealer.id, formData);
      showToast('success', `经销商"${formData.name}"更新成功`);
    } else {
      createDealer(formData);
      showToast('success', `经销商"${formData.name}"创建成功`);
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    deleteDealer(deleteConfirm.id);
    showToast('success', `经销商"${deleteConfirm.name}"已删除（关联门店已同步移除）`);
    setDeleteConfirm(null);
  };

  const columns: Column<Dealer>[] = [
    {
      key: 'name',
      title: '经销商名称',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
            <Building2 size={20} className="text-brand-700" />
          </div>
          <div>
            <p className="font-medium text-gray-800">{row.name}</p>
            <p className="text-xs text-gray-400">ID: {row.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'region',
      title: '所属区域',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-medium">
          <Globe size={12} />
          {row.region}
        </span>
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
      key: 'stores',
      title: '关联门店',
      render: (row) => {
        const count = getStoresByDealer(row.id).length;
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
            count > 0 ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {count} 家
          </span>
        );
      },
    },
    {
      key: 'address',
      title: '地址',
      width: '220px',
      render: (row) => (
        <div className="flex items-start gap-2">
          <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <span className="text-gray-600 text-sm line-clamp-1">{row.address}</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      title: '创建时间',
      render: (row) => <span className="text-gray-500 text-sm">{formatDate(row.createdAt)}</span>,
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
          exit={{ opacity: 0, y: -20 }}
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
          <h1 className="page-title">经销商管理</h1>
          <p className="page-subtitle">管理所有合作经销商及其基础信息</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={openCreateModal}>
          新增经销商
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card>
          <CardHeader divider>
            <CardTitle icon={<Building2 size={20} />}>
              经销商列表
              <span className="ml-2 text-xs font-normal text-gray-400">
                共 {filteredDealers.length} 家经销商
              </span>
            </CardTitle>
            <div className="flex items-center gap-3">
              <Input
                placeholder="搜索经销商/联系人/电话"
                icon={<Search size={16} />}
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setPage(1);
                }}
                className="w-64"
              />
              <select
                className="select-base w-40"
                value={regionFilter}
                onChange={(e) => {
                  setRegionFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">全部区域</option>
                {regionOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardBody>
            {filteredDealers.length > 0 ? (
              <DataTable
                columns={columns}
                data={filteredDealers}
                rowKey="id"
                pagination={{
                  current: page,
                  pageSize,
                  total: filteredDealers.length,
                  onChange: setPage,
                }}
              />
            ) : (
              <Empty
                title="暂无经销商数据"
                description="点击右上角'新增经销商'按钮开始创建"
                icon={<Building2 size={48} className="text-gray-300" />}
              />
            )}
          </CardBody>
        </Card>
      </motion.div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDealer ? '编辑经销商' : '新增经销商'}
        width="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              {editingDealer ? '保存修改' : '确认创建'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input
              label="经销商名称"
              required
              placeholder="请输入经销商公司名称"
              icon={<Building2 size={16} />}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={formErrors.name}
            />
          </div>
          <Input
            label="联系人"
            required
            placeholder="请输入联系人姓名"
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
          <div className="col-span-2">
            <label className="label-base">
              所属区域
              <span className="text-alert-danger ml-0.5">*</span>
            </label>
            <select
              className={`select-base ${
                formErrors.region ? 'border-alert-danger focus:border-alert-danger' : ''
              }`}
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
            >
              <option value="">请选择所属区域</option>
              {regionOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {formErrors.region && (
              <p className="mt-1 text-xs text-alert-danger">{formErrors.region}</p>
            )}
          </div>
          <div className="col-span-2">
            <label className="label-base flex items-center gap-2">
              <MapPin size={14} className="text-gray-500" />
              详细地址
            </label>
            <Textarea
              placeholder="请输入公司详细地址"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="确认删除经销商"
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
            确定要删除经销商
            <span className="text-alert-danger font-bold"> "{deleteConfirm?.name}" </span>
            吗？
          </p>
          <p className="text-sm text-gray-500">
            删除后该经销商关联的 {deleteConfirm ? getStoresByDealer(deleteConfirm.id).length : 0} 家门店也将同步移除，此操作不可撤销。
          </p>
        </div>
      </Modal>

      {deleteConfirm && (
        <button
          className="sr-only"
          onClick={() => {}}
          aria-label="防止未使用警告"
        />
      )}
      {X && (
        <div className="hidden">
          <X />
        </div>
      )}
    </div>
  );
}
