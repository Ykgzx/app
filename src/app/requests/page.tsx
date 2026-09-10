'use client';

import { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import StatsCard from '../components/StatsCard';
import Modal from '../components/Modal';
import { useToast } from '../components/AppLayout';
import { useAppStore, RequestType, EnhancedRequest } from '../data/store';
import {
  Send,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Plus,
  Package,
  RotateCcw,
  Ban,
  Info,
  Layers,
  Filter,
  Eye,
  MessageSquareWarning,
  AlertTriangle,
  X,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { Material } from '../data/types';

export default function RequestsPage() {
  const { currentUser } = useAppStore();
  const [requests, setRequests] = useState<EnhancedRequest[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedDetailRequest, setSelectedDetailRequest] = useState<EnhancedRequest | null>(null);
  const [selectedCancelRequest, setSelectedCancelRequest] = useState<EnhancedRequest | null>(null);

  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [requestType, setRequestType] = useState<RequestType>('เบิกวัสดุ');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [borrowDate, setBorrowDate] = useState('2026-08-16');
  const [expectedReturnDate, setExpectedReturnDate] = useState('2026-08-23');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [viewOnlyMine, setViewOnlyMine] = useState(false);
  const { showToast, ToastComponent } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    const [reqRes, matRes] = await Promise.all([
      api.requests.getAll(),
      api.materials.getAll()
    ]);
    if (reqRes.success && reqRes.data) setRequests(reqRes.data);
    if (matRes.success && matRes.data) setMaterials(matRes.data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedMaterial = materials.find((m) => m.id === selectedMaterialId);

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    const matchSearch =
      r.requestCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.rejectReason && r.rejectReason.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchType = filterType ? r.requestType === filterType : true;
    const matchStatus = filterStatus ? r.status === filterStatus : true;
    const matchMine = viewOnlyMine ? (r.requesterId === currentUser.id || r.requesterName === currentUser.fullName) : true;

    return matchSearch && matchType && matchStatus && matchMine;
  });

  // Stats
  const myRequests = requests.filter((r) => r.requesterId === currentUser.id || r.requesterName === currentUser.fullName);
  const totalCount = requests.length;
  const pendingCount = requests.filter((r) => r.status === 'รออนุมัติ').length;
  const borrowingCount = requests.filter((r) => r.status === 'กำลังยืม').length;
  const approvedCount = requests.filter((r) => r.status === 'อนุมัติแล้ว' || r.status === 'คืนแล้ว').length;

  const handleOpenModal = (type: RequestType = 'เบิกวัสดุ') => {
    setRequestType(type);
    setSelectedMaterialId(materials[0]?.id || '');
    setQuantity(1);
    setReason('');
    setBorrowDate('2026-08-16');
    setExpectedReturnDate('2026-08-23');
    setIsModalOpen(true);
  };

  const handleOpenDetail = (req: EnhancedRequest) => {
    setSelectedDetailRequest(req);
    setIsDetailModalOpen(true);
  };

  const handleOpenCancelModal = (req: EnhancedRequest) => {
    setSelectedCancelRequest(req);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedCancelRequest) return;
    const res = await api.requests.cancel(selectedCancelRequest.id);
    if (res.success) {
      showToast(`ยกเลิกคำขอ ${selectedCancelRequest.requestCode} สำเร็จเรียบร้อยแล้ว`, 'info');
      fetchData();
    } else {
      showToast(res.error || 'เกิดข้อผิดพลาด', 'error');
    }
    setIsCancelModalOpen(false);
    setSelectedCancelRequest(null);
  };

  const handleCreateRequest = async () => {
    if (!selectedMaterialId) {
      showToast('กรุณาเลือกวัสดุอุปกรณ์', 'error');
      return;
    }
    if (quantity <= 0) {
      showToast('จำนวนต้องมากกว่า 0', 'error');
      return;
    }
    if (selectedMaterial && quantity > selectedMaterial.quantity) {
      showToast(`จำนวนคงเหลือไม่พอ (คงเหลือ ${selectedMaterial.quantity} ${selectedMaterial.unit})`, 'error');
      return;
    }
    if (!reason.trim()) {
      showToast('กรุณาระบุเหตุผลในการเบิก/ยืม', 'error');
      return;
    }

    const res = await api.requests.create({
      requestType,
      materialId: selectedMaterialId,
      quantity,
      reason,
      requesterId: currentUser.id,
      borrowDate: requestType === 'ยืมวัสดุ' ? borrowDate : undefined,
      expectedReturnDate: requestType === 'ยืมวัสดุ' ? expectedReturnDate : undefined,
    });

    if (res.success) {
      showToast(`ส่งคำขอ${requestType}สำเร็จเรียบร้อยแล้ว`, 'success');
      fetchData();
    } else {
      showToast(res.error || 'เกิดข้อผิดพลาด', 'error');
    }
    setIsModalOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'รออนุมัติ':
        return 'badge-pending';
      case 'อนุมัติแล้ว':
        return 'badge-success';
      case 'กำลังยืม':
        return 'badge-info';
      case 'คืนแล้ว':
        return 'badge-active';
      case 'ไม่อนุมัติ':
        return 'badge-danger';
      case 'ยกเลิกแล้ว':
        return 'badge-inactive';
      default:
        return '';
    }
  };

  return (
    <AppLayout title="ระบบเบิก–ยืมวัสดุอุปกรณ์">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>ส่งคำขอเบิก–ยืมวัสดุและอุปกรณ์</h1>
            <p>เจ้าหน้าที่สามารถค้นหาวัสดุ ตรวจสอบคงเหลือ และส่งคำขอเบิกหรือยืมใช้งาน</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-primary"
              onClick={() => handleOpenModal('เบิกวัสดุ')}
            >
              <Send size={16} /> ส่งคำขอเบิกวัสดุ
            </button>
            <button
              className="btn"
              style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: 'white' }}
              onClick={() => handleOpenModal('ยืมวัสดุ')}
            >
              <Calendar size={16} /> ส่งคำขอยืมวัสดุ
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatsCard
          icon={<Send size={24} />}
          value={totalCount}
          label="คำขอทั้งหมดในระบบ"
          color="blue"
        />
        <StatsCard
          icon={<Clock size={24} />}
          value={pendingCount}
          label="รอการอนุมัติ"
          color="orange"
        />
        <StatsCard
          icon={<Calendar size={24} />}
          value={borrowingCount}
          label="กำลังอยู่ในระหว่างยืม"
          color="cyan"
        />
        <StatsCard
          icon={<CheckCircle2 size={24} />}
          value={approvedCount}
          label="อนุมัติ/คืนแล้ว"
          color="green"
        />
      </div>

      {/* Material Quick Browse Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
          border: '1px solid #bfdbfe',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#2563eb',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Package size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e3a5f' }}>
              กำลังใช้งานในชื่อ: {currentUser.fullName} ({currentUser.role})
            </div>
            <div style={{ fontSize: '13px', color: '#4b5563' }}>
              แผนก: {currentUser.department} • คำขอของฉัน: {myRequests.length} รายการ
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={`btn ${viewOnlyMine ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '13px', padding: '6px 14px' }}
            onClick={() => setViewOnlyMine(!viewOnlyMine)}
          >
            {viewOnlyMine ? '✓ กำลังดูคำขอของฉัน' : 'ดูเฉพาะคำขอของฉัน'}
          </button>
        </div>
      </div>

      {/* Requests Table */}
      <div className="card">
        <div className="table-toolbar">
          <div className="table-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="ค้นหารหัส, วัสดุ, ผู้ขอ, หรือเหตุผล..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="table-actions">
            <select
              className="form-control"
              style={{ width: '150px', padding: '8px 12px' }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">ทุกประเภทคำขอ</option>
              <option value="เบิกวัสดุ">เบิกวัสดุ (ใช้สิ้นเปลือง)</option>
              <option value="ยืมวัสดุ">ยืมวัสดุ (ต้องนำส่งคืน)</option>
            </select>

            <select
              className="form-control"
              style={{ width: '150px', padding: '8px 12px' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">ทุกสถานะ</option>
              <option value="รออนุมัติ">รออนุมัติ</option>
              <option value="อนุมัติแล้ว">อนุมัติแล้ว</option>
              <option value="กำลังยืม">กำลังยืม</option>
              <option value="คืนแล้ว">คืนแล้ว</option>
              <option value="ไม่อนุมัติ">ไม่อนุมัติ (ระบุเหตุผล)</option>
              <option value="ยกเลิกแล้ว">ยกเลิกแล้ว</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>รหัสคำขอ</th>
                <th>ประเภท</th>
                <th>วัสดุ / ครุภัณฑ์</th>
                <th>จำนวน</th>
                <th>ผู้ขอเบิก–ยืม</th>
                <th>วันที่ขอ / กำหนดคืน</th>
                <th>เหตุผลการใช้งาน</th>
                <th>สถานะ / เหตุผลไม่อนุมัติ</th>
                <th>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req) => (
                <tr key={req.id}>
                  <td style={{ fontWeight: 700, color: 'var(--primary-600)' }}>
                    {req.requestCode}
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: req.requestType === 'ยืมวัสดุ' ? '#ecfeff' : '#eff6ff',
                        color: req.requestType === 'ยืมวัสดุ' ? '#0891b2' : '#2563eb',
                        border: req.requestType === 'ยืมวัสดุ' ? '1px solid #a5f3fc' : '1px solid #bfdbfe',
                      }}
                    >
                      {req.requestType}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{req.materialName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      รหัส: {req.materialCode || '-'}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, fontSize: '15px' }}>{req.quantity}</span>{' '}
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{req.unit}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{req.requesterName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{req.department}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px' }}>ขอ: {req.requestDate}</div>
                    {req.requestType === 'ยืมวัสดุ' && req.expectedReturnDate && (
                      <div style={{ fontSize: '12px', color: '#d97706', fontWeight: 500 }}>
                        กำหนดคืน: {req.expectedReturnDate}
                      </div>
                    )}
                  </td>
                  <td style={{ maxWidth: '200px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{req.reason}</div>
                  </td>
                  <td>
                    <div>
                      <span className={`badge ${getStatusBadge(req.status)}`}>
                        {req.status}
                      </span>
                      {req.status === 'ไม่อนุมัติ' && req.rejectReason && (
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#b91c1c',
                            background: '#fef2f2',
                            border: '1px solid #fee2e2',
                            padding: '4px 6px',
                            borderRadius: '4px',
                            marginTop: '4px',
                            maxWidth: '220px',
                            lineHeight: 1.3,
                          }}
                        >
                          <strong>เหตุผล:</strong> {req.rejectReason}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleOpenDetail(req)}
                        title="ดูรายละเอียดคำขอ"
                      >
                        <Eye size={14} /> รายละเอียด
                      </button>
                      {req.status === 'รออนุมัติ' && (req.requesterId === currentUser.id || req.requesterName === currentUser.fullName || currentUser.role === 'ผู้ดูแลระบบ') && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleOpenCancelModal(req)}
                          title="ยกเลิกคำขอนี้"
                          style={{ color: '#dc2626', background: '#fef2f2' }}
                        >
                          <X size={14} /> ยกเลิก
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRequests.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>ไม่พบรายการคำขอ</h3>
            <p>คุณสามารถกดส่งคำขอเบิกหรือขอยืมวัสดุได้ที่ปุ่มด้านบน</p>
          </div>
        )}
      </div>

      {/* Modal ดูรายละเอียดคำขอสำหรับเจ้าหน้าที่ */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="รายละเอียดคำขอเบิก–ยืม"
        maxWidth="520px"
        footer={
          <button className="btn btn-outline" onClick={() => setIsDetailModalOpen(false)}>
            ปิดหน้าต่าง
          </button>
        }
      >
        {selectedDetailRequest && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '18px', color: 'var(--primary-600)' }}>
                {selectedDetailRequest.requestCode}
              </span>
              <span className={`badge ${getStatusBadge(selectedDetailRequest.status)}`}>
                {selectedDetailRequest.status}
              </span>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px' }}>
                <span style={{ color: '#6b7280' }}>ประเภทคำขอ:</span>
                <strong>{selectedDetailRequest.requestType}</strong>
                <span style={{ color: '#6b7280' }}>ผู้ขอเบิก–ยืม:</span>
                <strong>{selectedDetailRequest.requesterName}</strong>
                <span style={{ color: '#6b7280' }}>แผนก/กอง:</span>
                <span>{selectedDetailRequest.department}</span>
                <span style={{ color: '#6b7280' }}>รายการวัสดุ:</span>
                <strong style={{ color: '#1e40af' }}>{selectedDetailRequest.materialName}</strong>
                <span style={{ color: '#6b7280' }}>จำนวน:</span>
                <span>{selectedDetailRequest.quantity} {selectedDetailRequest.unit}</span>
                <span style={{ color: '#6b7280' }}>วันที่ส่งคำขอ:</span>
                <span>{selectedDetailRequest.requestDate}</span>
                {selectedDetailRequest.requestType === 'ยืมวัสดุ' && (
                  <>
                    <span style={{ color: '#6b7280' }}>วันที่เริ่มยืม:</span>
                    <span>{selectedDetailRequest.borrowDate || selectedDetailRequest.requestDate}</span>
                    <span style={{ color: '#6b7280' }}>กำหนดส่งคืน:</span>
                    <strong style={{ color: '#d97706' }}>{selectedDetailRequest.expectedReturnDate || '25 ส.ค. 2569'}</strong>
                  </>
                )}
                <span style={{ color: '#6b7280' }}>เหตุผลการใช้งาน:</span>
                <span>{selectedDetailRequest.reason}</span>
                {selectedDetailRequest.approvedBy && (
                  <>
                    <span style={{ color: '#6b7280' }}>ผู้อนุมัติ:</span>
                    <strong style={{ color: '#059669' }}>{selectedDetailRequest.approvedBy}</strong>
                    <span style={{ color: '#6b7280' }}>วันที่อนุมัติ:</span>
                    <span>{selectedDetailRequest.approvedDate}</span>
                  </>
                )}
              </div>
            </div>

            {/* กล่องแสดงเหตุผลไม่อนุมัติสำหรับเจ้าหน้าที่ */}
            {selectedDetailRequest.status === 'ไม่อนุมัติ' && selectedDetailRequest.rejectReason && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                <MessageSquareWarning size={20} style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ color: '#991b1b', fontSize: '14px', display: 'block', marginBottom: '2px' }}>
                    เหตุผลที่ไม่อนุมัติคำขอ (จากผู้อนุมัติ):
                  </strong>
                  <span style={{ color: '#b91c1c', fontSize: '13px' }}>
                    {selectedDetailRequest.rejectReason}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal ส่งคำขอใหม่ */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={requestType === 'เบิกวัสดุ' ? 'ส่งคำขอเบิกวัสดุสิ้นเปลือง' : 'ส่งคำขอยืมวัสดุและครุภัณฑ์'}
        maxWidth="540px"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
              ยกเลิก
            </button>
            <button className="btn btn-primary" onClick={handleCreateRequest}>
              <Send size={16} /> ยืนยันส่งคำขอ
            </button>
          </>
        }
      >
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            ประเภทคำขอ <span className="required">*</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              className={`btn ${requestType === 'เบิกวัสดุ' ? 'btn-primary' : 'btn-outline'}`}
              style={{ justifyContent: 'center' }}
              onClick={() => setRequestType('เบิกวัสดุ')}
            >
              📦 เบิกวัสดุ (ใช้หมดไป)
            </button>
            <button
              type="button"
              className={`btn ${requestType === 'ยืมวัสดุ' ? 'btn-primary' : 'btn-outline'}`}
              style={{ justifyContent: 'center' }}
              onClick={() => setRequestType('ยืมวัสดุ')}
            >
              🔄 ยืมวัสดุ (ต้องนำมาคืน)
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>เลือกวัสดุ/อุปกรณ์ <span className="required">*</span></label>
          <select
            className="form-control"
            value={selectedMaterialId}
            onChange={(e) => setSelectedMaterialId(e.target.value)}
          >
            {materials.map((m) => (
              <option key={m.id} value={m.id} disabled={m.quantity <= 0}>
                {m.code} - {m.name} (คงเหลือ: {m.quantity} {m.unit}) {m.quantity <= 0 ? '[หมดสต็อก]' : ''}
              </option>
            ))}
          </select>
        </div>

        {selectedMaterial && (
          <div
            style={{
              background: '#f8fafc',
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '16px',
              border: '1px solid #e2e8f0',
              fontSize: '13px',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <div>
              หมวดหมู่: <strong>{selectedMaterial.categoryName}</strong> • ที่เก็บ: {selectedMaterial.location}
            </div>
            <div>
              คงเหลือ: <strong style={{ color: selectedMaterial.quantity > 0 ? '#16a34a' : '#dc2626' }}>
                {selectedMaterial.quantity} {selectedMaterial.unit}
              </strong>
            </div>
          </div>
        )}

        <div className="form-group">
          <label>จำนวนที่ต้องการ <span className="required">*</span></label>
          <input
            type="number"
            min={1}
            max={selectedMaterial?.quantity || 100}
            className="form-control"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </div>

        {requestType === 'ยืมวัสดุ' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>วันที่เริ่มยืม <span className="required">*</span></label>
              <input
                type="date"
                className="form-control"
                value={borrowDate}
                onChange={(e) => setBorrowDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>กำหนดวันที่คืน <span className="required">*</span></label>
              <input
                type="date"
                className="form-control"
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="form-group">
          <label>เหตุผลและวัตถุประสงค์ในการใช้งาน <span className="required">*</span></label>
          <textarea
            className="form-control"
            rows={3}
            placeholder="ระบุรายละเอียดงานหรือโครงการที่นำไปใช้..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </Modal>

      {/* Modal ยืนยันการยกเลิกคำขอ */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="ยืนยันการยกเลิกคำขอ"
        maxWidth="460px"
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
            <button className="btn btn-outline" onClick={() => setIsCancelModalOpen(false)}>
              ย้อนกลับ
            </button>
            <button className="btn btn-danger" onClick={handleConfirmCancel}>
              <X size={16} /> ยืนยันยกเลิกคำขอ
            </button>
          </div>
        }
      >
        {selectedCancelRequest && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <AlertTriangle size={32} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
              ต้องการยกเลิกคำขอนี้ใช่หรือไม่?
            </h3>

            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', lineHeight: '1.5' }}>
              หากยกเลิกแล้ว คำขอนี้จะถูกเปลี่ยนสถานะเป็น &ldquo;ยกเลิกแล้ว&rdquo; และไม่สามารถนำกลับมาแก้ไขหรือส่งพิจารณาใหม่ได้
            </p>

            <div
              style={{
                background: '#f8fafc',
                borderRadius: '10px',
                padding: '14px',
                border: '1px solid #e2e8f0',
                textAlign: 'left',
                fontSize: '13px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>รหัสคำขอ:</span>
                <strong style={{ color: 'var(--primary-600)' }}>{selectedCancelRequest.requestCode}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>รายการวัสดุ:</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{selectedCancelRequest.materialName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>ประเภทและจำนวน:</span>
                <span style={{ color: '#d97706', fontWeight: 600 }}>{selectedCancelRequest.requestType} ({selectedCancelRequest.quantity} {selectedCancelRequest.unit})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>ผู้ส่งคำขอ:</span>
                <span>{selectedCancelRequest.requesterName} ({selectedCancelRequest.department})</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {ToastComponent}
    </AppLayout>
  );
}
