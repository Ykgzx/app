'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, UserCheck, Users, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { useAppStore } from '../data/store';
import { type User } from '../data/types';

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser } = useAppStore();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);


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

      // ใช้ข้อมูล user จาก API response ตรงๆ
      const loginUser = data.data?.user;
      if (loginUser) {
        const userForStore: User = {
          id: loginUser.id,
          fullName: loginUser.fullName,
          username: loginUser.username,
          email: loginUser.email,
          department: loginUser.department,
          role: loginUser.role,
          status: loginUser.status,
          avatar: loginUser.avatar || loginUser.fullName.slice(0, 2),
          phone: loginUser.phone || '',
          lastLogin: new Date().toLocaleString('th-TH'),
          createdAt: '',
        };
        setCurrentUser(userForStore);
      }

      setTimeout(() => {
        router.push('/');
      }, 200);
    } catch {
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
      setIsLoading(false);
    }
  };


  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(rgba(15, 23, 36, 0.6), rgba(30, 58, 95, 0.8)), url(/bg-rssc.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
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
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.2)',
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
          <img
            src="/logo-rangsit.png"
            alt="โลโก้เทศบาลนครรังสิต"
            style={{
              width: '96px',
              height: '96px',
              objectFit: 'cover',
              margin: '0 auto 16px',
              display: 'block',
              borderRadius: '50%',
              backgroundColor: 'white'
            }}
          />
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


        </div>
      </div>
    </div>
  );
}
