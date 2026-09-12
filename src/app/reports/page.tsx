'use client';

import { useState, useEffect, useMemo } from 'react';
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

  // คำนวณข้อมูลจากฐานข้อมูลจริง
  const monthlyReportData = useMemo(() => {
    const thMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const monthData = Array(12).fill(null).map((_, i) => ({
      month: thMonths[i],
      withdrawals: 0,
      value: 0,
      requests: 0
    }));

    requests.forEach((req: EnhancedRequest) => {
      if (!req.requestDate) return;
      const parts = req.requestDate.split(' ');
      if (parts.length >= 2) {
        const monthStr = parts[1];
        const monthIndex = thMonths.indexOf(monthStr);
        if (monthIndex !== -1) {
          const mat = materials.find((m: Material) => m.name === req.materialName);
          const price = mat ? (mat.pricePerUnit || 150) : 150; // fallback price
          const val = req.quantity * price;

          monthData[monthIndex].requests += 1;
          if (req.requestType === 'เบิกวัสดุ') {
             monthData[monthIndex].withdrawals += 1;
          }
          monthData[monthIndex].value += val;
        }
      }
    });

    return monthData;
  }, [requests, materials]);

  const maxWithdrawals = Math.max(...monthlyReportData.map(d => d.withdrawals), 10);

  const departmentUsageData = useMemo(() => {
    const deptMap: Record<string, number> = {};
    let deptTotalValue = 0;

    requests.forEach((req: EnhancedRequest) => {
      const mat = materials.find((m: Material) => m.name === req.materialName);
      const price = mat ? (mat.pricePerUnit || 150) : 150;
      const val = req.quantity * price;
      
      const deptName = req.department || 'ไม่ระบุ';
      deptMap[deptName] = (deptMap[deptName] || 0) + val;
      deptTotalValue += val;
    });

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];
    
    let arr = Object.keys(deptMap).map((dept) => ({
      department: dept,
      value: deptMap[dept],
      percentage: deptTotalValue > 0 ? (deptMap[dept] / deptTotalValue) * 100 : 0,
      color: ''
    })).sort((a, b) => b.value - a.value);

    // If no data, provide a default empty state
    if (arr.length === 0) {
      return [{ department: 'ไม่มีข้อมูล', percentage: 100, value: 0, color: '#e5e7eb' }];
    }

    return arr.map((item, index) => ({
      ...item,
      percentage: Math.round(item.percentage),
      color: colors[index % colors.length]
    }));
  }, [requests, materials]);

  const pieGradient = useMemo(() => {
    let currentPercent = 0;
    const parts = departmentUsageData.map((dept, index) => {
      const start = currentPercent;
      currentPercent += dept.percentage;
      const end = (index === departmentUsageData.length - 1) ? 100 : currentPercent;
      return `${dept.color} ${start}% ${end}%`;
    });
    return `conic-gradient(${parts.join(', ')})`;
  }, [departmentUsageData]);

  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    const filename = `report_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;

    if (activeTab === 'requisition') {
      headers = ['รหัสคำขอ', 'ผู้ขอเบิก', 'แผนก/กอง', 'รายการวัสดุ', 'จำนวนที่ขอ', 'หน่วย', 'วันที่ขอ', 'ผู้อนุมัติ', 'สถานะ'];
      rows = requisitions.map((r: EnhancedRequest) => [r.requestCode, r.requesterName, r.department, r.materialName, r.quantity, r.unit, r.requestDate, r.approvedBy || '-', r.status]);
    } else if (activeTab === 'borrow') {
      headers = ['รหัสคำขอ', 'ผู้ขอยืม', 'แผนก/กอง', 'อุปกรณ์', 'จำนวน', 'หน่วย', 'วันที่ยืม', 'กำหนดคืน', 'ผู้อนุมัติ', 'สถานะ'];
      rows = borrows.map((r: EnhancedRequest) => [r.requestCode, r.requesterName, r.department, r.materialName, r.quantity, r.unit, r.borrowDate || r.requestDate, r.expectedReturnDate || '-', r.approvedBy || '-', r.status]);
    } else if (activeTab === 'return') {
      headers = ['รหัสรับคืน', 'รหัสคำขอยืม', 'ผู้ส่งคืน', 'แผนก', 'อุปกรณ์', 'จำนวนที่คืน', 'จำนวนที่ยืม', 'วันที่คืน', 'สภาพอุปกรณ์', 'ผู้ตรวจรับ'];
      rows = returns.map((rec: ReturnRecord) => [rec.id, rec.requestCode, rec.borrowerName, rec.department, rec.materialName, rec.returnedQuantity, rec.borrowedQuantity, rec.returnDate, rec.condition, rec.receivedBy]);
    } else if (activeTab === 'stock') {
      headers = ['รหัส', 'ชื่อวัสดุ / ครุภัณฑ์', 'หมวดหมู่', 'คงเหลือในคลัง', 'หน่วย', 'ราคา/หน่วย', 'มูลค่ารวม (บาท)', 'สถานที่เก็บ', 'สถานะ'];
      rows = stockItems.map((m: Material) => [m.code, m.name, m.categoryName, m.quantity, m.unit, m.pricePerUnit, m.totalValue, m.location, m.status]);
    } else if (activeTab === 'lowstock') {
      headers = ['รหัส', 'ชื่อวัสดุที่ต้องสั่งซื้อ', 'หมวดหมู่', 'คงเหลือปัจจุบัน', 'เกณฑ์ขั้นต่ำ', 'ขาดอีก', 'หน่วย', 'ราคาประมาณการ', 'สถานะ'];
      rows = lowStockItems.map((m: Material) => {
        const shortage = Math.max(0, m.minQuantity - m.quantity);
        return [m.code, m.name, m.categoryName, m.quantity, m.minQuantity, shortage || 20, m.unit, (shortage || 20) * m.pricePerUnit, m.status];
      });
    } else if (activeTab === 'activity') {
      headers = ['วัน-เวลา', 'การดำเนินการ', 'รายละเอียด', 'ผู้ใช้งาน', 'โมดูล', 'ประเภท'];
      rows = logs.map((log: ActivityLog) => [log.timestamp, log.action, log.description, log.userName, log.module, log.type]);
    }

    const csvContent = '\uFEFF' + [headers, ...rows]
      .map(e => e.map(item => `"${String(item).replace(/"/g, '""')}"`).join(','))
      .join('\n');
      
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('ดาวน์โหลดไฟล์ Excel/CSV เรียบร้อยแล้ว', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  if (currentUser.role === 'เจ้าหน้าที่') {
    return (
      <AppLayout title="รายงานสรุป 6 ด้าน">
        <AccessDenied requiredRoles={['ผู้ดูแลระบบ', 'ผู้อนุมัติ']} moduleName="รายงานสรุป 6 ด้าน" />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="ระบบรายงานและสถิติภาพรวม">
      {/* Formal Header for Print */}
      <div className="print-header" style={{ display: 'none', textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '10px', fontSize: '24px' }}>รายงานสรุปงบประมาณและพัสดุ</h2>
        <p style={{ fontSize: '16px' }}>เทศบาลนครรังสิต (Rangsit Municipality)</p>
        <p style={{ fontSize: '14px' }}>วันที่พิมพ์: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="page-header no-print">
        <div className="page-header-row">
          <div>
            <h1>ระบบรายงานสรุป 6 ด้าน</h1>
            <p>รายงานการเบิก, การยืม, การคืน, อุปกรณ์คงเหลือ, อุปกรณ์ใกล้หมด และประวัติการใช้งาน</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }} className="no-print">
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
        className="no-print"
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
                        width: `${(data.withdrawals / maxWithdrawals) * 100}%`,
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
                  background: pieGradient,
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
