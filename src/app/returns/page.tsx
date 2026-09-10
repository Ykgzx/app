'use client';

import { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import StatsCard from '../components/StatsCard';
import Modal from '../components/Modal';
import { useToast } from '../components/AppLayout';
import { EnhancedRequest, ReturnRecord } from '../data/store';
import {
  RotateCcw,
  CheckCircle,
  Clock,
  Search,
  Package,
  Calendar,
  AlertCircle,
  FileCheck,
  History,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAppStore } from '../data/store';

export default function ReturnsPage() {
  const { currentUser } = useAppStore();
  const [requests, setRequests] = useState<EnhancedRequest[]>([]);
  const [returnRecords, setReturnRecords] = useState<ReturnRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EnhancedRequest | null>(null);
  const [returnQty, setReturnQty] = useState(1);
  const [returnDate, setReturnDate] = useState('2026-08-16');
  const [condition, setCondition] = useState<'สมบูรณ์' | 'ชำรุด' | 'สูญหาย'>('สมบูรณ์');
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'borrowed' | 'history'>('borrowed');
  const { showToast, ToastComponent } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    const [reqRes, retRes] = await Promise.all([
      api.requests.getAll(),
      api.returns.getAll()
    ]);
    if (reqRes.success && reqRes.data) setRequests(reqRes.data);
    if (retRes.success && retRes.data) setReturnRecords(retRes.data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Active borrowed items needing return
  const borrowedItems = requests.filter(
    (r) => r.requestType === 'ยืมวัสดุ' && r.status === 'กำลังยืม'
  );

  const filteredBorrowed = borrowedItems.filter(
    (r) =>
      r.requestCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.requesterName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHistory = returnRecords.filter(
    (rec) =>
      rec.requestCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.borrowerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenReturnModal = (req: EnhancedRequest) => {
    setSelectedRequest(req);
    setReturnQty(req.quantity);
    setReturnDate('2026-08-16');
    setCondition('สมบูรณ์');
    setNotes('อุปกรณ์อยู่ในสภาพสมบูรณ์ พร้อมจัดเก็บเข้าคลัง');
    setIsReturnModalOpen(true);
  };

  const handleConfirmReturn = async () => {
    if (!selectedRequest) return;
    if (returnQty <= 0) {
      showToast('จำนวนที่คืนต้องมากกว่า 0', 'error');
      return;
    }
    if (returnQty > selectedRequest.quantity) {
      showToast(`จำนวนที่คืนไม่สามารถเกินจำนวนที่ยืม (${selectedRequest.quantity} ${selectedRequest.unit})`, 'error');
      return;
    }

    const res = await api.returns.process({
      requestId: selectedRequest.id,
      returnedQuantity: returnQty,
      returnDate: returnDate || '16 ส.ค. 2569',
      condition,
      notes,
      receivedById: currentUser.id
    });

    if (res.success) {
      showToast(`บันทึกการคืนวัสดุ ${selectedRequest.materialName} และปรับปรุงสต็อกสำเร็จ!`, 'success');
      fetchData();
    } else {
      showToast(res.error || 'เกิดข้อผิดพลาด', 'error');
    }
    setIsReturnModalOpen(false);
  };

  return (
    <AppLayout title="ระบบบันทึกการคืนอุปกรณ์">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>ระบบบันทึกการคืนวัสดุและอุปกรณ์</h1>
            <p>บันทึกการนำส่งคืนอุปกรณ์ ตรวจสอบจำนวนและสภาพ และปรับปรุงยอดสต็อกเข้าคลังโดยอัตโนมัติ</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatsCard
          icon={<Clock size={24} />}
          value={borrowedItems.length}
          label="รายการที่กำลังยืมอยู่"
          color="orange"
        />
        <StatsCard
          icon={<CheckCircle size={24} />}
          value={returnRecords.length}
          label="ประวัติการรับคืนแล้ว"
          color="green"
        />
        <StatsCard
          icon={<RotateCcw size={24} />}
          value={returnRecords.filter((r) => r.condition === 'สมบูรณ์').length}
          label="คืนสภาพสมบูรณ์"
          color="blue"
        />
        <StatsCard
          icon={<AlertCircle size={24} />}
          value={returnRecords.filter((r) => r.condition !== 'สมบูรณ์').length}
          label="มีชำรุด/สูญหาย"
          color="red"
        />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          className={`btn ${activeTab === 'borrowed' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('borrowed')}
        >
          <Clock size={16} /> รายการรอรับคืน ({borrowedItems.length})
        </button>
        <button
          className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={16} /> ประวัติการรับคืนทั้งหมด ({returnRecords.length})
        </button>
      </div>

      {/* Content Table */}
      <div className="card">
        <div className="table-toolbar">
          <div className="table-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="ค้นหารหัสคำขอ, ชื่อผู้ยืม, หรือชื่ออุปกรณ์..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {activeTab === 'borrowed' ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>รหัสคำขอ</th>
                  <th>ผู้ยืม</th>
                  <th>แผนก</th>
                  <th>อุปกรณ์ / วัสดุ</th>
                  <th>จำนวนที่ยืม</th>
                  <th>วันที่ยืม</th>
                  <th>กำหนดคืน</th>
                  <th>สถานะ</th>
                  <th>การดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredBorrowed.map((req) => (
                  <tr key={req.id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary-600)' }}>
                      {req.requestCode}
                    </td>
                    <td style={{ fontWeight: 600 }}>{req.requesterName}</td>
                    <td>{req.department}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{req.materialName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {req.reason}
                      </div>
                    </td>
                    <td>
                      <strong style={{ fontSize: '15px' }}>{req.quantity}</strong> {req.unit}
                    </td>
                    <td style={{ fontSize: '13px' }}>{req.borrowDate || req.requestDate}</td>
                    <td style={{ fontSize: '13px', color: '#d97706', fontWeight: 600 }}>
                      {req.expectedReturnDate || '25 ส.ค. 2569'}
                    </td>
                    <td>
                      <span className="badge badge-warning">กำลังยืม</span>
                    </td>
                    <td>
                      {(currentUser.role !== 'เจ้าหน้าที่' || req.requesterId === currentUser.id || req.requesterName === currentUser.fullName) ? (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleOpenReturnModal(req)}
                        >
                          <RotateCcw size={14} /> {currentUser.role === 'เจ้าหน้าที่' ? 'ส่งคืนอุปกรณ์' : 'บันทึกรับคืน'}
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>รอผู้ยืมส่งคืน</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>รหัสรับคืน</th>
                  <th>รหัสคำขอยืม</th>
                  <th>ผู้ส่งคืน</th>
                  <th>แผนก</th>
                  <th>รายการอุปกรณ์</th>
                  <th>จำนวนที่คืน</th>
                  <th>วันที่คืน</th>
                  <th>สภาพอุปกรณ์</th>
                  <th>ผู้ตรวจรับ</th>
                  <th>หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((rec) => (
                  <tr key={rec.id}>
                    <td style={{ fontWeight: 700, color: '#059669' }}>{rec.id}</td>
                    <td style={{ fontWeight: 600, color: 'var(--primary-600)' }}>
                      {rec.requestCode}
                    </td>
                    <td>{rec.borrowerName}</td>
                    <td>{rec.department}</td>
                    <td>{rec.materialName}</td>
                    <td>
                      <strong>{rec.returnedQuantity}</strong> / {rec.borrowedQuantity}
                    </td>
                    <td>{rec.returnDate}</td>
                    <td>
                      <span
                        className={`badge ${
                          rec.condition === 'สมบูรณ์'
                            ? 'badge-success'
                            : rec.condition === 'ชำรุด'
                            ? 'badge-warning'
                            : 'badge-danger'
                        }`}
                      >
                        {rec.condition}
                      </span>
                    </td>
                    <td style={{ fontSize: '13px' }}>{rec.receivedBy}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {rec.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'borrowed' && filteredBorrowed.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <h3>ไม่มีรายการที่ค้างส่งคืนในขณะนี้</h3>
            <p>อุปกรณ์ที่ถูกยืมทั้งหมดได้รับการส่งคืนเข้าคลังเรียบร้อยแล้ว</p>
          </div>
        )}

        {activeTab === 'history' && filteredHistory.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📂</div>
            <h3>ไม่พบประวัติการรับคืน</h3>
          </div>
        )}
      </div>

      {/* Modal บันทึกรับคืน */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="บันทึกการรับคืนวัสดุและอุปกรณ์"
        maxWidth="500px"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setIsReturnModalOpen(false)}>
              ยกเลิก
            </button>
            <button className="btn btn-success" onClick={handleConfirmReturn}>
              <CheckCircle size={16} /> ยืนยันการรับคืนและปรับสต็อก
            </button>
          </>
        }
      >
        {selectedRequest && (
          <div>
            <div
              style={{
                background: '#f8fafc',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginBottom: '16px',
                fontSize: '13px',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px' }}>
                <span style={{ color: '#6b7280' }}>รหัสคำขอ:</span>
                <strong>{selectedRequest.requestCode}</strong>
                <span style={{ color: '#6b7280' }}>ผู้ยืม:</span>
                <strong>{selectedRequest.requesterName} ({selectedRequest.department})</strong>
                <span style={{ color: '#6b7280' }}>รายการอุปกรณ์:</span>
                <span style={{ color: '#1e40af', fontWeight: 600 }}>{selectedRequest.materialName}</span>
                <span style={{ color: '#6b7280' }}>จำนวนที่ยืม:</span>
                <span>{selectedRequest.quantity} {selectedRequest.unit}</span>
              </div>
            </div>

            <div className="form-group">
              <label>จำนวนที่ส่งคืน <span className="required">*</span></label>
              <input
                type="number"
                min={1}
                max={selectedRequest.quantity}
                className="form-control"
                value={returnQty}
                onChange={(e) => setReturnQty(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>วันที่รับคืน <span className="required">*</span></label>
              <input
                type="date"
                className="form-control"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>สภาพอุปกรณ์ที่รับคืน <span className="required">*</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  className={`btn ${condition === 'สมบูรณ์' ? 'btn-success' : 'btn-outline'}`}
                  style={{ justifyContent: 'center', fontSize: '13px' }}
                  onClick={() => setCondition('สมบูรณ์')}
                >
                  ✓ สมบูรณ์
                </button>
                <button
                  type="button"
                  className={`btn ${condition === 'ชำรุด' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ justifyContent: 'center', fontSize: '13px', background: condition === 'ชำรุด' ? '#d97706' : undefined }}
                  onClick={() => setCondition('ชำรุด')}
                >
                  ⚠️ ชำรุด
                </button>
                <button
                  type="button"
                  className={`btn ${condition === 'สูญหาย' ? 'btn-danger' : 'btn-outline'}`}
                  style={{ justifyContent: 'center', fontSize: '13px' }}
                  onClick={() => setCondition('สูญหาย')}
                >
                  ✗ สูญหาย
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>หมายเหตุและผลการตรวจรับ</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="ระบุสภาพ ความเรียบร้อย หรือปัญหาที่พบ..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>

      {ToastComponent}
    </AppLayout>
  );
}
