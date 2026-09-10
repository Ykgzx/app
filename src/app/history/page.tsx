'use client';

import { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import StatsCard from '../components/StatsCard';
import { useAppStore } from '../data/store';
import { api } from '@/lib/api-client';
import { ActivityLog } from '../data/types';
import {
  History,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import AccessDenied from '../components/AccessDenied';

export default function HistoryPage() {
  const { currentUser } = useAppStore();
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchLogs = async () => {
    setIsLoading(true);
    const res = await api.logs.getAll();
    if (res.success && res.data) setActivityLogs(res.data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (currentUser.role === 'ผู้ดูแลระบบ') {
      fetchLogs();
    }
  }, [currentUser]);

  if (currentUser.role !== 'ผู้ดูแลระบบ') {
    return (
      <AppLayout title="ประวัติการใช้งาน">
        <AccessDenied requiredRoles={['ผู้ดูแลระบบ']} moduleName="ประวัติการใช้งาน (Audit Trail)" />
      </AppLayout>
    );
  }

  const itemsPerPage = 10;

  const filteredLogs = activityLogs.filter((log) => {
    const matchSearch =
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType ? log.type === filterType : true;
    const matchModule = filterModule ? log.module === filterModule : true;
    return matchSearch && matchType && matchModule;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const types = ['สร้าง', 'แก้ไข', 'ลบ', 'เข้าสู่ระบบ', 'อนุมัติ', 'เบิกจ่าย'];
  const modules = [...new Set(activityLogs.map((l) => l.module))];

  const getIconClass = (type: string) => {
    switch (type) {
      case 'สร้าง': return 'create';
      case 'แก้ไข': return 'edit';
      case 'ลบ': return 'delete';
      case 'เข้าสู่ระบบ': return 'login';
      case 'อนุมัติ': return 'approve';
      case 'เบิกจ่าย': return 'withdraw';
      default: return '';
    }
  };

  const getIconEmoji = (type: string) => {
    switch (type) {
      case 'สร้าง': return '➕';
      case 'แก้ไข': return '✏️';
      case 'ลบ': return '🗑️';
      case 'เข้าสู่ระบบ': return '🔑';
      case 'อนุมัติ': return '✅';
      case 'เบิกจ่าย': return '📦';
      default: return '📋';
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'สร้าง': return 'badge-success';
      case 'แก้ไข': return 'badge-info';
      case 'ลบ': return 'badge-danger';
      case 'เข้าสู่ระบบ': return 'badge-info';
      case 'อนุมัติ': return 'badge-warning';
      case 'เบิกจ่าย': return 'badge-success';
      default: return '';
    }
  };

  return (
    <AppLayout title="ประวัติการใช้งานและบันทึกกิจกรรม">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>ประวัติการใช้งานทั้งหมด (Audit Trail)</h1>
            <p>ตรวจสอบและติดตามทุกกิจกรรมการเข้าใช้งาน การแก้ไขข้อมูล การเบิก-ยืม และการอนุมัติในระบบ</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatsCard icon={<History size={24} />} value={activityLogs.length} label="กิจกรรมทั้งหมดที่บันทึก" color="blue" />
        <StatsCard
          icon={<History size={24} />}
          value={activityLogs.filter((l) => l.type === 'เข้าสู่ระบบ').length}
          label="การเข้าสู่ระบบ/สลับสิทธิ์"
          color="cyan"
        />
        <StatsCard
          icon={<History size={24} />}
          value={activityLogs.filter((l) => l.type === 'สร้าง' || l.type === 'แก้ไข' || l.type === 'ลบ').length}
          label="การจัดการข้อมูลวัสดุ/ผู้ใช้"
          color="orange"
        />
        <StatsCard
          icon={<History size={24} />}
          value={activityLogs.filter((l) => l.type === 'อนุมัติ').length}
          label="รายการพิจารณาอนุมัติ"
          color="green"
        />
      </div>

      {/* Toolbar filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="table-search" style={{ flex: 1 }}>
          <Search size={18} />
          <input
            type="text"
            placeholder="ค้นหาประวัติการใช้งาน, ผู้ดำเนินการ, การกระทำ..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            style={{ width: '100%' }}
          />
        </div>
        <select
          className="form-control"
          style={{ width: '160px', padding: '8px 12px' }}
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
        >
          <option value="">ทุกประเภทกิจกรรม</option>
          {types.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          className="form-control"
          style={{ width: '160px', padding: '8px 12px' }}
          value={filterModule}
          onChange={(e) => { setFilterModule(e.target.value); setCurrentPage(1); }}
        >
          <option value="">ทุกโมดูลระบบ</option>
          {modules.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Activity Log List */}
      <div className="card">
        <div className="activity-list">
          {paginatedLogs.map((log) => (
            <div key={log.id} className="activity-item">
              <div className={`activity-icon ${getIconClass(log.type)}`}>
                {getIconEmoji(log.type)}
              </div>
              <div className="activity-info">
                <h4>{log.action}</h4>
                <p>{log.description}</p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
                  <span className={`badge ${getTypeBadge(log.type)}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                    {log.type}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    👤 {log.userName}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    🌐 {log.ipAddress}
                  </span>
                </div>
              </div>
              <div className="activity-meta">
                <div className="time">{log.timestamp}</div>
                <div className="module">{log.module}</div>
              </div>
            </div>
          ))}
        </div>

        {filteredLogs.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>ไม่พบบันทึกกิจกรรม</h3>
            <p>ลองเปลี่ยนเงื่อนไขการค้นหาหรือตัวกรอง</p>
          </div>
        )}

        <div className="table-footer">
          <span>แสดง {Math.min((currentPage - 1) * itemsPerPage + 1, filteredLogs.length)} ถึง {Math.min(currentPage * itemsPerPage, filteredLogs.length)} จาก {filteredLogs.length} รายการ</span>
          <div className="pagination">
            <button className="pagination-btn" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button key={page} className={`pagination-btn ${page === currentPage ? 'active' : ''}`} onClick={() => setCurrentPage(page)}>
                {page}
              </button>
            ))}
            <button className="pagination-btn" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
