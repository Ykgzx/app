// Type Definitions สำหรับระบบจัดการวัสดุเทศบาล
// (ย้ายจาก mockData.ts)

export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  department: string;
  role: 'ผู้ดูแลระบบ' | 'ผู้อนุมัติ' | 'เจ้าหน้าที่';
  status: 'ใช้งาน' | 'ไม่ใช้งาน';
  lastLogin: string;
  avatar: string;
  phone: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  itemCount: number;
  status: 'ใช้งาน' | 'ไม่ใช้งาน';
  createdAt: string;
}

export interface Material {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  categoryName: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  pricePerUnit: number;
  totalValue: number;
  location: string;
  status: 'มีสต็อก' | 'ใกล้หมด' | 'หมดสต็อก';
  lastUpdated: string;
  description: string;
}

export interface ApprovalRequest {
  id: string;
  requestCode: string;
  requesterName: string;
  department: string;
  materialName: string;
  quantity: number;
  unit: string;
  reason: string;
  status: 'รออนุมัติ' | 'อนุมัติแล้ว' | 'ไม่อนุมัติ';
  requestDate: string;
  approvedBy: string | null;
  approvedDate: string | null;
}

export interface ActivityLog {
  id: string;
  action: string;
  description: string;
  userName: string;
  module: string;
  timestamp: string;
  ipAddress: string;
  type: 'สร้าง' | 'แก้ไข' | 'ลบ' | 'เข้าสู่ระบบ' | 'อนุมัติ' | 'เบิกจ่าย';
}

export const presetMaterialIcons: Record<string, string> = {
  'วัสดุสำนักงาน': '📋',
  'วัสดุไฟฟ้า': '⚡',
  'วัสดุก่อสร้าง': '🏗️',
  'วัสดุประปา': '🔧',
  'วัสดุคอมพิวเตอร์': '💻',
  'วัสดุทำความสะอาด': '🧹',
  'วัสดุการเกษตร': '🌱',
  'วัสดุยานพาหนะ': '🚗',
};

export const departments = [
  'กองช่าง (Public Works)',
  'สำนักปลัด (Office of the Palad)',
  'กองคลัง (Finance)',
  'กองสาธารณสุข (Public Health)',
  'กองการศึกษา (Education)',
  'กองสวัสดิการสังคม (Social Welfare)',
];
