'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  ClipboardCheck,
  Package,
  History,
  BarChart3,
  Send,
  RotateCcw,
  ShieldAlert,
  UserCheck,
  User as UserIcon,
  LogOut,
} from 'lucide-react';
import { useAppStore } from '../data/store';

export default function Sidebar() {
  const pathname = usePathname();
  const { currentUser } = useAppStore();

  const getRoleBadgeColor = () => {
    if (currentUser.role === 'ผู้ดูแลระบบ') return 'badge-admin';
    if (currentUser.role === 'ผู้อนุมัติ') return 'badge-approver';
    return 'badge-staff';
  };

  const navItems = [
    {
      href: '/',
      label: 'แดชบอร์ด',
      icon: LayoutDashboard,
      roles: ['ผู้ดูแลระบบ', 'ผู้อนุมัติ', 'เจ้าหน้าที่'],
    },
    {
      href: '/requests',
      label: 'ส่งคำขอเบิก–ยืม',
      icon: Send,
      roles: ['ผู้ดูแลระบบ', 'ผู้อนุมัติ', 'เจ้าหน้าที่'],
      badge: 'เจ้าหน้าที่',
    },
    {
      href: '/returns',
      label: 'บันทึกการคืนวัสดุ',
      icon: RotateCcw,
      roles: ['ผู้ดูแลระบบ', 'ผู้อนุมัติ', 'เจ้าหน้าที่'],
    },
    {
      href: '/approvals',
      label: 'การอนุมัติคำขอ',
      icon: ClipboardCheck,
      roles: ['ผู้อนุมัติ'],
      badge: 'ผู้อนุมัติ',
    },
    {
      href: '/inventory',
      label: 'คลังวัสดุและครุภัณฑ์',
      icon: Package,
      roles: ['ผู้ดูแลระบบ', 'ผู้อนุมัติ', 'เจ้าหน้าที่'],
    },
    {
      href: '/materials',
      label: 'จัดการวัสดุและครุภัณฑ์',
      icon: Package,
      roles: ['ผู้ดูแลระบบ', 'ผู้อนุมัติ'],
    },
    {
      href: '/categories',
      label: 'หมวดหมู่วัสดุ',
      icon: FolderOpen,
      roles: ['ผู้ดูแลระบบ'],
    },
    {
      href: '/users',
      label: 'การจัดการผู้ใช้งาน',
      icon: Users,
      roles: ['ผู้ดูแลระบบ'],
      badge: 'แอดมิน',
    },
    {
      href: '/history',
      label: 'ประวัติการใช้งาน',
      icon: History,
      roles: ['ผู้ดูแลระบบ'],
    },
    {
      href: '/reports',
      label: 'รายงานสรุป 6 ด้าน',
      icon: BarChart3,
      roles: ['ผู้ดูแลระบบ', 'ผู้อนุมัติ'],
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon" style={{ padding: 0, overflow: 'hidden' }}>
          <img
            src="/logo-rangsit.png"
            alt="ตราเทศบาลนครรังสิต"
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
          />
        </div>
        <div className="sidebar-logo-text">
          <h2>เทศบาลนคร<br />รังสิต</h2>
          <p>ระบบจัดการวัสดุเทศบาล</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems
          .filter((item) => item.roles.includes(currentUser.role))
          .map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(255,255,255,0.15)',
                      color: 'rgba(255,255,255,0.85)',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
      </nav>

      {/* User profile section at footer */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 4px', marginBottom: '6px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '12px',
              color: 'white',
            }}
          >
            {currentUser.avatar || currentUser.fullName.slice(0, 2)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser.fullName}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
              {currentUser.role}
            </div>
          </div>
        </div>

        <Link
          href="/login"
          className="sidebar-nav-item"
          style={{ padding: '8px 12px', fontSize: '13px', color: '#f87171' }}
        >
          <LogOut size={16} />
          <span>ออกจากระบบ</span>
        </Link>
      </div>
    </aside>
  );
}
