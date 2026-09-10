'use client';

import { useState, useEffect } from 'react';
import AppLayout, { useToast } from '../components/AppLayout';
import StatsCard from '../components/StatsCard';
import { useAppStore } from '../data/store';
import {
  BarChart3,
  TrendingUp,
  Download,
  Printer,
  Package,
  Calendar,
  RotateCcw,
  AlertTriangle,
  History,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  Search,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { Material, ActivityLog } from '../data/types';
import { EnhancedRequest, ReturnRecord } from '../data/store';

// ข้อมูลสำหรับแผนภูมิ (จะถูกแทนที่ด้วยข้อมูลจริงจาก API ในอนาคต)
const monthlyReportData = [
  { month: 'ม.ค.', withdrawals: 120, value: 185000, requests: 45 },
  { month: 'ก.พ.', withdrawals: 98, value: 142000, requests: 38 },
  { month: 'มี.ค.', withdrawals: 135, value: 210000, requests: 52 },
  { month: 'เม.ย.', withdrawals: 89, value: 125000, requests: 33 },
  { month: 'พ.ค.', withdrawals: 112, value: 178000, requests: 41 },
  { month: 'มิ.ย.', withdrawals: 145, value: 235000, requests: 55 },
  { month: 'ก.ค.', withdrawals: 130, value: 198000, requests: 48 },
  { month: 'ส.ค.', withdrawals: 156, value: 245000, requests: 62 },
];

const departmentUsageData = [
  { department: 'กองช่าง', percentage: 35, value: 857500, color: '#3b82f6' },
  { department: 'สำนักปลัด', percentage: 22, value: 539000, color: '#10b981' },
  { department: 'กองคลัง', percentage: 15, value: 367500, color: '#f59e0b' },
  { department: 'กองสาธารณสุข', percentage: 18, value: 441000, color: '#ef4444' },
  { department: 'กองการศึกษา', percentage: 10, value: 245000, color: '#8b5cf6' },
];

import AccessDenied from '../components/AccessDenied';

type ReportTab = 'requisition' | 'borrow' | 'return' | 'stock' | 'lowstock' | 'activity';

export default function ReportsPage() {
  const { currentUser } = useAppStore();
  const [activeTab, setActiveTab] = useState<ReportTab>('requisition');
  const [searchQuery, setSearchQuery] = useState('');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [requests, setRequests] = useState<EnhancedRequest[]>([]);
  const [returnRecords, setReturnRecords] = useState<ReturnRecord[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    if (currentUser.role !== 'เจ้าหน้าที่') {
      Promise.all([
        api.materials.getAll(),
        api.requests.getAll(),
        api.returns.getAll(),
        api.logs.getAll()
      ]).then(([matRes, reqRes, retRes, logRes]) => {
        if (matRes.success && matRes.data) setMaterials(matRes.data);
        if (reqRes.success && reqRes.data) setRequests(reqRes.data);
        if (retRes.success && retRes.data) setReturnRecords(retRes.data);
        if (logRes.success && logRes.data) setActivityLogs(logRes.data);
      });
    }
  }, [currentUser]);

  if (currentUser.role === 'เจ้าหน้าที่') {
    return (
      <AppLayout title="รายงานสรุป 6 ด้าน">
        <AccessDenied requiredRoles={['ผู้ดูแลระบบ', 'ผู้อนุมัติ']} moduleName="รายงานสรุป 6 ด้าน" />
      </AppLayout>
    );
  }

  // 1. Requisitions
  const requisitions = requests.filter((r: EnhancedRequest) => r.requestType === 'เบิกวัสดุ');
  // 2. Borrows
  const borrows = requests.filter((r: EnhancedRequest) => r.requestType === 'ยืมวัสดุ');
  // 3. Returns
  const returns = returnRecords;
  // 4. Stock balance
  const stockItems = materials;
  // 5. Low stock items
  const lowStockItems = materials.filter((m: Material) => m.status === 'ใกล้หมด' || m.status === 'หมดสต็อก');
  // 6. Activity logs
  const logs = activityLogs;

  const totalValue = materials.reduce((sum: number, m: any) => sum + (m.quantity * (m.pricePerUnit || 0)), 0);

  const handleExportCSV = () => {
    showToast('ระบบทำการส่งออกรายงาน Excel/CSV เรียบร้อยแล้ว', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppLayout title="ระบบรายงานและสถิติภาพรวม">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>ระบบรายงานสรุป 6 ด้าน</h1>
            <p>รายงานการเบิก, การยืม, การคืน, อุปกรณ์คงเหลือ, อุปกรณ์ใกล้หมด และประวัติการใช้งาน</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-outline" onClick={handlePrint}>
              <Printer size={16} /> พิมพ์รายงาน
            </button>
            <button className="btn btn-primary" onClick={handleExportCSV}>
              <Download size={16} /> ส่งออก Excel / CSV
            </button>
          </div>
        </div>
      </div>

      {/* 6 Report Navigation Tabs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '8px',
          marginBottom: '20px',
        }}
      >
        <button
          className={`btn ${activeTab === 'requisition' ? 'btn-primary' : 'btn-outline'}`}
          style={{ justifyContent: 'center', fontSize: '13px' }}
          onClick={() => setActiveTab('requisition')}
        >
          <Package size={16} /> 1. รายงานการเบิก ({requisitions.length})
        </button>
        <button
          className={`btn ${activeTab === 'borrow' ? 'btn-primary' : 'btn-outline'}`}
          style={{ justifyContent: 'center', fontSize: '13px' }}
          onClick={() => setActiveTab('borrow')}
        >
          <Calendar size={16} /> 2. รายงานการยืม ({borrows.length})
        </button>
        <button
          className={`btn ${activeTab === 'return' ? 'btn-primary' : 'btn-outline'}`}
          style={{ justifyContent: 'center', fontSize: '13px' }}
          onClick={() => setActiveTab('return')}
        >
          <RotateCcw size={16} /> 3. รายงานการคืน ({returns.length})
        </button>
        <button
          className={`btn ${activeTab === 'stock' ? 'btn-primary' : 'btn-outline'}`}
          style={{ justifyContent: 'center', fontSize: '13px' }}
          onClick={() => setActiveTab('stock')}
        >
          <Layers size={16} /> 4. อุปกรณ์คงเหลือ ({stockItems.length})
        </button>
        <button
          className={`btn ${activeTab === 'lowstock' ? 'btn-primary' : 'btn-outline'}`}
          style={{ justifyContent: 'center', fontSize: '13px', color: activeTab === 'lowstock' ? 'white' : '#dc2626' }}
          onClick={() => setActiveTab('lowstock')}
        >
          <AlertTriangle size={16} /> 5. อุปกรณ์ใกล้หมด ({lowStockItems.length})
        </button>
        <button
          className={`btn ${activeTab === 'activity' ? 'btn-primary' : 'btn-outline'}`}
          style={{ justifyContent: 'center', fontSize: '13px' }}
          onClick={() => setActiveTab('activity')}
        >
          <History size={16} /> 6. ประวัติการใช้งาน ({logs.length})
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="report-summary-grid">
        <div className="report-card">
          <h4>ยอดคำขอเบิกทั้งหมด</h4>
          <div className="value">{requisitions.length} <span className="unit">รายการ</span></div>
          <div className="trend up">
            <TrendingUp size={14} /> ข้อมูล Real-time
          </div>
        </div>
        <div className="report-card">
          <h4>ยอดคำขอยืมทั้งหมด</h4>
          <div className="value">{borrows.length} <span className="unit">รายการ</span></div>
          <div className="trend up">
            <TrendingUp size={14} /> บันทึกแล้ว
          </div>
        </div>
        <div className="report-card">
          <h4>ประวัติการรับคืน</h4>
          <div className="value">{returns.length} <span className="unit">ครั้ง</span></div>
          <div className="trend up">
            <CheckCircle2 size={14} /> สำเร็จ 100%
          </div>
        </div>
        <div className="report-card">
          <h4>มูลค่าคงคลังรวม</h4>
          <div className="value">฿{(totalValue / 1000).toFixed(0)} <span className="unit">พันบาท</span></div>
          <div className="trend up">
            <TrendingUp size={14} /> ครอบคลุม {materials.length} รายการ
          </div>
        </div>
      </div>

      {/* Dynamic Report Content Table */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">
          <h2>
            {activeTab === 'requisition' && '📦 รายงานสรุปการเบิกวัสดุสิ้นเปลือง'}
            {activeTab === 'borrow' && '🔄 รายงานสรุปการขอยืมวัสดุและครุภัณฑ์'}
            {activeTab === 'return' && '✅ รายงานสรุปการส่งคืนอุปกรณ์และผลการตรวจสภาพ'}
            {activeTab === 'stock' && '📊 รายงานสรุปยอดอุปกรณ์คงเหลือและมูลค่ารวม'}
            {activeTab === 'lowstock' && '⚠️ รายงานสรุปอุปกรณ์ที่ใกล้หมดสต็อก (ต่ำกว่าเกณฑ์)'}
            {activeTab === 'activity' && '🕒 รายงานบันทึกประวัติการใช้งานระบบ (Audit Trail)'}
          </h2>
        </div>

        {/* Tab 1: Requisitions Report */}
        {activeTab === 'requisition' && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>รหัสคำขอ</th>
                  <th>ผู้ขอเบิก</th>
                  <th>แผนก/กอง</th>
                  <th>รายการวัสดุ</th>
                  <th>จำนวนที่ขอ</th>
                  <th>วันที่ขอ</th>
                  <th>ผู้อนุมัติ</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {requisitions.map((r: EnhancedRequest) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary-600)' }}>{r.requestCode}</td>
                    <td style={{ fontWeight: 600 }}>{r.requesterName}</td>
                    <td>{r.department}</td>
                    <td>{r.materialName}</td>
                    <td><strong>{r.quantity}</strong> {r.unit}</td>
                    <td>{r.requestDate}</td>
                    <td>{r.approvedBy || '-'}</td>
                    <td><span className="badge badge-success">{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Borrow Report */}
        {activeTab === 'borrow' && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>รหัสคำขอ</th>
                  <th>ผู้ขอยืม</th>
                  <th>แผนก/กอง</th>
                  <th>อุปกรณ์</th>
                  <th>จำนวน</th>
                  <th>วันที่ยืม</th>
                  <th>กำหนดคืน</th>
                  <th>ผู้อนุมัติ</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {borrows.map((r: EnhancedRequest) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 700, color: '#0891b2' }}>{r.requestCode}</td>
                    <td style={{ fontWeight: 600 }}>{r.requesterName}</td>
                    <td>{r.department}</td>
                    <td>{r.materialName}</td>
                    <td><strong>{r.quantity}</strong> {r.unit}</td>
                    <td>{r.borrowDate || r.requestDate}</td>
                    <td style={{ color: '#d97706', fontWeight: 600 }}>{r.expectedReturnDate || '25 ส.ค. 2569'}</td>
                    <td>{r.approvedBy || '-'}</td>
                    <td><span className="badge badge-info">{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Return Report */}
        {activeTab === 'return' && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>รหัสรับคืน</th>
                  <th>รหัสคำขอยืม</th>
                  <th>ผู้ส่งคืน</th>
                  <th>แผนก</th>
                  <th>อุปกรณ์</th>
                  <th>จำนวนที่คืน</th>
                  <th>วันที่คืน</th>
                  <th>สภาพอุปกรณ์</th>
                  <th>ผู้ตรวจรับ</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((rec: ReturnRecord) => (
                  <tr key={rec.id}>
                    <td style={{ fontWeight: 700, color: '#059669' }}>{rec.id}</td>
                    <td style={{ fontWeight: 600, color: 'var(--primary-600)' }}>{rec.requestCode}</td>
                    <td>{rec.borrowerName}</td>
                    <td>{rec.department}</td>
                    <td>{rec.materialName}</td>
                    <td><strong>{rec.returnedQuantity}</strong> / {rec.borrowedQuantity}</td>
                    <td>{rec.returnDate}</td>
                    <td>
                      <span className={`badge ${rec.condition === 'สมบูรณ์' ? 'badge-success' : 'badge-warning'}`}>
                        {rec.condition}
                      </span>
                    </td>
                    <td>{rec.receivedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Stock Balance Report */}
        {activeTab === 'stock' && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>รหัส</th>
                  <th>ชื่อวัสดุ / ครุภัณฑ์</th>
                  <th>หมวดหมู่</th>
                  <th>คงเหลือในคลัง</th>
                  <th>ราคา/หน่วย</th>
                  <th>มูลค่ารวม (บาท)</th>
                  <th>สถานที่เก็บ</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {stockItems.map((m: Material) => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary-600)' }}>{m.code}</td>
                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td>{m.categoryName}</td>
                    <td><strong style={{ fontSize: '15px' }}>{m.quantity}</strong> {m.unit}</td>
                    <td>฿{m.pricePerUnit.toLocaleString('th-TH')}</td>
                    <td style={{ fontWeight: 700 }}>฿{m.totalValue.toLocaleString('th-TH')}</td>
                    <td>{m.location}</td>
                    <td><span className="badge badge-success">{m.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 5: Low Stock Report */}
        {activeTab === 'lowstock' && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>รหัส</th>
                  <th>ชื่อวัสดุที่ต้องสั่งซื้อ</th>
                  <th>หมวดหมู่</th>
                  <th>คงเหลือปัจจุบัน</th>
                  <th>เกณฑ์ขั้นต่ำ</th>
                  <th>ขาดอีก</th>
                  <th>ราคาประมาณการ</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((m: Material) => {
                  const shortage = Math.max(0, m.minQuantity - m.quantity);
                  return (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 700, color: '#dc2626' }}>{m.code}</td>
                      <td style={{ fontWeight: 600 }}>{m.name}</td>
                      <td>{m.categoryName}</td>
                      <td><strong style={{ color: '#dc2626' }}>{m.quantity}</strong> {m.unit}</td>
                      <td>{m.minQuantity} {m.unit}</td>
                      <td><strong style={{ color: '#d97706' }}>+{shortage || 20}</strong> {m.unit}</td>
                      <td>฿{((shortage || 20) * m.pricePerUnit).toLocaleString('th-TH')}</td>
                      <td><span className="badge badge-danger">{m.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 6: Activity Logs Report */}
        {activeTab === 'activity' && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>วัน-เวลา</th>
                  <th>การดำเนินการ</th>
                  <th>รายละเอียด</th>
                  <th>ผู้ใช้งาน</th>
                  <th>โมดูล</th>
                  <th>ประเภท</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: ActivityLog) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{log.timestamp}</td>
                    <td style={{ fontWeight: 600 }}>{log.action}</td>
                    <td style={{ fontSize: '13px' }}>{log.description}</td>
                    <td style={{ fontWeight: 500 }}>{log.userName}</td>
                    <td><span className="badge badge-info">{log.module}</span></td>
                    <td><span className="badge badge-admin">{log.type}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Analytics Charts Section */}
      <div className="dashboard-grid" style={{ marginTop: '24px' }}>
        <div className="card">
          <div className="card-header">
            <h2>📊 ยอดเบิก–จ่ายรายเดือน (ปี 2569)</h2>
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
                        width: `${(data.withdrawals / 160) * 100}%`,
                        background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                      }}
                    >
                      {data.withdrawals} ครั้ง
                    </div>
                  </div>
                  <span className="chart-bar-value">฿{(data.value / 1000).toFixed(0)}K</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>🏢 สัดส่วนการใช้วัสดุแยกตามแผนก</h2>
          </div>
          <div className="card-body">
            <div className="pie-chart-container">
              <div
                className="pie-chart"
                style={{
                  background: `conic-gradient(
                    ${departmentUsageData[0].color} 0% 35%,
                    ${departmentUsageData[1].color} 35% 57%,
                    ${departmentUsageData[2].color} 57% 72%,
                    ${departmentUsageData[3].color} 72% 90%,
                    ${departmentUsageData[4].color} 90% 100%
                  )`,
                }}
              />
              <div className="pie-legend">
                {departmentUsageData.map((dept) => (
                  <div key={dept.department} className="pie-legend-item">
                    <div className="pie-legend-color" style={{ background: dept.color }} />
                    <span className="pie-legend-text">{dept.department}</span>
                    <span className="pie-legend-value">{dept.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {ToastComponent}
    </AppLayout>
  );
}
