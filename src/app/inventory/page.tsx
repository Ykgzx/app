'use client';

import { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import StatsCard from '../components/StatsCard';
import Modal from '../components/Modal';
import { useToast } from '../components/AppLayout';
import { useAppStore } from '../data/store';
import {
  Package,
  AlertTriangle,
  XCircle,
  DollarSign,
  Search,
  MapPin,
  PlusCircle,
  TrendingDown,
  Layers,
  Eye,
  Info,
  Calendar,
  Tag,
} from 'lucide-react';
import { Material, presetMaterialIcons } from '../data/types';
import { api } from '@/lib/api-client';

export default function InventoryPage() {
  const { currentUser } = useAppStore();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const isAdmin = currentUser.role === 'ผู้ดูแลระบบ';
  const [filterStatus, setFilterStatus] = useState('');
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedDetailMaterial, setSelectedDetailMaterial] = useState<Material | null>(null);
  const [restockQty, setRestockQty] = useState(10);
  const [restockReason, setRestockReason] = useState('เติมสต็อกด่วนเนื่องจากใกล้หมด');
  const { showToast, ToastComponent } = useToast();

  const fetchMaterials = async () => {
    setIsLoading(true);
    const res = await api.materials.getAll();
    if (res.success && res.data) setMaterials(res.data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleOpenDetail = (material: Material) => {
    setSelectedDetailMaterial(material);
    setIsDetailModalOpen(true);
  };

  const statusPriority: Record<string, number> = { 'หมดสต็อก': 0, 'ใกล้หมด': 1, 'มีสต็อก': 2 };

  const filteredMaterials = materials
    .filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = filterStatus ? m.status === filterStatus : true;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      // เรียงสถานะ: หมดสต็อก → ใกล้หมด → มีสต็อก
      const priorityDiff = (statusPriority[a.status] ?? 9) - (statusPriority[b.status] ?? 9);
      if (priorityDiff !== 0) return priorityDiff;
      // เรียงรหัสวัสดุจากน้อยไปมาก
      return a.code.localeCompare(b.code, 'th');
    });

  const totalItems = materials.length;
  const inStock = materials.filter((m) => m.status === 'มีสต็อก').length;
  const lowStock = materials.filter((m) => m.status === 'ใกล้หมด').length;
  const outOfStock = materials.filter((m) => m.status === 'หมดสต็อก').length;
  const totalValue = materials.reduce((sum, m) => sum + m.totalValue, 0);

  const handleOpenRestock = (material: Material) => {
    setSelectedMaterial(material);
    setRestockQty(Math.max(20, material.minQuantity * 2));
    setRestockReason('เติมสต็อกเพื่อรักษาระดับคงคลัง');
    setIsRestockModalOpen(true);
  };

  const handleConfirmRestock = async () => {
    if (!selectedMaterial) return;
    if (restockQty <= 0) {
      showToast('จำนวนต้องมากกว่า 0', 'error');
      return;
    }

    const res = await api.materials.restock(selectedMaterial.id, {
      addQuantity: restockQty,
      reason: restockReason
    });

    if (res.success) {
      showToast(`เติมสต็อก ${selectedMaterial.name} จำนวน +${restockQty} ${selectedMaterial.unit} เรียบร้อยแล้ว`, 'success');
      fetchMaterials();
    } else {
      showToast(res.error || 'เกิดข้อผิดพลาดในการเติมสต็อก', 'error');
    }
    setIsRestockModalOpen(false);
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'มีสต็อก': return 'stock-in-stock';
      case 'ใกล้หมด': return 'stock-low';
      case 'หมดสต็อก': return 'stock-out';
      default: return '';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'มีสต็อก': return 'badge-success';
      case 'ใกล้หมด': return 'badge-warning';
      case 'หมดสต็อก': return 'badge-danger';
      default: return '';
    }
  };

  const getStockPercentage = (quantity: number, minQuantity: number) => {
    if (minQuantity === 0) return 100;
    const ratio = (quantity / (minQuantity * 3)) * 100;
    return Math.min(Math.max(ratio, 0), 100);
  };

  return (
    <AppLayout title="คลังวัสดุและครุภัณฑ์">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>คลังวัสดุและครุภัณฑ์</h1>
            <p>ติดตามระดับคงคลังแบบ Real-time, ตรวจจับวัสดุใกล้หมด, และเติมสต็อกเข้าสู่ระบบ</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatsCard icon={<Package size={24} />} value={totalItems} label="รายการวัสดุทั้งหมด" color="blue" />
        <StatsCard icon={<Package size={24} />} value={inStock} label="สต็อกปกติ" color="green" />
        <StatsCard icon={<AlertTriangle size={24} />} value={lowStock} label="สต็อกต่ำกว่าเกณฑ์" color="orange" />
        <StatsCard icon={<XCircle size={24} />} value={outOfStock} label="หมดสต็อก (ต้องสั่งซื้อ)" color="red" />
        <StatsCard icon={<DollarSign size={24} />} value={`฿${totalValue.toLocaleString('th-TH')}`} label="มูลค่ารวมทั้งคลัง" color="cyan" />
      </div>

      {/* Low stock alert banner */}
      {(lowStock > 0 || outOfStock > 0) && (
        <div
          style={{
            padding: '14px 18px',
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '10px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} style={{ color: '#d97706' }} />
            <div>
              <strong style={{ color: '#92400e', fontSize: '14px' }}>แจ้งเตือนระดับสต็อกต่ำกว่าที่กำหนด!</strong>
              <div style={{ color: '#b45309', fontSize: '13px' }}>
                มีวัสดุใกล้หมด {lowStock} รายการ และหมดสต็อก {outOfStock} รายการ แนะนำให้ดำเนินการสั่งซื้อเติมสต็อก
              </div>
            </div>
          </div>
          <button
            className="btn btn-outline"
            style={{ borderColor: '#d97706', color: '#b45309', fontSize: '12px', padding: '6px 12px' }}
            onClick={() => setFilterStatus(outOfStock > 0 ? 'หมดสต็อก' : 'ใกล้หมด')}
          >
            กรองเฉพาะรายการที่ต้องเติมสต็อก →
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="table-search" style={{ flex: 1 }}>
          <Search size={18} />
          <input
            type="text"
            placeholder="ค้นหาตามชื่อวัสดุ, รหัส, หรือที่เก็บ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <select
          className="form-control"
          style={{ width: '170px', padding: '8px 12px' }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">ทุกสถานะสต็อก</option>
          <option value="มีสต็อก">มีสต็อก (ปกติ)</option>
          <option value="ใกล้หมด">ใกล้หมด (ต่ำกว่าเกณฑ์)</option>
          <option value="หมดสต็อก">หมดสต็อก</option>
        </select>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>รหัส</th>
                <th>ชื่อวัสดุ / ครุภัณฑ์</th>
                <th>หมวดหมู่</th>
                <th>คงเหลือ</th>
                <th>ระดับสต็อก</th>
                <th>สถานที่จัดเก็บ</th>
                <th>สถานะ</th>
                <th>การจัดการสต็อก</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.map((m) => {
                const pct = getStockPercentage(m.quantity, m.minQuantity);
                const barColor =
                  m.status === 'มีสต็อก' ? 'var(--success-500)' :
                  m.status === 'ใกล้หมด' ? 'var(--warning-500)' :
                  'var(--danger-500)';

                return (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary-600)' }}>{m.code}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{m.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {m.description.slice(0, 45)}
                      </div>
                    </td>
                    <td>{m.categoryName}</td>
                    <td>
                      <span className={getStatusClass(m.status)} style={{ fontWeight: 700, fontSize: '16px' }}>
                        {m.quantity}
                      </span>
                      <span style={{ color: 'var(--text-secondary)', marginLeft: '4px', fontSize: '13px' }}>{m.unit}</span>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>เกณฑ์ขั้นต่ำ: {m.minQuantity}</div>
                    </td>
                    <td style={{ width: '130px' }}>
                      <div style={{ width: '100%', height: '8px', background: 'var(--gray-100)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: '4px', transition: 'width 0.5s ease' }} />
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                        <MapPin size={13} style={{ color: 'var(--text-muted)' }} />
                        {m.location}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(m.status)}`}>{m.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          className="btn btn-sm btn-outline"
                          style={{ color: '#2563eb', borderColor: '#bfdbfe', background: '#eff6ff' }}
                          onClick={() => handleOpenDetail(m)}
                          title="ดูรายละเอียดข้อมูลวัสดุ"
                        >
                          <Eye size={14} /> ดูข้อมูล
                        </button>
                        {isAdmin && (
                          <button
                            className="btn btn-sm btn-outline"
                            style={{ color: '#059669', borderColor: '#a7f3d0', background: '#ecfdf5' }}
                            onClick={() => handleOpenRestock(m)}
                            title="เติมสต็อก"
                          >
                            <PlusCircle size={14} /> เติมสต็อก
                          </button>
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
            <h3>ไม่พบรายการวัสดุ</h3>
          </div>
        )}
      </div>

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

      {/* Modal เติมสต็อก */}
      <Modal
        isOpen={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        title="เติมสต็อกวัสดุและอุปกรณ์"
        maxWidth="460px"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setIsRestockModalOpen(false)}>
              ยกเลิก
            </button>
            <button className="btn btn-success" onClick={handleConfirmRestock}>
              <PlusCircle size={16} /> ยืนยันการเติมสต็อก
            </button>
          </>
        }
      >
        {selectedMaterial && (
          <div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
              <div>รายการ: <strong style={{ color: '#1e40af' }}>{selectedMaterial.name}</strong> ({selectedMaterial.code})</div>
              <div>จำนวนปัจจุบัน: <strong>{selectedMaterial.quantity} {selectedMaterial.unit}</strong></div>
              <div>จำนวนหลังเติม: <strong style={{ color: '#16a34a', fontSize: '16px' }}>{selectedMaterial.quantity + restockQty} {selectedMaterial.unit}</strong></div>
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
              <label>เหตุผลหรือรายละเอียดการเติมสต็อก</label>
              <input
                type="text"
                className="form-control"
                placeholder="เช่น จัดซื้อประจำงวด, โอนย้ายจากคลังย่อย"
                value={restockReason}
                onChange={(e) => setRestockReason(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>

      {ToastComponent}
    </AppLayout>
  );
}
