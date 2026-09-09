'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, UserCheck, Users, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { useAppStore } from '../data/store';
import { mockUsers, type User } from '../data/mockData';

export default function LoginPage() {
  const router = useRouter();
  const { users, setCurrentUser, addActivityLog, updateUser } = useAppStore();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const demoAccounts = [
    {
      role: 'ผู้ดูแลระบบ',
      roleBadge: '1) ผู้ดูแลระบบ (Administrator)',
      email: 'admin@rangsit.go.th',
      name: 'สมชาย ใจดี',
      department: 'กองช่าง',
      icon: ShieldCheck,
      color: '#2563eb',
      bg: '#eff6ff',
      border: '#93c5fd',
    },
    {
      role: 'ผู้อนุมัติ',
      roleBadge: '2) ผู้อนุมัติ (Approver)',
      email: 'approver@rangsit.go.th',
      name: 'ประยุทธ์ มั่นคง',
      department: 'กองช่าง',
      icon: UserCheck,
      color: '#d97706',
      bg: '#fffbeb',
      border: '#fde68a',
    },
    {
      role: 'เจ้าหน้าที่',
      roleBadge: '3) เจ้าหน้าที่ผู้ใช้งาน (Staff)',
      email: 'staff@rangsit.go.th',
      name: 'วันทนา สุขกมล',
      department: 'สำนักปลัด',
      icon: Users,
      color: '#0d9488',
      bg: '#f0fdfa',
      border: '#99f6e4',
    },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername.trim()) {
      setError('กรุณากรอกอีเมลหรือชื่อผู้ใช้งาน');
      return;
    }
    if (!password.trim()) {
      setError('กรุณากรอกรหัสผ่าน');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // เรียก Login API พร้อมรหัสผ่าน
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: emailOrUsername.trim(),
          password: password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
        setIsLoading(false);
        return;
      }

      // เก็บ JWT token ใน sessionStorage (ปลอดภัยกว่า localStorage)
      if (data.data?.token) {
        sessionStorage.setItem('auth_token', data.data.token);
      }

      // Fallback: ค้นหา user จาก store เพื่อ set currentUser
      const query = emailOrUsername.trim().toLowerCase();
      const allUsers = [...users, ...mockUsers];
      let found: User | undefined = allUsers.find((u) => u.email.toLowerCase() === query);
      if (!found) found = allUsers.find((u) => u.username.toLowerCase() === query);
      if (!found) {
        if (query === 'admin' || query.startsWith('admin@')) found = allUsers.find((u) => u.role === 'ผู้ดูแลระบบ' && u.status === 'ใช้งาน');
        else if (query === 'approver' || query.startsWith('approver@')) found = allUsers.find((u) => u.role === 'ผู้อนุมัติ' && u.status === 'ใช้งาน');
        else if (query === 'staff' || query.startsWith('staff@')) found = allUsers.find((u) => u.role === 'เจ้าหน้าที่' && u.status === 'ใช้งาน');
      }

      if (found) {
        setCurrentUser(found);
        addActivityLog({
          action: 'เข้าสู่ระบบ',
          description: `${found.fullName} (${found.role}) เข้าสู่ระบบสำเร็จ`,
          userName: found.fullName,
          module: 'ระบบ',
          type: 'เข้าสู่ระบบ',
        });
      }

      setTimeout(() => {
        router.push('/');
      }, 200);
    } catch {
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
      setIsLoading(false);
    }
  };

  const handleSelectDemoAccount = (email: string) => {
    setEmailOrUsername(email);
    setPassword('password123');
    setError('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f1724 0%, #1a2332 50%, #1e3a5f 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1e3a5f, #0f1724)',
            padding: '36px 32px',
            color: 'white',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #c4a35a, #d4b76a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              margin: '0 auto 16px',
              boxShadow: '0 8px 16px rgba(196, 163, 90, 0.3)',
            }}
          >
            🏛️
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 6px' }}>เทศบาลนครรังสิต</h1>
          <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
            ระบบจัดการวัสดุและครุภัณฑ์เทศบาล
          </p>
        </div>

        {/* Body Form */}
        <div style={{ padding: '32px' }}>
          <form onSubmit={handleLogin}>
            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  background: '#fee2e2',
                  color: '#dc2626',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '16px',
                  fontWeight: 500,
                }}
              >
                {error}
              </div>
            )}

            <div className="form-group">
              <label>อีเมล หรือ ชื่อผู้ใช้งาน (Email / Username)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="เช่น admin@rangsit.go.th หรือ somchai.j"
                  value={emailOrUsername}
                  onChange={(e) => {
                    setEmailOrUsername(e.target.value);
                    setError('');
                  }}
                  style={{ paddingLeft: '40px' }}
                  autoFocus
                />
                <Mail
                  size={18}
                  style={{ position: 'absolute', left: '12px', top: '12px', color: '#9ca3af' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>รหัสผ่าน (Password)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
                <Lock
                  size={18}
                  style={{ position: 'absolute', left: '12px', top: '12px', color: '#9ca3af' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '15px',
                justifyContent: 'center',
                marginTop: '8px',
                fontWeight: 600,
              }}
            >
              {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'} <ArrowRight size={18} />
            </button>
          </form>

          {/* Demo Accounts List */}
          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#4b5563',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Sparkles size={16} color="#d97706" /> บัญชีอีเมลสำหรับทดสอบแต่ละบทบาท:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {demoAccounts.map((acc) => {
                const Icon = acc.icon;
                const isSelected = emailOrUsername === acc.email;

                return (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleSelectDemoAccount(acc.email)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: `1.5px solid ${isSelected ? acc.color : acc.border}`,
                      background: isSelected ? acc.bg : '#fafafa',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      width: '100%',
                    }}
                  >
                    <Icon size={20} style={{ color: acc.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                        {acc.roleBadge}
                      </div>
                      <div style={{ fontSize: '12px', color: acc.color, fontWeight: 500, fontFamily: 'monospace' }}>
                        {acc.email}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>
                        {acc.name} • {acc.department}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: isSelected ? acc.color : '#e5e7eb',
                        color: isSelected ? 'white' : '#374151',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isSelected ? 'เลือกแล้ว' : 'กรอกอีเมลนี้'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
