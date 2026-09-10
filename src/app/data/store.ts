import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from './types';

// EnhancedRequest type สำหรับ frontend
export type RequestType = 'เบิกวัสดุ' | 'ยืมวัสดุ';
export type RequestStatus = 'รออนุมัติ' | 'อนุมัติแล้ว' | 'ไม่อนุมัติ' | 'กำลังยืม' | 'คืนแล้ว' | 'ยกเลิกแล้ว';

export interface EnhancedRequest {
  id: string;
  requestCode: string;
  requestType: RequestType;
  requesterId: string;
  requesterName: string;
  department: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  quantity: number;
  unit: string;
  reason: string;
  status: RequestStatus;
  requestDate: string;
  borrowDate?: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  returnedQuantity?: number;
  returnCondition?: 'สมบูรณ์' | 'ชำรุด' | 'สูญหาย';
  returnNotes?: string;
  approvedBy?: string | null;
  approvedDate?: string | null;
  rejectReason?: string | null;
  cancelledBy?: string | null;
  cancelledDate?: string | null;
}

export interface ReturnRecord {
  id: string;
  requestId: string;
  requestCode: string;
  materialName: string;
  borrowerName: string;
  department: string;
  borrowedQuantity: number;
  returnedQuantity: number;
  returnDate: string;
  condition: 'สมบูรณ์' | 'ชำรุด' | 'สูญหาย';
  receivedBy: string;
  notes: string;
}

// Default user สำหรับ initial state (ก่อน login)
const defaultUser: User = {
  id: '',
  fullName: 'ผู้ใช้งาน',
  username: 'guest',
  email: '',
  department: '',
  role: 'เจ้าหน้าที่',
  status: 'ใช้งาน',
  lastLogin: '-',
  avatar: '👤',
  phone: '',
  createdAt: '',
};

interface AppState {
  // Current session
  currentUser: User;
  setCurrentUser: (user: User) => void;
  clearCurrentUser: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentUser: defaultUser,

      setCurrentUser: (user) => set({ currentUser: user }),

      clearCurrentUser: () => set({ currentUser: defaultUser }),
    }),
    {
      name: 'rangsit-municipality-store-v3',
      version: 3,
    }
  )
);
