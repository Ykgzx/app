'use client';

import { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import StatsCard from '../components/StatsCard';
import Modal from '../components/Modal';
import { useToast } from '../components/AppLayout';
import { useAppStore } from '../data/store';
import {
  FolderOpen,
  Package,
  Plus,
  Pencil,
  Trash2,
  Search,
} from 'lucide-react';
import { Category, Material } from '../data/types';
import { api } from '@/lib/api-client';

import AccessDenied from '../components/AccessDenied';

const emptyCategory: { name: string; description: string; icon: string; status: Category['status'] } = {
  name: '',
  description: '',
  icon: '📦',
  status: 'ใช้งาน',
};

const iconOptions = ['📋', '⚡', '🏗️', '🔧', '💻', '🧹', '🌱', '🚗', '📦', '🛠️', '🔩', '💡'];

export default function CategoriesPage() {
  const { currentUser } = useAppStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState(emptyCategory);
  const { showToast, ToastComponent } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    const [catRes, matRes] = await Promise.all([
      api.categories.getAll(),
      api.materials.getAll()
    ]);
    if (catRes.success && catRes.data) setCategories(catRes.data);
    if (matRes.success && matRes.data) setMaterials(matRes.data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (currentUser.role === 'ผู้ดูแลระบบ') {
      fetchData();
    }
  }, [currentUser]);

  if (currentUser.role !== 'ผู้ดูแลระบบ') {
    return (
      <AppLayout title="หมวดหมู่วัสดุ">
        <AccessDenied requiredRoles={['ผู้ดูแลระบบ']} moduleName="หมวดหมู่วัสดุ" />
      </AppLayout>
    );
  }

  const filteredCategories = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCategories = categories.filter((c) => c.status === 'ใช้งาน').length;
  const totalItems = categories.reduce((sum, c) => sum + (c.itemCount || 0), 0);

  const handleAdd = () => {
    setEditingCategory(null);
    setFormData(emptyCategory);
    setIsModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      icon: category.icon,
      status: category.status,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      showToast('กรุณากรอกชื่อหมวดหมู่', 'error');
      return;
    }

    if (editingCategory) {
      const res = await api.categories.update(editingCategory.id, formData);
      if (res.success) {
        showToast('แก้ไขหมวดหมู่สำเร็จ', 'success');
        fetchData();
      } else {
        showToast(res.error || 'เกิดข้อผิดพลาด', 'error');
      }
    } else {
      const res = await api.categories.create(formData);
      if (res.success) {
        showToast('เพิ่มหมวดหมู่ใหม่สำเร็จ', 'success');
        fetchData();
      } else {
        showToast(res.error || 'เกิดข้อผิดพลาด', 'error');
      }
    }
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (deletingCategory) {
      const res = await api.categories.delete(deletingCategory.id);
      if (res.success) {
        showToast('ลบหมวดหมู่สำเร็จ', 'success');
        fetchData();
      } else {
        showToast(res.error || 'เกิดข้อผิดพลาด', 'error');
      }
      setIsDeleteModalOpen(false);
      setDeletingCategory(null);
    }
  };

  return (
    <AppLayout title="ระบบจัดการหมวดหมู่วัสดุ">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>จัดการหมวดหมู่วัสดุและอุปกรณ์</h1>
            <p>กำหนดหมวดหมู่ จัดกลุ่ม และควบคุมสถานะการใช้งานหมวดหมู่วัสดุของเทศบาล</p>
          </div>
          <button className="btn btn-primary" onClick={handleAdd}>
            <Plus size={18} />
            เพิ่มหมวดหมู่ใหม่
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatsCard
          icon={<FolderOpen size={24} />}
          value={categories.length}
          label="หมวดหมู่ทั้งหมด"
          color="blue"
        />
        <StatsCard
          icon={<FolderOpen size={24} />}
          value={activeCategories}
          label="หมวดหมู่ที่เปิดใช้งาน"
          color="green"
        />
        <StatsCard
          icon={<Package size={24} />}
          value={totalItems}
          label="รายการวัสดุทั้งหมดในระบบ"
          color="orange"
        />
      </div>

      {/* Search toolbar */}
      <div style={{ marginBottom: '20px' }}>
        <div className="table-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="ค้นหาหมวดหมู่..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Grid of Categories */}
      <div className="category-grid">
        {filteredCategories.map((category) => {
          const itemCount = materials.filter((m: Material) => m.categoryId === category.id || m.categoryName === category.name).length;
          return (
            <div key={category.id} className="category-card">
              <div className="category-icon">{category.icon}</div>
              <div className="category-info">
                <h3>{category.name}</h3>
                <p>{category.description || 'ไม่มีรายละเอียดเพิ่มเติม'}</p>
                <div className="category-meta">
                  <span className="category-count">📦 {itemCount} รายการ</span>
                  <div className="category-actions">
                    <span
                      className={`badge ${category.status === 'ใช้งาน' ? 'badge-active' : 'badge-inactive'}`}
                      style={{ marginRight: '8px' }}
                    >
                      {category.status}
                    </span>
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => handleEdit(category)}
                      title="แก้ไข"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => {
                        setDeletingCategory(category);
                        setIsDeleteModalOpen(true);
                      }}
                      title="ลบ"
                      style={{ color: 'var(--danger-500)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCategories.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📂</div>
          <h3>ไม่พบหมวดหมู่</h3>
          <p>ลองเปลี่ยนคำค้นหาหรือเพิ่มหมวดหมู่ใหม่</p>
        </div>
      )}

      {/* Modal Add/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'แก้ไขข้อมูลหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
              ยกเลิก
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              บันทึกข้อมูล
            </button>
          </>
        }
      >
        <div className="form-group">
          <label>ไอคอนสัญลักษณ์</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {iconOptions.map((icon) => (
              <button
                key={icon}
                type="button"
                style={{
                  width: '44px',
                  height: '44px',
                  border: formData.icon === icon ? '2px solid var(--primary-500)' : '1px solid var(--gray-200)',
                  borderRadius: 'var(--radius-md)',
                  background: formData.icon === icon ? 'var(--primary-50)' : 'white',
                  fontSize: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
                onClick={() => setFormData({ ...formData, icon })}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>ชื่อหมวดหมู่ <span className="required">*</span></label>
          <input
            type="text"
            className="form-control"
            placeholder="เช่น วัสดุสำนักงาน, วัสดุก่อสร้าง"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>รายละเอียด</label>
          <textarea
            className="form-control"
            placeholder="คำอธิบายเกี่ยวกับหมวดหมู่นี้"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="form-group">
          <div className="form-switch">
            <div className="form-switch-label">
              <strong>สถานะการใช้งาน</strong>
              <p>เปิดหรือปิดการใช้งานหมวดหมู่นี้</p>
            </div>
            <button
              type="button"
              className={`switch ${formData.status === 'ใช้งาน' ? 'active' : ''}`}
              onClick={() =>
                setFormData({
                  ...formData,
                  status: formData.status === 'ใช้งาน' ? 'ไม่ใช้งาน' : 'ใช้งาน',
                })
              }
            />
          </div>
        </div>
      </Modal>

      {/* Modal ยืนยันลบ */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="ยืนยันการลบหมวดหมู่"
        maxWidth="420px"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setIsDeleteModalOpen(false)}>
              ยกเลิก
            </button>
            <button className="btn btn-danger" onClick={handleDelete}>
              ลบหมวดหมู่
            </button>
          </>
        }
      >
        <div className="confirm-dialog">
          <div className="confirm-dialog-icon">🗑️</div>
          <h3>ต้องการลบหมวดหมู่นี้?</h3>
          <p>
            คุณกำลังจะลบหมวดหมู่ <strong>{deletingCategory?.name}</strong>
          </p>
        </div>
      </Modal>

      {ToastComponent}
    </AppLayout>
  );
}
