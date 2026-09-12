// Standard API Response & Request DTO Types

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  total?: number;
}

export type UserRole = 'ผู้ดูแลระบบ' | 'ผู้อนุมัติ' | 'เจ้าหน้าที่';
export type UserStatus = 'ใช้งาน' | 'ไม่ใช้งาน';
export type MaterialStatus = 'มีสต็อก' | 'ใกล้หมด' | 'หมดสต็อก';
export type RequestType = 'เบิกวัสดุ' | 'ยืมวัสดุ';
export type RequestStatus = 'รออนุมัติ' | 'อนุมัติแล้ว' | 'ไม่อนุมัติ' | 'กำลังยืม' | 'คืนแล้ว' | 'ยกเลิกแล้ว';
export type ItemCondition = 'สมบูรณ์' | 'ชำรุด' | 'สูญหาย';
export type ActivityLogType = 'สร้าง' | 'แก้ไข' | 'ลบ' | 'เข้าสู่ระบบ' | 'อนุมัติ' | 'เบิกจ่าย';

// Login DTO
export interface LoginRequestDto {
  username: string;
  password?: string;
}

export interface LoginResponseDto {
  token: string;
  user: {
    id: string;
    fullName: string;
    username: string;
    email: string;
    department: string;
    role: UserRole;
    status: UserStatus;
    avatar?: string;
    phone?: string;
  };
}

// Change Password DTO
export interface ChangePasswordDto {
  userId: string;
  oldPassword?: string;
  newPassword?: string;
}

// User DTOs
export interface CreateUserDto {
  fullName: string;
  username: string;
  password?: string;
  email: string;
  department: string;
  role: UserRole;
  status?: UserStatus;
  phone?: string;
}

export interface UpdateUserDto {
  fullName?: string;
  username?: string;
  password?: string;
  email?: string;
  department?: string;
  role?: UserRole;
  status?: UserStatus;
  phone?: string;
}

// Category DTOs
export interface CreateCategoryDto {
  name: string;
  description?: string;
  icon?: string;
  status?: UserStatus;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  icon?: string;
  status?: UserStatus;
}

// Material DTOs
export interface CreateMaterialDto {
  code: string;
  name: string;
  categoryId: string;
  categoryName?: string;
  unit?: string;
  quantity: number;
  minQuantity?: number;
  pricePerUnit?: number;
  location?: string;
  description?: string;
}

export interface UpdateMaterialDto {
  code?: string;
  name?: string;
  categoryId?: string;
  categoryName?: string;
  unit?: string;
  quantity?: number;
  minQuantity?: number;
  pricePerUnit?: number;
  location?: string;
  description?: string;
}

export interface RestockMaterialDto {
  addQuantity: number;
  reason: string;
  userId?: string;
  userName?: string;
}

// Request DTOs
export interface CreateRequestDto {
  requestType: RequestType;
  materialId: string;
  quantity: number;
  reason: string;
  requesterId: string;
  requesterName?: string;
  department?: string;
  borrowDate?: string;
  expectedReturnDate?: string;
}

export interface ApproveRequestDto {
  approverId?: string;
  approverName?: string;
}

export interface RejectRequestDto {
  reason: string;
  approverId?: string;
  approverName?: string;
}

export interface CancelRequestDto {
  userId?: string;
  userName?: string;
}

// Return DTOs
export interface ProcessReturnDto {
  requestId: string;
  returnedQuantity: number;
  returnDate?: string;
  condition: ItemCondition;
  notes?: string;
  receivedById?: string;
  receivedByName?: string;
}

// Activity Log DTO
export interface CreateActivityLogDto {
  userId?: string;
  userName: string;
  action: string;
  description: string;
  module: string;
  type: ActivityLogType;
  ipAddress?: string;
}
