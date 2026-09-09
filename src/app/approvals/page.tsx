'use client';

import { useState } from 'react';
import AppLayout from '../components/AppLayout';
import StatsCard from '../components/StatsCard';
import Modal from '../components/Modal';
import { useToast } from '../components/AppLayout';
import { useAppStore, EnhancedRequest } from '../data/store';
import {
  ClipboardCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Eye,
  Check,
  X,
  Calendar,
  Layers,
  History,
  AlertTriangle,
  MessageSquareWarning,
} from 'lucide-react';

const presetRejectReasons = [
  'จำนวนสต็อกคงเหลือไม่เพียงพอต่อการจัดสรร',
  'เอกสารประกอบหรือวัตถุประสงค์ไม่ครบถ้วนสมบูรณ์',
  'อุปกรณ์อยู่ระหว่างการส่งซ่อมบำรุง/ตรวจสอบสภาพ',
  'ระยะเวลาการขอยืมเกินกว่าที่ระเบียบเทศบาลกำหนด',
  'ขอสงวนสิทธิ์การใช้งานสำหรับภารกิจฉุกเฉินของเทศบาล',
];

import AccessDenied from '../components/AccessDenied';

export default function ApprovalsPage() {
  const { requests, approveRequest, rejectRequest, cancelRequest, currentUser } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [selectedApproval, setSelectedApproval] = useState<EnhancedRequest | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const { showToast, ToastComponent } = useToast();

  if (currentUser.role !== 'ผู้อนุมัติ') {
    return (
      <AppLayout title="การอนุมัติคำขอ">
        <AccessDenied requiredRoles={['ผู้อนุมัติ']} moduleName="การอนุมัติคำขอเบิก–ยืม" />
      </AppLayout>
    );
  }

  const pendingList = requests.filter((a) => a.status === 'รออนุมัติ');
  const historyList = requests.filter((a) => a.status !== 'รออนุมัติ');

  const currentList = activeTab === 'pending' ? pendingList : historyList;

  const filteredApprovals = currentList.filter((a) => {
    const matchSearch =
      a.requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.requestCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.rejectReason && a.rejectReason.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchType = filterType ? a.requestType === filterType : true;
    return matchSearch && matchType;
  });

  const pendingCount = pendingList.length;
  const approvedCount = requests.filter((a) => a.status === 'อนุมัติแล้ว' || a.status === 'กำลังยืม' || a.status === 'คืนแล้ว').length;
  const rejectedCount = requests.filter((a) => a.status === 'ไม่อนุมัติ').length;

  const handleApprove = (id: string) => {
    approveRequest(id);
    showToast('อนุมัติคำขอและตัดยอดสต็อกเรียบร้อยแล้ว', 'success');
    setIsDetailModalOpen(false);
  };

  const handleOpenRejectModal = (approval: EnhancedRequest) => {
    setSelectedApproval(approval);
    setRejectReason(presetRejectReasons[0]);
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = () => {
    if (!selectedApproval) return;
    if (!rejectReason.trim()) {
      showToast('กรุณาระบุเหตุผลในการไม่อนุมัติ', 'error');
      return;
    }

    rejectRequest(selectedApproval.id, rejectReason.trim());
    showToast(`ไม่อนุมัติคำขอ ${selectedApproval.requestCode} พร้อมบันทึกเหตุผลเรียบร้อยแล้ว`, 'info');
    setIsRejectModalOpen(false);
    setIsDetailModalOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'รออนุมัติ':
        return 'badge-pending';
      case 'อนุมัติแล้ว':
      case 'คืนแล้ว':
        return 'badge-success';
      case 'กำลังยืม':
        return 'badge-info';
      case 'ไม่อนุมัติ':
        return 'badge-danger';
      case 'ยกเลิกแล้ว':
        return 'badge-inactive';
      default:
        return '';
    }
  };

  return (
    <AppLayout title="ระบบพิจารณาอนุมัติคำขอ">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>การอนุมัติคำขอเบิก–ยืมวัสดุอุปกรณ์</h1>
            <p>ผู้อนุมัติสามารถตรวจสอบคำขอ อนุมัติ ไม่อนุมัติพร้อมระบุเหตุผล และตรวจสอบประวัติการอนุมัติ</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatsCard
          icon={<Clock size={24} />}
          value={pendingCount}
          label="รอพิจารณาอนุมัติ"
          color="orange"
        />
        <StatsCard
          icon={<CheckCircle2 size={24} />}
          value={approvedCount}
          label="อนุมัติแล้วทั้งหมด"
          color="green"
        />
        <StatsCard
          icon={<XCircle size={24} />}
          value={rejectedCount}
          label="ไม่อนุมัติ (ระบุเหตุผล)"
          color="red"
        />
        <StatsCard
          icon={<ClipboardCheck size={24} />}
          value={requests.length}
          label="คำขอทั้งหมดในระบบ"
          color="blue"
        />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          className={`btn ${activeTab === 'pending' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('pending')}
        >
          <Clock size={16} /> รายการรออนุมัติ ({pendingCount})
        </button>
        <button
          className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={16} /> ประวัติการพิจารณาทั้งหมด ({historyList.length})
        </button>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-toolbar">
          <div className="table-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="ค้นหารหัสคำขอ, ผู้ขอเบิก, แผนก, วัสดุ, หรือเหตุผลไม่อนุมัติ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="table-actions">
            <select
              className="form-control"
              style={{ width: '160px', padding: '8px 12px' }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">ทุกประเภทคำขอ</option>
              <option value="เบิกวัสดุ">เบิกวัสดุ</option>
              <option value="ยืมวัสดุ">ยืมวัสดุ</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>รหัสคำขอ</th>
                <th>ประเภท</th>
                <th>ผู้ขอเบิก–ยืม</th>
                <th>แผนก/กอง</th>
                <th>รายการวัสดุ</th>
                <th>จำนวน</th>
                <th>วันที่ขอ</th>
                <th>สถานะ / เหตุผล</th>
                <th>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredApprovals.map((approval) => (
                <tr key={approval.id}>
                  <td style={{ fontWeight: 700, color: 'var(--primary-600)' }}>
                    {approval.requestCode}
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: approval.requestType === 'ยืมวัสดุ' ? '#ecfeff' : '#eff6ff',
                        color: approval.requestType === 'ยืมวัสดุ' ? '#0891b2' : '#2563eb',
                      }}
                    >
                      {approval.requestType}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{approval.requesterName}</td>
                  <td>{approval.department}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{approval.materialName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{approval.reason}</div>
                  </td>
                  <td>
                    <strong style={{ fontSize: '15px' }}>{approval.quantity}</strong> {approval.unit}
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {approval.requestDate}
                  </td>
                  <td>
                    <div>
                      <span className={`badge ${getStatusBadge(approval.status)}`}>
                        {approval.status}
                      </span>
                      {approval.status === 'ไม่อนุมัติ' && approval.rejectReason && (
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
                          <strong>เหตุผล:</strong> {approval.rejectReason}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setSelectedApproval(approval);
                          setIsDetailModalOpen(true);
                        }}
                        title="ดูรายละเอียด"
                      >
                        <Eye size={16} /> รายละเอียด
                      </button>

                      {approval.status === 'รออนุมัติ' && (
                        <>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleApprove(approval.id)}
                            title="อนุมัติคำขอนี้"
                          >
                            <Check size={14} /> อนุมัติ
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleOpenRejectModal(approval)}
                            title="ไม่อนุมัติคำขอพร้อมระบุเหตุผล"
                          >
                            <X size={14} /> ไม่อนุมัติ
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredApprovals.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>ไม่มีรายการคำขอในหมวดนี้</h3>
          </div>
        )}
      </div>

      {/* Modal ดูรายละเอียดคำขอ */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="รายละเอียดคำขอเบิก–ยืมวัสดุ"
        maxWidth="560px"
        footer={
          selectedApproval?.status === 'รออนุมัติ' ? (
            <>
              <button
                className="btn btn-danger"
                onClick={() => selectedApproval && handleOpenRejectModal(selectedApproval)}
              >
                <X size={16} /> ไม่อนุมัติ
              </button>
              <button
                className="btn btn-success"
                onClick={() => selectedApproval && handleApprove(selectedApproval.id)}
              >
                <Check size={16} /> อนุมัติคำขอ
              </button>
            </>
          ) : (
            <button className="btn btn-outline" onClick={() => setIsDetailModalOpen(false)}>
              ปิดหน้าต่าง
            </button>
          )
        }
      >
        {selectedApproval && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '18px', color: 'var(--primary-600)' }}>
                {selectedApproval.requestCode}
              </span>
              <span className={`badge ${getStatusBadge(selectedApproval.status)}`}>
                {selectedApproval.status}
              </span>
            </div>

            <div style={{ background: 'var(--gray-50)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '10px', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>ประเภทคำขอ:</span>
                <strong style={{ color: '#2563eb' }}>{selectedApproval.requestType}</strong>

                <span style={{ color: 'var(--text-secondary)' }}>ผู้ขอเบิก–ยืม:</span>
                <span style={{ fontWeight: 600 }}>{selectedApproval.requesterName}</span>

                <span style={{ color: 'var(--text-secondary)' }}>แผนก/กอง:</span>
                <span>{selectedApproval.department}</span>

                <span style={{ color: 'var(--text-secondary)' }}>รายการวัสดุ:</span>
                <span style={{ fontWeight: 700, color: '#1e3a5f' }}>{selectedApproval.materialName}</span>

                <span style={{ color: 'var(--text-secondary)' }}>จำนวนที่ขอ:</span>
                <span style={{ fontWeight: 700 }}>{selectedApproval.quantity} {selectedApproval.unit}</span>

                <span style={{ color: 'var(--text-secondary)' }}>วันที่ส่งคำขอ:</span>
                <span>{selectedApproval.requestDate}</span>

                {selectedApproval.requestType === 'ยืมวัสดุ' && (
                  <>
                    <span style={{ color: 'var(--text-secondary)' }}>วันที่เริ่มยืม:</span>
                    <span>{selectedApproval.borrowDate || selectedApproval.requestDate}</span>

                    <span style={{ color: 'var(--text-secondary)' }}>กำหนดส่งคืน:</span>
                    <span style={{ color: '#d97706', fontWeight: 600 }}>{selectedApproval.expectedReturnDate || '25 ส.ค. 2569'}</span>
                  </>
                )}

                <span style={{ color: 'var(--text-secondary)' }}>เหตุผลการใช้งาน:</span>
                <span>{selectedApproval.reason}</span>

                {selectedApproval.approvedBy && (
                  <>
                    <span style={{ color: 'var(--text-secondary)' }}>ผู้พิจารณา:</span>
                    <span style={{ color: '#059669', fontWeight: 600 }}>{selectedApproval.approvedBy}</span>

                    <span style={{ color: 'var(--text-secondary)' }}>วันที่พิจารณา:</span>
                    <span>{selectedApproval.approvedDate}</span>
                  </>
                )}
              </div>
            </div>

            {/* กล่องแสดงเหตุผลไม่อนุมัติชัดเจน */}
            {selectedApproval.status === 'ไม่อนุมัติ' && selectedApproval.rejectReason && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                <MessageSquareWarning size={20} style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ color: '#991b1b', fontSize: '14px', display: 'block', marginBottom: '2px' }}>
                    เหตุผลในการไม่อนุมัติคำขอ:
                  </strong>
                  <span style={{ color: '#b91c1c', fontSize: '13px' }}>
                    {selectedApproval.rejectReason}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal ไม่อนุมัติพร้อมระบุเหตุผล */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="ระบุเหตุผลในการไม่อนุมัติคำขอ (สำหรับผู้อนุมัติ)"
        maxWidth="500px"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setIsRejectModalOpen(false)}>
              ยกเลิก
            </button>
            <button className="btn btn-danger" onClick={handleConfirmReject}>
              <X size={16} /> ยืนยันไม่อนุมัติคำขอ
            </button>
          </>
        }
      >
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              padding: '12px 14px',
              background: '#fef2f2',
              border: '1px solid #fee2e2',
              borderRadius: '8px',
              color: '#991b1b',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <AlertTriangle size={20} style={{ flexShrink: 0 }} />
            <div>
              คุณกำลังจะไม่อนุมัติคำขอ <strong>{selectedApproval?.requestCode}</strong> ({selectedApproval?.materialName} จำนวน {selectedApproval?.quantity} {selectedApproval?.unit}) ของ <strong>{selectedApproval?.requesterName}</strong>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label style={{ fontSize: '14px', fontWeight: 600 }}>
            เหตุผลในการไม่อนุมัติ <span className="required">*</span>
          </label>
          <textarea
            className="form-control"
            rows={3}
            placeholder="พิมพ์ระบุเหตุผลที่ไม่อนุมัติ เพื่อให้ผู้ส่งคำขอทราบและปรับปรุง..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            style={{ borderColor: !rejectReason.trim() ? '#f87171' : undefined }}
          />
          {!rejectReason.trim() && (
            <span style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px', display: 'block' }}>
              * กรุณาระบุเหตุผลก่อนกดยืนยัน
            </span>
          )}
        </div>

        <div>
          <label style={{ fontSize: '12px', color: '#4b5563', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
            หรือคลิกเลือกเหตุผลมาตรฐานที่พบบ่อย:
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {presetRejectReasons.map((preset) => (
              <button
                key={preset}
                type="button"
                className="btn btn-outline btn-sm"
                style={{
                  fontSize: '12px',
                  padding: '6px 10px',
                  textAlign: 'left',
                  justifyContent: 'flex-start',
                  background: rejectReason === preset ? '#fee2e2' : 'white',
                  borderColor: rejectReason === preset ? '#ef4444' : '#e5e7eb',
                  color: rejectReason === preset ? '#991b1b' : '#374151',
                }}
                onClick={() => setRejectReason(preset)}
              >
                • {preset}
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {ToastComponent}
    </AppLayout>
  );
}
