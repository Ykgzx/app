'use client';

import { useState } from 'react';
import AppLayout from '../components/AppLayout';
import StatsCard from '../components/StatsCard';
import Modal from '../components/Modal';
import { useToast } from '../components/AppLayout';
import { useAppStore } from '../data/store';
import {
  Package,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  Plus,
  Pencil,
  Trash2,
  DollarSign,
  Image as ImageIcon,
  PlusCircle,
  Eye,
} from 'lucide-react';
import { Material } from '../data/mockData';

const emptyMaterial = {
  code: '',
  name: '',
  categoryId: '',
  categoryName: '',
  unit: 'ชิ้น',
  quantity: 0,
  minQuantity: 10,
  pricePerUnit: 0,
  location: '',
  description: '',
};

const presetMaterialIcons: Record<string, string> = {
  'วัสดุสำนักงาน': '📋',
  'วัสดุไฟฟ้า': '⚡',
  'วัสดุก่อสร้าง': '🏗️',
  'วัสดุประปา': '🔧',
  'วัสดุคอมพิวเตอร์': '💻',
  'วัสดุทำความสะอาด': '🧹',
  'วัสดุการเกษตร': '🌱',
  'วัสดุยานพาหนะ': '🚗',
};

const units = ['ชิ้น', 'อัน', 'ตัว', 'รีม', 'ด้าม', 'หลอด', 'ถุง', 'ท่อน', 'ตลับ', 'แกลลอน', 'เมตร', 'คิว', 'แฟ้ม', 'กล่อง', 'ชุด'];

import AccessDenied from '../components/AccessDenied';

