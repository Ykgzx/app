'use client';

import { useState, useEffect } from 'react';
import AppLayout from './components/AppLayout';
import StatsCard from './components/StatsCard';
import { useAppStore } from './data/store';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  UserPlus,
  Package,
  FolderOpen,
  AlertTriangle,
  ClipboardCheck,
  Send,
  RotateCcw,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api-client';



export default function DashboardPage() {
  const { currentUser } = useAppStore();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalMaterials: 0,
    totalCategories: 0,
    pendingApprovals: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    activeBorrows: 0,
    recentLogs: [] as { id: string; action: string; description: string; type: string; timestamp: string; module: string }[],
    monthlyReportData: [] as { month: string; withdrawals: number; value: number; requests: number }[],
    departmentUsageData: [] as { department: string; percentage: number; value: number; color: string }[],
  });
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.dashboard.getStats();
        if (res.success && res.data) {
          setStats(res.data as any);
        }
      } catch (err) {}
    };
    fetchStats();
  }, []);

  const totalUsers = stats.totalUsers;
  const activeUsers = stats.activeUsers;
  const totalMaterials = stats.totalMaterials;
  const totalCategories = stats.totalCategories;
  const pendingApprovals = stats.pendingApprovals;
  const lowStockItems = stats.lowStockItems;
  const borrowingItems = stats.activeBorrows;
  const monthlyReportData = stats.monthlyReportData || [];
  const departmentUsageData = stats.departmentUsageData || [];

  const maxWithdrawals = Math.max(...monthlyReportData.map((d) => d.withdrawals), 10);

  const pieGradient = departmentUsageData.length > 0
    ? (() => {
        let currentPercent = 0;
        const parts = departmentUsageData.map((dept, index) => {
          const start = currentPercent;
          currentPercent += dept.percentage;
          const end = index === departmentUsageData.length - 1 ? 100 : currentPercent;
          return `${dept.color} ${start}% ${end}%`;
        });
        return `conic-gradient(${parts.join(', ')})`;
      })()
    : 'conic-gradient(#e5e7eb 0% 100%)';

  return (
    <AppLayout title="ระบบจัดการวัสดุเทศบาล">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>แดชบอร์ดภาพรวมระบบ</h1>
            <p>เทศบาลนครรังสิต • ยินดีต้อนรับคุณ {currentUser.fullName} ({currentUser.role})</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/requests" className="btn btn-primary">
              <Send size={16} /> ส่งคำขอเบิก–ยืม
            </Link>
            <Link href="/returns" className="btn btn-outline">
              <RotateCcw size={16} /> คืนอุปกรณ์
            </Link>
          </div>
        </div>
      </div>



      {/* Main Stats Grid */}
      <div className="stats-grid">
        <StatsCard
          icon={<Users size={24} />}
          value={totalUsers}
          label="ผู้ใช้ทั้งหมดในระบบ"
          color="blue"
        />
        <StatsCard
          icon={<UserCheck size={24} />}
          value={activeUsers}
          label="ผู้ใช้ที่เปิดใช้งาน"
          color="green"
        />
        <StatsCard
          icon={<ClipboardCheck size={24} />}
          value={pendingApprovals}
          label="คำขอรอการอนุมัติ"
          color="purple"
        />
        <StatsCard
          icon={<Package size={24} />}
          value={totalMaterials}
          label="รายการวัสดุและครุภัณฑ์"
          color="orange"
        />
        <StatsCard
          icon={<FolderOpen size={24} />}
          value={totalCategories}
          label="หมวดหมู่วัสดุ"
          color="cyan"
        />
        <StatsCard
          icon={<RotateCcw size={24} />}
          value={borrowingItems}
          label="รายการที่กำลังยืมอยู่"
          color="red"
        />
      </div>

      {/* Charts and Action Boards */}
      <div className="dashboard-grid">
        {/* Monthly withdrawal chart */}
        <div className="card">
          <div className="card-header">
            <h2>📊 ยอดเบิกจ่ายรายเดือน (ปี 2569)</h2>
          </div>
          <div className="card-body">
            <div className="chart-placeholder">
              {monthlyReportData.map((data) => (
                <div key={data.month} className="chart-bar-container">
                  <span className="chart-bar-label">{data.month}</span>
                  <div className="chart-bar-track">
                    <div
                      className="chart-bar-fill"
                      style={{
                        width: `${(data.withdrawals / maxWithdrawals) * 100}%`,
                        background: `linear-gradient(90deg, #3b82f6, #60a5fa)`,
                      }}
                    >
                      {data.withdrawals}
                    </div>
                  </div>
                  <span className="chart-bar-value">
                    ฿{(data.value / 1000).toFixed(0)}K
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Department Usage Pie */}
        <div className="card">
          <div className="card-header">
            <h2>🏢 สัดส่วนการใช้วัสดุแต่ละแผนก</h2>
          </div>
          <div className="card-body">
            <div className="pie-chart-container">
              <div
                className="pie-chart"
                style={{ background: pieGradient }}
              />
              <div className="pie-legend">
                {departmentUsageData.map((dept) => (
                  <div key={dept.department} className="pie-legend-item">
                    <div
                      className="pie-legend-color"
                      style={{ background: dept.color }}
                    />
                    <span className="pie-legend-text">{dept.department}</span>
                    <span className="pie-legend-value">{dept.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Needed Alerts */}
        <div className="card">
          <div className="card-header">
            <h2>⚠️ การแจ้งเตือนและการดำเนินงานด่วน</h2>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link
                href="/approvals"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  background: 'var(--warning-50)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--warning-100)',
                }}
              >
                <ClipboardCheck size={20} style={{ color: 'var(--warning-600)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    คำขอเบิก–ยืม รอพิจารณาอนุมัติ
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    มี {pendingApprovals} รายการที่รอการอนุมัติจากผู้อนุมัติ
                  </div>
                </div>
                <span className="badge badge-warning">คลิกเพื่อดู</span>
              </Link>

              <Link
                href="/inventory"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  background: 'var(--danger-50)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--danger-100)',
                }}
              >
                <AlertTriangle size={20} style={{ color: 'var(--danger-600)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    วัสดุใกล้หมดสต็อก
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    มี {lowStockItems} รายการต่ำกว่าเกณฑ์ขั้นต่ำ ต้องสั่งเติม
                  </div>
                </div>
                <span className="badge badge-danger">เติมสต็อก</span>
              </Link>

              <Link
                href="/returns"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  background: 'var(--info-50)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--info-100)',
                }}
              >
                <RotateCcw size={20} style={{ color: 'var(--info-600)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    วัสดุและอุปกรณ์ที่อยู่ระหว่างยืม
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    มี {borrowingItems} รายการรอการส่งคืนเข้าคลัง
                  </div>
                </div>
                <span className="badge badge-info">บันทึกคืน</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>🕐 กิจกรรมล่าสุดในระบบ</h2>
            <Link href="/history" style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600 }}>
              ดูทั้งหมด →
            </Link>
          </div>
          <div className="activity-list">
            {stats.recentLogs.slice(0, 5).map((log) => {
              const iconClass =
                log.type === 'สร้าง' ? 'create' :
                  log.type === 'แก้ไข' ? 'edit' :
                    log.type === 'ลบ' ? 'delete' :
                      log.type === 'เข้าสู่ระบบ' ? 'login' :
                        log.type === 'อนุมัติ' ? 'approve' :
                          'withdraw';

              const iconEmoji =
                log.type === 'สร้าง' ? '➕' :
                  log.type === 'แก้ไข' ? '✏️' :
                    log.type === 'ลบ' ? '🗑️' :
                      log.type === 'เข้าสู่ระบบ' ? '🔑' :
                        log.type === 'อนุมัติ' ? '✅' :
                          '📦';

              return (
                <div key={log.id} className="activity-item">
                  <div className={`activity-icon ${iconClass}`}>
                    {iconEmoji}
                  </div>
                  <div className="activity-info">
                    <h4>{log.action}</h4>
                    <p>{log.description}</p>
                  </div>
                  <div className="activity-meta">
                    <div className="time">{log.timestamp.split(' ').slice(0, 3).join(' ')}</div>
                    <div className="module">{log.module}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
