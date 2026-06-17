import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Store,
  Plus,
  Edit2,
  Trash2,
  Search,
  Phone,
  User,
  MapPin,
  Building2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { DataTable, Column } from '@/components/DataTable';
import { useBaseStore } from '@/store/baseStore';
import Empty from '@/components/Empty';
import type { Dealer, Store as StoreType } from '@/types/master';

interface StoreFormData {
  name: string;
  dealerId: string;
  contact: string;
  phone: string;
  address: string;
}

const initialFormData: StoreFormData = {
  name: '',
  dealerId: '',
  contact: '',
  phone: '',
  address: '',
};

export default function StoreManagement() {
  const stores = useBaseStore((s) => s.stores);
  const dealers = useBaseStore((s) => s.dealers);
  const initBase = useBaseStore((s) => s.initBase);
  const createStore = useBaseStore((s) => s.createStore);
  const updateStore = useBaseStore((s) => s.updateStore);
  const deleteStore = useBaseStore((s) => s.deleteStore);
  const getDealerById = useBaseStore((s) => s.getDealerById);

  useState(() => initBase());

  const [searchKeyword, setSearchKeyword] = useState('');
  const [dealerFilter, setDealerFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreType | null>(null);
  const [formData, setFormData] = useState<StoreFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [deleteConfirm, setDeleteConfirm] = useState<StoreType | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredStores = useMemo(() => {
    let result = [...stores];
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(kw) ||
          s.contact.toLowerCase().includes(kw) ||
          s.phone.includes(kw) ||
          s.dealerName.toLowerCase().includes(kw) ||
          s.address.toLowerCase().includes(kw)
      );
    }
    if (dealerFilter) {
      result = result.filter((s) => s.dealerId === dealerFilter);
    }
    return result;
  }, [stores, searchKeyword, dealerFilter]);

  const dealerOptions = useMemo(
    () => dealers.map((d: Dealer) => ({ value: d.id, label: d.name })),
    [dealers]
  );

  const openCreateModal = () => {
    setEditingStore(null);
    setFormData(initialFormData);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (store: StoreType) => {
    setEditingStore(store);
    setFormData({
      name: store.name,
      dealerId: store.dealerId,
      contact: store.contact,
      phone: store.phone,
      address: store.address,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = '请输入门店名称';
    if (!formData.dealerId.trim()) errors.dealerId = '请选择所属经销商';
    if (!formData.contact.trim()) errors.contact = '请输入联系人姓名';
    if (!formData.phone.trim()) {
      errors.phone = '请输入联系电话';
    } else if (!/^1[3-9]\d{9}$|^0\d{2,3}-?\d{7,8}$/.test(formData.phone.trim())) {
      errors.phone = '请输入正确的手机号码或固定电话';
    }
    if (!formData.address.trim()) errors.address = '请输入门店地址';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const dealer = getDealerById(formData.dealerId);
    const data = {
      ...formData,
      dealerName: dealer?.name || '',
    };

    if (editingStore) {
      updateStore(editingStore.id, data);
      showToast('success', `门店"${formData.name}"更新成功`);
    } else {
      createStore(data);
      showToast('success', `门店"${formData.name}"创建成功`);
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    deleteStore(deleteConfirm.id);
    showToast('success', `门店"${deleteConfirm.name}"已删除`);
    setDeleteConfirm(null);
  };

  const columns: Column<StoreType>[] = [
    {
      key: 'name',
      title: '门店名称',
      render: (row) => (
        <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Store size={20} className="text-blue-600" />
        </div>
          <div>
            <p className="font-medium text-gray-800">{row.name}</p>
            <p className="text-xs text-gray-400">ID: {row.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'dealerName',
      title: '所属经销商',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Building2 size={14} className="text-brand-700" />
          <span className="text-gray-700">{row.dealerName}</span>
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
      title: '门店地址',
      width: '260px',
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
          <h1 className="page-title">门店管理</h1>
          <p className="page-subtitle">管理经销商下属的所有终端门店信息</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={openCreateModal}>
          新增门店
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card>
          <CardHeader divider>
            <CardTitle icon={<Store size={20} />}>
              门店列表
              <span className="ml-2 text-xs font-normal text-gray-400">
                共 {filteredStores.length} 家门店
              </span>
            </CardTitle>
            <div className="flex items-center gap-3">
              <Input
                placeholder="搜索门店/联系人/电话/地址"
                icon={<Search size={16} />}
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setPage(1);
                }}
                className="w-72"
              />
              <select
                className="select-base w-48"
                value={dealerFilter}
                onChange={(e) => {
                  setDealerFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">全部经销商</option>
                {dealerOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardBody>
            {filteredStores.length > 0 ? (
              <DataTable
                columns={columns}
                data={filteredStores}
                rowKey="id"
                pagination={{
                  current: page,
                  pageSize,
                  total: filteredStores.length,
                  onChange: setPage,
                }}
              />
            ) : (
              <Empty
                title="暂无门店数据"
                description="点击右上角'新增门店'按钮开始创建"
                icon={<Store size={48} className="text-gray-300" />}
              />
            )}
          </CardBody>
        </Card>
      </motion.div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingStore ? '编辑门店' : '新增门店'}
        width="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              {editingStore ? '保存修改' : '确认创建'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="门店名称"
                required
                placeholder="请输入门店全称"
                icon={<Store size={16} />}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={formErrors.name}
              />
            </div>
            <div className="col-span-2">
              <label className="label-base">
                所属经销商
                <span className="text-alert-danger ml-0.5">*</span>
              </label>
              <select
                className={`select-base ${
                formErrors.dealerId
                  ? 'border-alert-danger focus:border-alert-danger'
                  : ''
              }`}
                value={formData.dealerId}
                onChange={(e) =>
                  setFormData({ ...formData, dealerId: e.target.value })
              }
              >
                <option value="">请选择所属经销商</option>
                {dealerOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {formErrors.dealerId && (
                <p className="mt-1 text-xs text-alert-danger">{formErrors.dealerId}</p>
              )}
            </div>
            <Input
              label="联系人"
              required
              placeholder="请输入门店负责人姓名"
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
            门店地址
            <span className="text-alert-danger ml-0.5">*</span>
          </label>
          <Textarea
            placeholder="请输入门店详细地址"
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
        title="确认删除门店"
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
            确定要删除门店
            <span className="text-alert-danger font-bold"> "{deleteConfirm?.name}" </span>
            吗？
          </p>
          <p className="text-sm text-gray-500">
            删除后相关发货记录中的门店信息可能受影响，此操作不可撤销。
          </p>
        </div>
      </Modal>
    </div>
  );
}
