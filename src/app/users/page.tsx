'use client';

import { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import StatsCard from '../components/StatsCard';
import Modal from '../components/Modal';
import { useToast } from '../components/AppLayout';
import { useAppStore } from '../data/store';
import {
  Users,
  UserCheck,
  UserPlus,
  Search,
  Filter,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { departments, type User } from '../data/types';
import { api } from '@/lib/api-client';

import AccessDenied from '../components/AccessDenied';

const emptyUser: Omit<User, 'id' | 'avatar' | 'createdAt' | 'lastLogin'> & { password?: string } = {
  fullName: '',
  username: '',
  password: '',
  email: '',
  department: departments[0] || 'กองช่าง (Public Works)',
  role: 'เจ้าหน้าที่',
  status: 'ใช้งาน',
  phone: '',
};

export default function UsersPage() {
  const { currentUser } = useAppStore();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState(emptyUser);
  const [currentPage, setCurrentPage] = useState(1);
  const { showToast, ToastComponent } = useToast();

  const fetchUsers = async () => {
    setIsLoading(true);
    const res = await api.users.getAll();
    if (res.success && res.data) {
      setUsers(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (currentUser.role === 'ผู้ดูแลระบบ') {
      fetchUsers();
    }
  }, [currentUser]);

  if (currentUser.role !== 'ผู้ดูแลระบบ') {
    return (
      <AppLayout title="การจัดการผู้ใช้งาน">
        <AccessDenied requiredRoles={['ผู้ดูแลระบบ']} moduleName="การจัดการผู้ใช้งาน" />
      </AppLayout>
    );
  }

  const itemsPerPage = 10;

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchSearch =
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = filterRole ? user.role === filterRole : true;
    return matchSearch && matchRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'ใช้งาน').length;
  const pendingUsers = users.filter((u) => u.status === 'ไม่ใช้งาน').length;

  // Open Add Modal
  const handleAdd = () => {
    setEditingUser(null);
    setFormData(emptyUser);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      department: user.department,
      role: user.role,
      status: user.status,
      phone: user.phone,
    });
    setIsModalOpen(true);
  };

  // Save user
  const handleSave = async () => {
    if (!formData.fullName || !formData.username || !formData.department) {
      showToast('กรุณากรอกข้อมูลสำคัญให้ครบถ้วน', 'error');
      return;
    }

    if (editingUser) {
      const res = await api.users.update(editingUser.id, formData);
      if (res.success) {
        showToast('แก้ไขข้อมูลผู้ใช้สำเร็จ', 'success');
        fetchUsers();
      } else {
        showToast(res.error || 'เกิดข้อผิดพลาด', 'error');
      }
    } else {
      const res = await api.users.create({ ...formData, password: 'password123' });
      if (res.success) {
        showToast('เพิ่มผู้ใช้งานใหม่สำเร็จ', 'success');
        fetchUsers();
      } else {
        showToast(res.error || 'เกิดข้อผิดพลาด', 'error');
      }
    }
    setIsModalOpen(false);
  };

  // Delete user
  const handleDelete = async () => {
    if (deletingUser) {
      const res = await api.users.delete(deletingUser.id);
      if (res.success) {
        showToast('ลบผู้ใช้เรียบร้อยแล้ว', 'success');
        fetchUsers();
      } else {
        showToast(res.error || 'เกิดข้อผิดพลาด', 'error');
      }
      setIsDeleteModalOpen(false);
      setDeletingUser(null);
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
    <AppLayout title="ระบบจัดการผู้ใช้งานและกำหนดสิทธิ์">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>จัดการผู้ใช้งานและสิทธิ์การเข้าถึง</h1>
            <p>เพิ่ม แก้ไข ลบ กำหนดสิทธิ์ และควบคุมสถานะการเข้าใช้งานระบบสำหรับบุคลากรเทศบาล</p>
          </div>
          <button className="btn btn-primary" onClick={handleAdd}>
            <Plus size={18} />
            เพิ่มผู้ใช้งานใหม่
          </button>
        </div>
      </div>

      {/* Stats Cards */}
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
          label="ผู้ใช้ที่เปิดใช้งาน (Active)"
          color="green"
        />
        <StatsCard
          icon={<UserPlus size={24} />}
          value={pendingUsers}
          label="ปิดการใช้งาน (Inactive)"
          color="red"
        />
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-toolbar">
          <div className="table-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, ชื่อผู้ใช้, อีเมล, หรือแผนก..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="table-actions">
            <select
              className="form-control"
              style={{ width: '180px', padding: '8px 12px' }}
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">ทุกบทบาทผู้ใช้งาน</option>
              <option value="ผู้ดูแลระบบ">ผู้ดูแลระบบ (Admin)</option>
              <option value="ผู้อนุมัติ">ผู้อนุมัติ (Approver)</option>
              <option value="เจ้าหน้าที่">เจ้าหน้าที่ (Staff)</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ผู้ใช้งาน</th>
                <th>แผนก / กอง</th>
                <th>บทบาท / สิทธิ์</th>
                <th>สถานะ</th>
                <th>เข้าสู่ระบบล่าสุด</th>
                <th>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="table-user-cell">
                      <div className="table-user-avatar">
                        {user.avatar || user.fullName.slice(0, 2)}
                      </div>
                      <div>
                        <div className="table-user-name">{user.fullName}</div>
                        <div className="table-user-email">@{user.username} • {user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{user.department}</td>
                  <td>
                    <span className={`badge ${getRoleBadge(user.role)}`}>
                      <ShieldCheck size={12} /> {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${user.status === 'ใช้งาน' ? 'badge-active' : 'badge-inactive'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{user.lastLogin}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => handleEdit(user)}
                        title="แก้ไขข้อมูลผู้ใช้"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => {
                          setDeletingUser(user);
                          setIsDeleteModalOpen(true);
                        }}
                        title="ลบผู้ใช้"
                        style={{ color: 'var(--danger-500)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>แสดง {(currentPage - 1) * itemsPerPage + 1} ถึง {Math.min(currentPage * itemsPerPage, filteredUsers.length)} จาก {filteredUsers.length} รายการ</span>
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`pagination-btn ${page === currentPage ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal เพิ่ม/แก้ไขผู้ใช้ */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'แก้ไขข้อมูลผู้ใช้งานและสิทธิ์' : 'เพิ่มผู้ใช้งานใหม่'}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
              ยกเลิก
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              บันทึกข้อมูล
            </button>
          </>
        }
      >
        <div className="form-group">
          <label>ชื่อ-นามสกุล <span className="required">*</span></label>
          <input
            type="text"
            className="form-control"
            placeholder="เช่น สมชาย ใจดี"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>ชื่อผู้ใช้งานสำหรับ Login <span className="required">*</span></label>
          <input
            type="text"
            className="form-control"
            placeholder="เช่น somchai.j"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>
            รหัสผ่าน {editingUser ? '(ปล่อยว่างเพื่อคงรหัสผ่านเดิม)' : <><span className="required">*</span> (หากปล่อยว่างจะใช้ password123)</>}
          </label>
          <input
            type="password"
            className="form-control"
            placeholder={editingUser ? '••••••••' : 'เช่น password123'}
            value={formData.password || ''}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>อีเมลหน่วยงาน</label>
          <input
            type="email"
            className="form-control"
            placeholder="example@rangsit.go.th"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>เบอร์โทรศัพท์ติดต่อ</label>
          <input
            type="tel"
            className="form-control"
            placeholder="08X-XXX-XXXX"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>แผนก / กองสังกัด <span className="required">*</span></label>
          <select
            className="form-control"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>กำหนดระดับสิทธิ์การใช้งาน (Role) <span className="required">*</span></label>
          <div className="form-radio-group">
            <label className={`form-radio ${formData.role === 'ผู้ดูแลระบบ' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="role"
                checked={formData.role === 'ผู้ดูแลระบบ'}
                onChange={() => setFormData({ ...formData, role: 'ผู้ดูแลระบบ' })}
              />
              <div className="form-radio-info">
                <h4>1) ผู้ดูแลระบบ (Administrator)</h4>
                <p>จัดการผู้ใช้, หมวดหมู่, สิทธิ์, วัสดุ, สต็อก, ประวัติ และรายงานทั้งหมด</p>
              </div>
            </label>

            <label className={`form-radio ${formData.role === 'ผู้อนุมัติ' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="role"
                checked={formData.role === 'ผู้อนุมัติ'}
                onChange={() => setFormData({ ...formData, role: 'ผู้อนุมัติ' })}
              />
              <div className="form-radio-info">
                <h4>2) ผู้อนุมัติ (Approver)</h4>
                <p>ตรวจสอบคำขอเบิก–ยืม, อนุมัติ/ไม่อนุมัติพร้อมระบุเหตุผล และดูรายงาน</p>
              </div>
            </label>

            <label className={`form-radio ${formData.role === 'เจ้าหน้าที่' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="role"
                checked={formData.role === 'เจ้าหน้าที่'}
                onChange={() => setFormData({ ...formData, role: 'เจ้าหน้าที่' })}
              />
              <div className="form-radio-info">
                <h4>3) เจ้าหน้าที่ผู้ใช้งาน (Staff)</h4>
                <p>ค้นหาวัสดุ, ส่งคำขอเบิก, ส่งคำขอยืม, และบันทึกการคืนอุปกรณ์</p>
              </div>
            </label>
          </div>
        </div>

        <div className="form-group">
          <div className="form-switch">
            <div className="form-switch-label">
              <strong>สถานะการเข้าสู่ระบบ</strong>
              <p>เปิดหรือปิดสิทธิ์ให้ผู้ใช้บัญชีนี้สามารถ Login เข้าสู่ระบบได้</p>
            </div>
            <button
              type="button"
              className={`switch ${formData.status === 'ใช้งาน' ? 'active' : ''}`}
              onClick={() =>
                setFormData({
                  ...formData,
                  status: formData.status === 'ใช้งาน' ? 'ไม่ใช้งาน' : 'ใช้งาน',
                })
              }
            />
          </div>
        </div>
      </Modal>

      {/* Modal ยืนยันลบ */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="ยืนยันการลบผู้ใช้"
        maxWidth="420px"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setIsDeleteModalOpen(false)}>
              ยกเลิก
            </button>
            <button className="btn btn-danger" onClick={handleDelete}>
              ลบผู้ใช้งาน
            </button>
          </>
        }
      >
        <div className="confirm-dialog">
          <div className="confirm-dialog-icon">🗑️</div>
          <h3>ต้องการลบผู้ใช้นี้?</h3>
          <p>คุณกำลังจะลบ <strong>{deletingUser?.fullName}</strong> (@{deletingUser?.username})</p>
        </div>
      </Modal>

      {ToastComponent}
    </AppLayout>
  );
}
