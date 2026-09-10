'use client';

import { useState } from 'react';
import { Search, Bell, HelpCircle, User as UserIcon, KeyRound, LogOut, CheckCircle, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../data/store';
import Modal from './Modal';
import { useToast } from './AppLayout';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useEffect } from 'react';
interface HeaderProps {
  title?: string;
}

export default function Header({ title = 'ระบบจัดการวัสดุเทศบาล' }: HeaderProps) {
  const { currentUser } = useAppStore();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    if (currentUser.role === 'ผู้อนุมัติ' || currentUser.role === 'ผู้ดูแลระบบ') {
      api.requests.getAll().then((res) => {
        if (res.success && res.data) {
          const pending = res.data.filter((r) => r.status === 'รออนุมัติ');
          setPendingRequestsCount(pending.length);
          setPendingRequests(pending.slice(0, 4));
        }
      });
    }
  }, [currentUser]);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      showToast('กรุณากรอกข้อมูลให้ครบทุกช่อง', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('รหัสผ่านใหม่และการยืนยันไม่ตรงกัน', 'error');
      return;
    }
    if (newPassword.length < 4) {
      showToast('รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร', 'error');
      return;
    }

    const res = await api.auth.changePassword({
      userId: currentUser.id,
      oldPassword,
      newPassword
    });

    if (res.success) {
      showToast('เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว', 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsPassModalOpen(false);
    } else {
      showToast(res.error || 'รหัสผ่านเดิมไม่ถูกต้อง', 'error');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ผู้ดูแลระบบ':
        return 'badge-admin';
      case 'ผู้อนุมัติ':
        return 'badge-approver';
      default:
        return 'badge-staff';
    }
  };

  return (
    <>
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 className="header-title">{title}</h1>
          <span className={`badge ${getRoleBadge(currentUser.role)}`} style={{ fontSize: '11px' }}>
            <ShieldCheck size={12} /> {currentUser.role}
          </span>
        </div>

        <div className="header-right">
          <div className="header-search">
            <Search size={16} />
            <input type="text" placeholder="ค้นหารายการ, วัสดุ, ผู้ใช้งาน..." />
          </div>

          {/* Notifications button */}
          <div style={{ position: 'relative' }}>
            <button
              className="header-icon-btn"
              title="การแจ้งเตือนคำขอ"
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            >
              <Bell size={20} />
              {pendingRequestsCount > 0 && <span className="badge" />}
            </button>

            {isNotificationOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '46px',
                  width: '320px',
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                  border: '1px solid #e5e7eb',
                  padding: '16px',
                  zIndex: 150,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <strong style={{ fontSize: '14px' }}>การแจ้งเตือนคำขอเบิก–ยืม</strong>
                  <span className="badge badge-warning">{pendingRequestsCount} รายการ</span>
                </div>
                {pendingRequests.map((r: any) => (
                  <div key={r.id} style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600, color: '#1e40af' }}>{r.requestCode}</span>
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>{r.requestType}</span>
                    </div>
                    <div style={{ color: '#374151' }}>{r.requesterName} - {r.materialName} ({r.quantity} {r.unit})</div>
                  </div>
                ))}
                <Link
                  href="/approvals"
                  onClick={() => setIsNotificationOpen(false)}
                  style={{ display: 'block', textAlign: 'center', marginTop: '10px', fontSize: '12px', color: '#2563eb', fontWeight: 600 }}
                >
                  ดูคำขอทั้งหมดในระบบ →
                </Link>
              </div>
            )}
          </div>

          {/* Profile & Settings Button */}
          <button
            className="header-icon-btn"
            title="ข้อมูลผู้ใช้และเปลี่ยนรหัสผ่าน"
            onClick={() => setIsProfileModalOpen(true)}
          >
            <UserIcon size={20} />
          </button>

          {/* Avatar button */}
          <div
            className="header-avatar"
            title={`${currentUser.fullName} (${currentUser.role}) - คลิกเพื่อดูโปรไฟล์`}
            onClick={() => setIsProfileModalOpen(true)}
          >
            {currentUser.avatar || currentUser.fullName.slice(0, 2)}
          </div>
        </div>
      </header>

      {/* User Profile Modal */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title="ข้อมูลผู้ใช้งานปัจจุบัน"
        maxWidth="460px"
        footer={
          <>
            <button
              className="btn btn-outline"
              onClick={() => {
                setIsProfileModalOpen(false);
                setIsPassModalOpen(true);
              }}
            >
              <KeyRound size={16} /> เปลี่ยนรหัสผ่าน
            </button>
            <Link
              href="/login"
              className="btn btn-danger"
              onClick={() => setIsProfileModalOpen(false)}
            >
              <LogOut size={16} /> ออกจากระบบ
            </Link>
          </>
        }
      >
        <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1e3a5f, #3b82f6)',
              color: 'white',
              fontSize: '24px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}
          >
            {currentUser.avatar || currentUser.fullName.slice(0, 2)}
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{currentUser.fullName}</h3>
          <p style={{ color: '#6b7280', fontSize: '13px' }}>{currentUser.email}</p>
          <span className={`badge ${getRoleBadge(currentUser.role)}`} style={{ marginTop: '8px' }}>
            {currentUser.role}
          </span>
        </div>

        <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', fontSize: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px' }}>
            <span style={{ color: '#6b7280' }}>ชื่อผู้ใช้:</span>
            <strong>{currentUser.username}</strong>
            <span style={{ color: '#6b7280' }}>แผนก/กอง:</span>
            <span>{currentUser.department}</span>
            <span style={{ color: '#6b7280' }}>เบอร์โทรศัพท์:</span>
            <span>{currentUser.phone || '081-234-5678'}</span>
            <span style={{ color: '#6b7280' }}>สถานะ:</span>
            <span className="badge badge-active">{currentUser.status}</span>
          </div>
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPassModalOpen}
        onClose={() => setIsPassModalOpen(false)}
        title="เปลี่ยนรหัสผ่าน"
        maxWidth="440px"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setIsPassModalOpen(false)}>
              ยกเลิก
            </button>
            <button className="btn btn-primary" onClick={handleChangePassword}>
              <CheckCircle size={16} /> บันทึกรหัสผ่านใหม่
            </button>
          </>
        }
      >
        <div className="form-group">
          <label>รหัสผ่านเดิม <span className="required">*</span></label>
          <input
            type="password"
            className="form-control"
            placeholder="กรอกรหัสผ่านเดิม"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>รหัสผ่านใหม่ <span className="required">*</span></label>
          <input
            type="password"
            className="form-control"
            placeholder="อย่างน้อย 4 ตัวอักษร"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>ยืนยันรหัสผ่านใหม่ <span className="required">*</span></label>
          <input
            type="password"
            className="form-control"
            placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      </Modal>

      {ToastComponent}
    </>
  );
}