export default function MaterialsPage() {
  const { materials, categories, addMaterial, updateMaterial, deleteMaterial, restockMaterial, currentUser } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [deletingMaterial, setDeletingMaterial] = useState<Material | null>(null);
  const [selectedForRestock, setSelectedForRestock] = useState<Material | null>(null);
  const [selectedDetailMaterial, setSelectedDetailMaterial] = useState<Material | null>(null);
  const [restockQty, setRestockQty] = useState(10);
  const [restockReason, setRestockReason] = useState('สั่งซื้อเพิ่มประจำงวด');
  const [formData, setFormData] = useState(emptyMaterial);
  const [selectedImageEmoji, setSelectedImageEmoji] = useState('📦');
  const { showToast, ToastComponent } = useToast();

  const handleOpenDetail = (material: Material) => {
    setSelectedDetailMaterial(material);
    setIsDetailModalOpen(true);
  };

  if (currentUser.role === 'เจ้าหน้าที่') {
    return (
      <AppLayout title="จัดการข้อมูลวัสดุและครุภัณฑ์">
        <AccessDenied requiredRoles={['ผู้ดูแลระบบ', 'ผู้อนุมัติ']} moduleName="จัดการข้อมูลวัสดุและครุภัณฑ์" />
      </AppLayout>
    );
  }

  const isAdmin = currentUser.role === 'ผู้ดูแลระบบ';

  const filteredMaterials = materials.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = filterCategory ? m.categoryId === filterCategory : true;
    const matchStatus = filterStatus ? m.status === filterStatus : true;
    return matchSearch && matchCategory && matchStatus;
  });

  const totalMaterials = materials.length;
  const lowStock = materials.filter((m) => m.status === 'ใกล้หมด').length;
  const outOfStock = materials.filter((m) => m.status === 'หมดสต็อก').length;
  const totalValue = materials.reduce((sum, m) => sum + m.totalValue, 0);

  const handleAdd = () => {
    setEditingMaterial(null);
    setFormData({
      ...emptyMaterial,
      categoryId: categories[0]?.id || '',
      categoryName: categories[0]?.name || '',
    });
    setSelectedImageEmoji(presetMaterialIcons[categories[0]?.name] || '📦');
    setIsModalOpen(true);
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      code: material.code,
      name: material.name,
      categoryId: material.categoryId,
      categoryName: material.categoryName,
      unit: material.unit,
      quantity: material.quantity,
      minQuantity: material.minQuantity,
      pricePerUnit: material.pricePerUnit,
      location: material.location,
      description: material.description,
    });
    setSelectedImageEmoji(presetMaterialIcons[material.categoryName] || '📦');
    setIsModalOpen(true);
  };

  const handleOpenRestock = (material: Material) => {
    setSelectedForRestock(material);
    setRestockQty(20);
    setRestockReason('จัดซื้อเพิ่มเติมตามรอบงบประมาณ');
    setIsRestockModalOpen(true);
  };

  const handleConfirmRestock = () => {
    if (!selectedForRestock) return;
    if (restockQty <= 0) {
      showToast('จำนวนต้องมากกว่า 0', 'error');
      return;
    }

    restockMaterial(selectedForRestock.id, restockQty, restockReason);
    showToast(`เติมสต็อก ${selectedForRestock.name} จำนวน +${restockQty} ${selectedForRestock.unit} เรียบร้อยแล้ว`, 'success');
    setIsRestockModalOpen(false);
  };

  const handleSave = () => {
    if (!formData.name || !formData.code || !formData.categoryId) {
      showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
      return;
    }

    const category = categories.find((c) => c.id === formData.categoryId);

    if (editingMaterial) {
      updateMaterial(editingMaterial.id, {
        ...formData,
        categoryName: category?.name || formData.categoryName,
      });
      showToast('แก้ไขข้อมูลวัสดุสำเร็จ', 'success');
    } else {
      addMaterial({
        ...formData,
        categoryName: category?.name || '',
      });
      showToast('เพิ่มวัสดุใหม่สำเร็จ', 'success');
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (deletingMaterial) {
      deleteMaterial(deletingMaterial.id);
      showToast('ลบวัสดุสำเร็จ', 'success');
      setIsDeleteModalOpen(false);
      setDeletingMaterial(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'มีสต็อก':
        return 'badge-success';
      case 'ใกล้หมด':
        return 'badge-warning';
      case 'หมดสต็อก':
        return 'badge-danger';
      default:
        return '';
    }
  };

  return (
    <AppLayout title="ระบบจัดการวัสดุและครุภัณฑ์">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>จัดการข้อมูลวัสดุและครุภัณฑ์</h1>
            <p>
              {isAdmin
                ? 'เพิ่ม แก้ไข ลบ เติมสต็อก และจัดการข้อมูลรายการวัสดุอุปกรณ์ของเทศบาล'
                : 'ตรวจสอบข้อมูลและรายละเอียดสเปกรายการวัสดุอุปกรณ์ของเทศบาล (โหมดดูข้อมูล)'}
            </p>
          </div>
          {isAdmin && (
            <button className="btn btn-primary" onClick={handleAdd}>
              <Plus size={18} />
              เพิ่มวัสดุใหม่
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatsCard
          icon={<Package size={24} />}
          value={totalMaterials}
          label="รายการวัสดุทั้งหมด"
          color="blue"
        />
        <StatsCard
          icon={<AlertTriangle size={24} />}
          value={lowStock}
          label="สต็อกใกล้หมด (เตือน)"
          color="orange"
        />
        <StatsCard
          icon={<XCircle size={24} />}
          value={outOfStock}
          label="หมดสต็อก"
          color="red"
        />
        <StatsCard
          icon={<DollarSign size={24} />}
          value={`฿${totalValue.toLocaleString('th-TH')}`}
          label="มูลค่ารวมทั้งคลัง"
          color="green"
        />
      </div>

      {/* Table & Controls */}
      <div className="card">
        <div className="table-toolbar">
          <div className="table-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="ค้นหาชื่อวัสดุ, รหัส, หรือที่เก็บ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="table-actions">
            <select
              className="form-control"
              style={{ width: '180px', padding: '8px 12px' }}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">ทุกหมวดหมู่ ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <select
              className="form-control"
              style={{ width: '140px', padding: '8px 12px' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">ทุกสถานะ</option>
              <option value="มีสต็อก">มีสต็อก</option>
              <option value="ใกล้หมด">ใกล้หมด</option>
              <option value="หมดสต็อก">หมดสต็อก</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>รูปภาพ</th>
                <th>รหัส</th>
                <th>ชื่อวัสดุ / อุปกรณ์</th>
                <th>หมวดหมู่</th>
                <th>คงเหลือ</th>
                <th>ราคา/หน่วย</th>
                <th>สถานะ</th>
                <th>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.map((material) => {
                const icon = presetMaterialIcons[material.categoryName] || '📦';
                return (
                  <tr key={material.id}>
                    <td>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          background: '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        {icon}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--primary-600)' }}>
                      {material.code}
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600 }}>{material.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          📍 {material.location || 'คลังหลัก'}
                        </div>
                      </div>
                    </td>
                    <td>{material.categoryName}</td>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: '15px' }}>{material.quantity}</span>{' '}
                      <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{material.unit}</span>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        เกณฑ์ขั้นต่ำ: {material.minQuantity}
                      </div>
                    </td>
                    <td>฿{material.pricePerUnit.toLocaleString('th-TH')}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(material.status)}`}>
                        {material.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleOpenDetail(material)}
                          title="ดูรายละเอียดข้อมูลวัสดุ"
                          style={{ color: '#2563eb', background: '#eff6ff' }}
                        >
                          <Eye size={14} /> ดูข้อมูล
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleOpenRestock(material)}
                              title="เติมสต็อก"
                              style={{ color: '#059669' }}
                            >
                              <PlusCircle size={14} /> เติมสต็อก
                            </button>
                            <button
                              className="btn btn-ghost btn-icon"
                              onClick={() => handleEdit(material)}
                              title="แก้ไข"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              className="btn btn-ghost btn-icon"
                              onClick={() => {
                                setDeletingMaterial(material);
                                setIsDeleteModalOpen(true);
                              }}
                              title="ลบ"
                              style={{ color: 'var(--danger-500)' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredMaterials.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <h3>ไม่พบข้อมูลวัสดุ</h3>
            <p>ลองเปลี่ยนคำค้นหา หรือกดปุ่มเพิ่มวัสดุใหม่</p>
          </div>
        )}
      </div>

      {/* Modal เพิ่ม/แก้ไขวัสดุ */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMaterial ? 'แก้ไขข้อมูลวัสดุและครุภัณฑ์' : 'เพิ่มข้อมูลวัสดุใหม่'}
        maxWidth="580px"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>ยกเลิก</button>
            <button className="btn btn-primary" onClick={handleSave}>บันทึกข้อมูล</button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div className="form-group">
            <label>รหัสวัสดุ <span className="required">*</span></label>
            <input
              type="text"
              className="form-control"
              placeholder="เช่น OFF-001, ELE-003"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>หมวดหมู่ <span className="required">*</span></label>
            <select
              className="form-control"
              value={formData.categoryId}
              onChange={(e) => {
                const cat = categories.find((c) => c.id === e.target.value);
                setFormData({
                  ...formData,
                  categoryId: e.target.value,
                  categoryName: cat?.name || '',
                });
                if (cat) {
                  setSelectedImageEmoji(presetMaterialIcons[cat.name] || '📦');
                }
              }}
            >
              <option value="">เลือกหมวดหมู่</option>
              {categories.filter((c) => c.status === 'ใช้งาน').map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>ชื่อวัสดุ / ครุภัณฑ์ <span className="required">*</span></label>
          <input
            type="text"
            className="form-control"
            placeholder="เช่น กระดาษ A4 80 แกรม, หลอดไฟ LED 18W"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        {/* รูปภาพจำลอง / Image selection */}
        <div className="form-group">
          <label>รูปภาพสัญลักษณ์ / ไอคอน</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                background: '#f8fafc',
                border: '2px solid #3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}
            >
              {selectedImageEmoji}
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['📋', '⚡', '🏗️', '🔧', '💻', '🧹', '🌱', '🚗', '📦', '💡', '🔩', '🖨️'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '6px',
                    border: selectedImageEmoji === emoji ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    background: 'white',
                    fontSize: '18px',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedImageEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
          <div className="form-group">
            <label>หน่วยนับ</label>
            <select
              className="form-control"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            >
              {units.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>จำนวนในสต็อก</label>
            <input
              type="number"
              min={0}
              className="form-control"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
            />
          </div>
          <div className="form-group">
            <label>จำนวนขั้นต่ำ (เตือน)</label>
            <input
              type="number"
              min={0}
              className="form-control"
              value={formData.minQuantity}
              onChange={(e) => setFormData({ ...formData, minQuantity: Number(e.target.value) })}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div className="form-group">
            <label>ราคาต่อหน่วย (บาท)</label>
            <input
              type="number"
              min={0}
              className="form-control"
              value={formData.pricePerUnit}
              onChange={(e) => setFormData({ ...formData, pricePerUnit: Number(e.target.value) })}
            />
          </div>
          <div className="form-group">
            <label>สถานที่จัดเก็บ</label>
            <input
              type="text"
              className="form-control"
              placeholder="เช่น ห้องเก็บของ A1, โกดัง C2"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group">
          <label>รายละเอียดและสเปกวัสดุ</label>
          <textarea
            className="form-control"
            rows={2}
            placeholder="คำอธิบาย ขนาด ยี่ห้อ หรือข้อกำหนด..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
      </Modal>

      {/* Modal เติมสต็อก (Restock) */}
      <Modal
        isOpen={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        title="เติมสต็อกวัสดุ (Restock)"
        maxWidth="460px"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setIsRestockModalOpen(false)}>ยกเลิก</button>
            <button className="btn btn-success" onClick={handleConfirmRestock}>
              <PlusCircle size={16} /> ยืนยันการเติมสต็อก
            </button>
          </>
        }
      >
        {selectedForRestock && (
          <div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
              <div>รายการ: <strong style={{ color: '#1e40af' }}>{selectedForRestock.name}</strong> ({selectedForRestock.code})</div>
              <div>คงเหลือปัจจุบัน: <strong>{selectedForRestock.quantity} {selectedForRestock.unit}</strong></div>
              <div>จะเพิ่มเป็น: <strong style={{ color: '#16a34a', fontSize: '15px' }}>{selectedForRestock.quantity + restockQty} {selectedForRestock.unit}</strong></div>
            </div>

            <div className="form-group">
              <label>จำนวนที่ต้องการเติม <span className="required">*</span></label>
              <input
                type="number"
                min={1}
                className="form-control"
                value={restockQty}
                onChange={(e) => setRestockQty(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>เหตุผลหรือแหล่งที่มาของการเติมสต็อก</label>
              <input
                type="text"
                className="form-control"
                placeholder="เช่น สั่งซื้อตามงวด, โอนย้ายจากคลังกลาง"
                value={restockReason}
                onChange={(e) => setRestockReason(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Modal ยืนยันลบ */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="ยืนยันการลบวัสดุ"
        maxWidth="420px"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setIsDeleteModalOpen(false)}>ยกเลิก</button>
            <button className="btn btn-danger" onClick={handleDelete}>ลบข้อมูล</button>
          </>
        }
      >
        <div className="confirm-dialog">
          <div className="confirm-dialog-icon">🗑️</div>
          <h3>ต้องการลบรายการนี้?</h3>
          <p>คุณกำลังจะลบ <strong>{deletingMaterial?.name}</strong> ({deletingMaterial?.code})</p>
        </div>
      </Modal>

      {/* Modal ดูรายละเอียดวัสดุ */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="รายละเอียดข้อมูลวัสดุและอุปกรณ์"
        maxWidth="560px"
        footer={
          <button className="btn btn-primary" onClick={() => setIsDetailModalOpen(false)}>
            ปิดหน้าต่าง
          </button>
        }
      >
        {selectedDetailMaterial && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  border: '1px solid #e2e8f0',
                }}
              >
                {presetMaterialIcons[selectedDetailMaterial.categoryName] || '📦'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-600)' }}>
                  {selectedDetailMaterial.code}
                </div>
                <div style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                  {selectedDetailMaterial.name}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  {selectedDetailMaterial.categoryName}
                </div>
              </div>
              <div>
                <span className={`badge ${getStatusBadge(selectedDetailMaterial.status)}`}>
                  {selectedDetailMaterial.status}
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
              }}
            >
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>จำนวนคงเหลือ</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  {selectedDetailMaterial.quantity} <span style={{ fontSize: '13px', fontWeight: 400 }}>{selectedDetailMaterial.unit}</span>
                </div>
              </div>

              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>เกณฑ์ขั้นต่ำแจ้งเตือน</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#d97706' }}>
                  {selectedDetailMaterial.minQuantity} <span style={{ fontSize: '13px', fontWeight: 400 }}>{selectedDetailMaterial.unit}</span>
                </div>
              </div>

              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>ราคาต่อหน่วย</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#059669' }}>
                  ฿{selectedDetailMaterial.pricePerUnit.toLocaleString('th-TH')}
                </div>
              </div>

              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>มูลค่าคงคลังรวม</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#059669' }}>
                  ฿{selectedDetailMaterial.totalValue.toLocaleString('th-TH')}
                </div>
              </div>
            </div>

            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>สถานที่จัดเก็บ</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                📍 {selectedDetailMaterial.location || 'คลังหลัก เทศบาลนครรังสิต'}
              </div>
            </div>

            {selectedDetailMaterial.description && (
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>รายละเอียดและสเปกอุปกรณ์</div>
                <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
                  {selectedDetailMaterial.description}
                </div>
              </div>
            )}

            <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'right' }}>
              อัปเดตล่าสุด: {selectedDetailMaterial.lastUpdated || '-'}
            </div>
          </div>
        )}
      </Modal>

      {ToastComponent}
    </AppLayout>
  );
}
