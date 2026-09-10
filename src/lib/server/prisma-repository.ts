// Prisma-based Server Repository สำหรับระบบจัดการวัสดุเทศบาล
// แทนที่ in-memory repository ด้วย PostgreSQL queries

import prisma from '@/lib/prisma';
import type {
  CreateUserDto,
  UpdateUserDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateMaterialDto,
  UpdateMaterialDto,
  CreateRequestDto,
  ProcessReturnDto,
  CreateActivityLogDto,
  RequestType,
} from '../types/api';

// Helper: format date to Thai locale string
function formatThaiDate(date: Date): string {
  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatThaiDateTime(date: Date): string {
  return date.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// Helper: compute material status
function computeMaterialStatus(quantity: number, minQuantity: number): string {
  if (quantity === 0) return 'หมดสต็อก';
  if (quantity <= minQuantity) return 'ใกล้หมด';
  return 'มีสต็อก';
}

// Helper: map Prisma User to frontend User shape
function mapUser(u: {
  id: string;
  fullName: string;
  username: string;
  email: string;
  department: string;
  role: string;
  status: string;
  lastLogin: string;
  avatar: string | null;
  phone: string | null;
  createdAt: Date;
}) {
  return {
    id: u.id,
    fullName: u.fullName,
    username: u.username,
    email: u.email,
    department: u.department,
    role: u.role as 'ผู้ดูแลระบบ' | 'ผู้อนุมัติ' | 'เจ้าหน้าที่',
    status: u.status as 'ใช้งาน' | 'ไม่ใช้งาน',
    lastLogin: u.lastLogin,
    avatar: u.avatar || u.fullName.slice(0, 2),
    phone: u.phone || '',
    createdAt: u.createdAt.toISOString().split('T')[0],
  };
}

// Helper: map Prisma Category to frontend Category shape
function mapCategory(c: {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  status: string;
  createdAt: Date;
  _count?: { materials: number };
}) {
  return {
    id: c.id,
    name: c.name,
    description: c.description || '',
    icon: c.icon,
    itemCount: c._count?.materials ?? 0,
    status: c.status as 'ใช้งาน' | 'ไม่ใช้งาน',
    createdAt: c.createdAt.toISOString().split('T')[0],
  };
}

// Helper: map Prisma Material to frontend Material shape
function mapMaterial(m: {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  category?: { name: string } | null;
  unit: string;
  quantity: number;
  minQuantity: number;
  pricePerUnit: number;
  location: string | null;
  description: string | null;
  status: string;
  lastUpdated: Date;
}) {
  return {
    id: m.id,
    code: m.code,
    name: m.name,
    categoryId: m.categoryId,
    categoryName: m.category?.name || 'ทั่วไป',
    unit: m.unit,
    quantity: m.quantity,
    minQuantity: m.minQuantity,
    pricePerUnit: m.pricePerUnit,
    totalValue: m.quantity * m.pricePerUnit,
    location: m.location || '',
    status: m.status as 'มีสต็อก' | 'ใกล้หมด' | 'หมดสต็อก',
    lastUpdated: formatThaiDate(m.lastUpdated),
    description: m.description || '',
  };
}

// Helper: map Prisma Request to frontend EnhancedRequest shape
function mapRequest(r: {
  id: string;
  requestCode: string;
  requestType: string;
  requesterId: string;
  requester?: { fullName: string; department: string } | null;
  materialId: string;
  material?: { code: string; name: string; unit: string } | null;
  quantity: number;
  unit: string;
  reason: string;
  status: string;
  requestDate: Date;
  borrowDate: Date | null;
  expectedReturnDate: Date | null;
  actualReturnDate: Date | null;
  returnedQuantity: number | null;
  returnCondition: string | null;
  returnNotes: string | null;
  approvedById: string | null;
  approver?: { fullName: string } | null;
  approvedDate: Date | null;
  rejectReason: string | null;
  cancelledById: string | null;
  cancelledDate: Date | null;
}) {
  return {
    id: r.id,
    requestCode: r.requestCode,
    requestType: r.requestType as 'เบิกวัสดุ' | 'ยืมวัสดุ',
    requesterId: r.requesterId,
    requesterName: r.requester?.fullName || 'เจ้าหน้าที่',
    department: r.requester?.department || '',
    materialId: r.materialId,
    materialCode: r.material?.code || '',
    materialName: r.material?.name || 'วัสดุ',
    quantity: r.quantity,
    unit: r.unit || r.material?.unit || 'ชิ้น',
    reason: r.reason,
    status: r.status,
    requestDate: formatThaiDate(r.requestDate),
    borrowDate: r.borrowDate ? formatThaiDate(r.borrowDate) : undefined,
    expectedReturnDate: r.expectedReturnDate ? formatThaiDate(r.expectedReturnDate) : undefined,
    actualReturnDate: r.actualReturnDate ? formatThaiDate(r.actualReturnDate) : undefined,
    returnedQuantity: r.returnedQuantity ?? undefined,
    returnCondition: r.returnCondition ?? undefined,
    returnNotes: r.returnNotes ?? undefined,
    approvedBy: r.approver?.fullName || (r.approvedById ? 'ผู้อนุมัติ' : null),
    approvedDate: r.approvedDate ? formatThaiDate(r.approvedDate) : null,
    rejectReason: r.rejectReason || null,
    cancelledBy: r.cancelledById || null,
    cancelledDate: r.cancelledDate ? formatThaiDate(r.cancelledDate) : null,
  };
}

// Helper: map Prisma ReturnRecord to frontend ReturnRecord shape
function mapReturnRecord(r: {
  id: string;
  requestId: string;
  request?: {
    requestCode: string;
    material?: { name: string } | null;
    requester?: { fullName: string; department: string } | null;
  } | null;
  borrowedQuantity: number;
  returnedQuantity: number;
  returnDate: Date;
  condition: string;
  receivedById: string;
  receiver?: { fullName: string } | null;
  notes: string | null;
}) {
  return {
    id: r.id,
    requestId: r.requestId,
    requestCode: r.request?.requestCode || '',
    materialName: r.request?.material?.name || '',
    borrowerName: r.request?.requester?.fullName || '',
    department: r.request?.requester?.department || '',
    borrowedQuantity: r.borrowedQuantity,
    returnedQuantity: r.returnedQuantity,
    returnDate: formatThaiDate(r.returnDate),
    condition: r.condition as 'สมบูรณ์' | 'ชำรุด' | 'สูญหาย',
    receivedBy: r.receiver?.fullName || '',
    notes: r.notes || '',
  };
}

// Helper: map Prisma ActivityLog to frontend ActivityLog shape
function mapActivityLog(l: {
  id: string;
  userName: string;
  action: string;
  description: string;
  module: string;
  type: string;
  ipAddress: string | null;
  timestamp: Date;
}) {
  return {
    id: l.id,
    userName: l.userName,
    action: l.action,
    description: l.description,
    module: l.module,
    type: l.type as 'สร้าง' | 'แก้ไข' | 'ลบ' | 'เข้าสู่ระบบ' | 'อนุมัติ' | 'เบิกจ่าย',
    ipAddress: l.ipAddress || '127.0.0.1',
    timestamp: formatThaiDateTime(l.timestamp),
  };
}

// Include clause for Request queries
const requestInclude = {
  requester: { select: { fullName: true, department: true } },
  material: { select: { code: true, name: true, unit: true } },
  approver: { select: { fullName: true } },
} as const;

const returnRecordInclude = {
  request: {
    select: {
      requestCode: true,
      material: { select: { name: true } },
      requester: { select: { fullName: true, department: true } },
    },
  },
  receiver: { select: { fullName: true } },
} as const;

export const prismaRepository = {
  // ==========================================
  // USERS
  // ==========================================
  async getUsers(query?: { search?: string; role?: string; department?: string }) {
    const where: Record<string, unknown> = {};

    if (query?.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { username: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query?.role) where.role = query.role;
    if (query?.department) where.department = query.department;

    const users = await prisma.user.findMany({ where, orderBy: { createdAt: 'desc' } });
    return users.map(mapUser);
  },

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? mapUser(user) : null;
  },

  async getUserByUsername(username: string) {
    const query = username.trim().toLowerCase();

    // 1. Exact email match
    let user = await prisma.user.findFirst({
      where: { email: { equals: query, mode: 'insensitive' } },
    });
    if (user) return mapUser(user);

    // 2. Exact username match
    user = await prisma.user.findFirst({
      where: { username: { equals: query, mode: 'insensitive' } },
    });
    if (user) return mapUser(user);

    // 3. Active role match for common names
    if (query === 'admin' || query.startsWith('admin@')) {
      user = await prisma.user.findFirst({
        where: { role: 'ผู้ดูแลระบบ', status: 'ใช้งาน' },
      });
      return user ? mapUser(user) : null;
    }
    if (query === 'approver' || query.startsWith('approver@')) {
      user = await prisma.user.findFirst({
        where: { role: 'ผู้อนุมัติ', status: 'ใช้งาน' },
      });
      return user ? mapUser(user) : null;
    }
    if (query === 'staff' || query.startsWith('staff@')) {
      user = await prisma.user.findFirst({
        where: { role: 'เจ้าหน้าที่', status: 'ใช้งาน' },
      });
      return user ? mapUser(user) : null;
    }

    return null;
  },

  async getUserByUsernameOrEmail(identifier: string) {
    return this.getUserByUsername(identifier);
  },

  async createUser(dto: CreateUserDto) {
    const user = await prisma.user.create({
      data: {
        fullName: dto.fullName,
        username: dto.username,
        password: dto.password || null,
        email: dto.email,
        department: dto.department,
        role: dto.role,
        status: dto.status || 'ใช้งาน',
        phone: dto.phone || null,
        avatar: dto.fullName.slice(0, 2),
        lastLogin: '-',
      },
    });

    await this.createActivityLog({
      userName: 'ระบบ',
      action: 'เพิ่มผู้ใช้',
      description: `เพิ่มผู้ใช้ใหม่: ${user.fullName} (${user.role}) แผนก ${user.department}`,
      module: 'ผู้ใช้งาน',
      type: 'สร้าง',
    });

    return mapUser(user);
  },

  async updateUser(id: string, dto: UpdateUserDto) {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: dto,
      });

      await this.createActivityLog({
        userName: 'ระบบ',
        action: 'แก้ไขข้อมูลผู้ใช้',
        description: `แก้ไขข้อมูลผู้ใช้: ${user.fullName}`,
        module: 'ผู้ใช้งาน',
        type: 'แก้ไข',
      });

      return mapUser(user);
    } catch {
      return null;
    }
  },

  async deleteUser(id: string) {
    try {
      const user = await prisma.user.delete({ where: { id } });

      await this.createActivityLog({
        userName: 'ระบบ',
        action: 'ลบผู้ใช้',
        description: `ลบผู้ใช้: ${user.fullName}`,
        module: 'ผู้ใช้งาน',
        type: 'ลบ',
      });

      return true;
    } catch {
      return false;
    }
  },

  // ==========================================
  // CATEGORIES
  // ==========================================
  async getCategories() {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { materials: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return categories.map(mapCategory);
  },

  async getCategoryById(id: string) {
    const cat = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { materials: true } } },
    });
    return cat ? mapCategory(cat) : null;
  },

  async createCategory(dto: CreateCategoryDto) {
    const cat = await prisma.category.create({
      data: {
        name: dto.name,
        description: dto.description || null,
        icon: dto.icon || '📦',
        status: dto.status || 'ใช้งาน',
      },
    });

    await this.createActivityLog({
      userName: 'ระบบ',
      action: 'เพิ่มหมวดหมู่',
      description: `เพิ่มหมวดหมู่ใหม่: ${cat.name}`,
      module: 'หมวดหมู่',
      type: 'สร้าง',
    });

    return mapCategory({ ...cat, _count: { materials: 0 } });
  },

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    try {
      const cat = await prisma.category.update({
        where: { id },
        data: dto,
        include: { _count: { select: { materials: true } } },
      });

      await this.createActivityLog({
        userName: 'ระบบ',
        action: 'แก้ไขหมวดหมู่',
        description: `แก้ไขข้อมูลหมวดหมู่: ${cat.name}`,
        module: 'หมวดหมู่',
        type: 'แก้ไข',
      });

      return mapCategory(cat);
    } catch {
      return null;
    }
  },

  async deleteCategory(id: string) {
    try {
      const cat = await prisma.category.delete({ where: { id } });

      await this.createActivityLog({
        userName: 'ระบบ',
        action: 'ลบหมวดหมู่',
        description: `ลบหมวดหมู่: ${cat.name}`,
        module: 'หมวดหมู่',
        type: 'ลบ',
      });

      return true;
    } catch {
      return false;
    }
  },

  // ==========================================
  // MATERIALS
  // ==========================================
  async getMaterials(query?: { search?: string; categoryId?: string; status?: string }) {
    const where: Record<string, unknown> = {};

    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
        { category: { name: { contains: query.search, mode: 'insensitive' } } },
        { location: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query?.categoryId) where.categoryId = query.categoryId;
    if (query?.status) where.status = query.status;

    const materials = await prisma.material.findMany({
      where,
      include: { category: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return materials.map(mapMaterial);
  },

  async getMaterialById(id: string) {
    const mat = await prisma.material.findUnique({
      where: { id },
      include: { category: { select: { name: true } } },
    });
    return mat ? mapMaterial(mat) : null;
  },

  async createMaterial(dto: CreateMaterialDto) {
    const qty = Number(dto.quantity) || 0;
    const minQty = Number(dto.minQuantity) || 10;
    const price = Number(dto.pricePerUnit) || 0;
    const status = computeMaterialStatus(qty, minQty);

    const mat = await prisma.material.create({
      data: {
        code: dto.code,
        name: dto.name,
        categoryId: dto.categoryId,
        unit: dto.unit,
        quantity: qty,
        minQuantity: minQty,
        pricePerUnit: price,
        location: dto.location || 'โกดังกลาง',
        description: dto.description || null,
        status,
        lastUpdated: new Date(),
      },
      include: { category: { select: { name: true } } },
    });

    await this.createActivityLog({
      userName: 'ระบบ',
      action: 'เพิ่มวัสดุ',
      description: `เพิ่มวัสดุใหม่: ${mat.name} (${mat.code}) จำนวน ${qty} ${mat.unit}`,
      module: 'วัสดุ',
      type: 'สร้าง',
    });

    return mapMaterial(mat);
  },

  async updateMaterial(id: string, dto: UpdateMaterialDto) {
    try {
      const existing = await prisma.material.findUnique({ where: { id } });
      if (!existing) return null;

      const qty = dto.quantity !== undefined ? Number(dto.quantity) : existing.quantity;
      const minQty = dto.minQuantity !== undefined ? Number(dto.minQuantity) : existing.minQuantity;
      const price = dto.pricePerUnit !== undefined ? Number(dto.pricePerUnit) : existing.pricePerUnit;
      const status = computeMaterialStatus(qty, minQty);

      const mat = await prisma.material.update({
        where: { id },
        data: {
          ...dto,
          quantity: qty,
          minQuantity: minQty,
          pricePerUnit: price,
          status,
          lastUpdated: new Date(),
        },
        include: { category: { select: { name: true } } },
      });

      await this.createActivityLog({
        userName: 'ระบบ',
        action: 'แก้ไขวัสดุ',
        description: `แก้ไขข้อมูลวัสดุ: ${mat.name}`,
        module: 'วัสดุ',
        type: 'แก้ไข',
      });

      return mapMaterial(mat);
    } catch {
      return null;
    }
  },

  async deleteMaterial(id: string) {
    try {
      const mat = await prisma.material.delete({ where: { id } });

      await this.createActivityLog({
        userName: 'ระบบ',
        action: 'ลบวัสดุ',
        description: `ลบวัสดุ: ${mat.name} (${mat.code})`,
        module: 'วัสดุ',
        type: 'ลบ',
      });

      return true;
    } catch {
      return false;
    }
  },

  async restockMaterial(id: string, addQty: number, reason: string, userName?: string) {
    const mat = await prisma.material.findUnique({ where: { id } });
    if (!mat) return null;

    const newQty = mat.quantity + addQty;
    const status = computeMaterialStatus(newQty, mat.minQuantity);

    const updated = await prisma.material.update({
      where: { id },
      data: {
        quantity: newQty,
        status,
        lastUpdated: new Date(),
      },
      include: { category: { select: { name: true } } },
    });

    await this.createActivityLog({
      userName: userName || 'ผู้ดูแลระบบ',
      action: 'เติมสต็อก',
      description: `เติมสต็อก ${mat.name} จำนวน +${addQty} ${mat.unit} (เหตุผล: ${reason})`,
      module: 'คลังสินค้า',
      type: 'แก้ไข',
    });

    return mapMaterial(updated);
  },

  // ==========================================
  // REQUESTS (Requisition & Borrow)
  // ==========================================
  async getRequests(query?: { requesterId?: string; status?: string; type?: RequestType }) {
    const where: Record<string, unknown> = {};

    if (query?.requesterId) where.requesterId = query.requesterId;
    if (query?.status) where.status = query.status;
    if (query?.type) where.requestType = query.type;

    const requests = await prisma.request.findMany({
      where,
      include: requestInclude,
      orderBy: { createdAt: 'desc' },
    });
    return requests.map(mapRequest);
  },

  async getRequestById(id: string) {
    const req = await prisma.request.findUnique({
      where: { id },
      include: requestInclude,
    });
    return req ? mapRequest(req) : null;
  },

  async createRequest(dto: CreateRequestDto) {
    const mat = await prisma.material.findUnique({
      where: { id: dto.materialId },
      include: { category: { select: { name: true } } },
    });

    if (mat && mat.quantity < dto.quantity) {
      throw new Error(`สต็อกคงเหลือไม่เพียงพอ (มีคงเหลือ ${mat.quantity} ${mat.unit})`);
    }

    // Generate request code
    const count = await prisma.request.count();
    const padNum = String(count + 1).padStart(4, '0');

    const user = await prisma.user.findUnique({ where: { id: dto.requesterId } });

    const req = await prisma.request.create({
      data: {
        requestCode: `REQ-2569-${padNum}`,
        requestType: dto.requestType,
        requesterId: dto.requesterId,
        materialId: dto.materialId,
        quantity: dto.quantity,
        unit: mat?.unit || 'ชิ้น',
        reason: dto.reason,
        status: 'รออนุมัติ',
        borrowDate: dto.borrowDate ? new Date(dto.borrowDate) : null,
        expectedReturnDate: dto.expectedReturnDate ? new Date(dto.expectedReturnDate) : null,
      },
      include: requestInclude,
    });

    await this.createActivityLog({
      userName: user?.fullName || dto.requesterName || 'เจ้าหน้าที่',
      action: dto.requestType === 'ยืมวัสดุ' ? 'ส่งคำขอยืม' : 'ส่งคำขอเบิก',
      description: `${user?.fullName || 'เจ้าหน้าที่'} ส่งคำขอ ${dto.requestType}: ${mat?.name || 'วัสดุ'} จำนวน ${dto.quantity} ${mat?.unit || 'ชิ้น'}`,
      module: 'การอนุมัติ',
      type: 'สร้าง',
    });

    return mapRequest(req);
  },

  async approveRequest(id: string, approverName?: string, approverId?: string) {
    const req = await prisma.request.findUnique({
      where: { id },
      include: { material: true, requester: true },
    });
    if (!req) return null;

    // Deduct stock
    if (req.material) {
      const newQty = Math.max(0, req.material.quantity - req.quantity);
      const status = computeMaterialStatus(newQty, req.material.minQuantity);
      await prisma.material.update({
        where: { id: req.materialId },
        data: { quantity: newQty, status, lastUpdated: new Date() },
      });
    }

    const newStatus = req.requestType === 'ยืมวัสดุ' ? 'กำลังยืม' : 'อนุมัติแล้ว';

    const updated = await prisma.request.update({
      where: { id },
      data: {
        status: newStatus,
        approvedById: approverId || null,
        approvedDate: new Date(),
      },
      include: requestInclude,
    });

    await this.createActivityLog({
      userName: approverName || 'ผู้อนุมัติ',
      action: 'อนุมัติคำขอ',
      description: `อนุมัติคำขอ ${req.requestCode} (${req.requestType}) ของ ${req.requester?.fullName || 'เจ้าหน้าที่'} รายการ: ${req.material?.name || 'วัสดุ'}`,
      module: 'การอนุมัติ',
      type: 'อนุมัติ',
    });

    return mapRequest(updated);
  },

  async rejectRequest(id: string, reason: string, approverName?: string, approverId?: string) {
    const req = await prisma.request.findUnique({
      where: { id },
      include: { requester: true },
    });
    if (!req) return null;

    const updated = await prisma.request.update({
      where: { id },
      data: {
        status: 'ไม่อนุมัติ',
        rejectReason: reason,
        approvedById: approverId || null,
        approvedDate: new Date(),
      },
      include: requestInclude,
    });

    await this.createActivityLog({
      userName: approverName || 'ผู้อนุมัติ',
      action: 'ไม่อนุมัติคำขอ',
      description: `ไม่อนุมัติคำขอ ${req.requestCode} เหตุผล: ${reason}`,
      module: 'การอนุมัติ',
      type: 'อนุมัติ',
    });

    return mapRequest(updated);
  },

  async cancelRequest(id: string, cancellerName?: string, cancellerId?: string) {
    const req = await prisma.request.findUnique({ where: { id } });
    if (!req) return null;

    const updated = await prisma.request.update({
      where: { id },
      data: {
        status: 'ยกเลิกแล้ว',
        cancelledById: cancellerId || null,
        cancelledDate: new Date(),
      },
      include: requestInclude,
    });

    await this.createActivityLog({
      userName: cancellerName || 'เจ้าหน้าที่',
      action: 'ยกเลิกคำขอ',
      description: `ยกเลิกคำขอ ${req.requestCode} โดย ${cancellerName || 'เจ้าหน้าที่'}`,
      module: 'การอนุมัติ',
      type: 'แก้ไข',
    });

    return mapRequest(updated);
  },

  // ==========================================
  // RETURNS
  // ==========================================
  async getReturnRecords() {
    const records = await prisma.returnRecord.findMany({
      include: returnRecordInclude,
      orderBy: { createdAt: 'desc' },
    });
    return records.map(mapReturnRecord);
  },

  async processReturn(dto: ProcessReturnDto) {
    const req = await prisma.request.findUnique({
      where: { id: dto.requestId },
      include: { material: true, requester: true },
    });
    if (!req) return null;

    // Restore stock
    if (req.material) {
      const newQty = req.material.quantity + dto.returnedQuantity;
      const status = computeMaterialStatus(newQty, req.material.minQuantity);
      await prisma.material.update({
        where: { id: req.materialId },
        data: { quantity: newQty, status, lastUpdated: new Date() },
      });
    }

    // Create return record
    const returnRecord = await prisma.returnRecord.create({
      data: {
        requestId: req.id,
        borrowedQuantity: req.quantity,
        returnedQuantity: dto.returnedQuantity,
        returnDate: dto.returnDate ? new Date(dto.returnDate) : new Date(),
        condition: dto.condition,
        receivedById: dto.receivedById || req.requesterId,
        notes: dto.notes || null,
      },
      include: returnRecordInclude,
    });

    // Update request status
    await prisma.request.update({
      where: { id: dto.requestId },
      data: {
        status: 'คืนแล้ว',
        actualReturnDate: dto.returnDate ? new Date(dto.returnDate) : new Date(),
        returnedQuantity: dto.returnedQuantity,
        returnCondition: dto.condition,
        returnNotes: dto.notes || null,
      },
    });

    await this.createActivityLog({
      userName: dto.receivedByName || 'ผู้ดูแลระบบ',
      action: 'บันทึกการคืน',
      description: `บันทึกการคืนวัสดุ ${req.material?.name || 'วัสดุ'} จำนวน ${dto.returnedQuantity} ${req.unit} จาก ${req.requester?.fullName || 'ผู้ยืม'} (สภาพ: ${dto.condition})`,
      module: 'คลังสินค้า',
      type: 'เบิกจ่าย',
    });

    return mapReturnRecord(returnRecord);
  },

  // ==========================================
  // ACTIVITY LOGS
  // ==========================================
  async getActivityLogs(query?: { type?: string; module?: string; limit?: number }) {
    const where: Record<string, unknown> = {};

    if (query?.type) where.type = query.type;
    if (query?.module) where.module = query.module;

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: query?.limit || undefined,
    });
    return logs.map(mapActivityLog);
  },

  async createActivityLog(dto: CreateActivityLogDto) {
    const log = await prisma.activityLog.create({
      data: {
        userName: dto.userName,
        action: dto.action,
        description: dto.description,
        module: dto.module,
        type: dto.type,
        ipAddress: dto.ipAddress || '192.168.1.100',
      },
    });
    return mapActivityLog(log);
  },

  // ==========================================
  // DASHBOARD & STATS
  // ==========================================
  async getDashboardStats() {
    const [
      totalUsers,
      activeUsers,
      totalMaterials,
      totalCategories,
      pendingApprovals,
      lowStockItems,
      outOfStockItems,
      activeBorrows,
      totalValueResult,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ใช้งาน' } }),
      prisma.material.count(),
      prisma.category.count(),
      prisma.request.count({ where: { status: 'รออนุมัติ' } }),
      prisma.material.count({ where: { status: 'ใกล้หมด' } }),
      prisma.material.count({ where: { status: 'หมดสต็อก' } }),
      prisma.request.count({ where: { status: 'กำลังยืม' } }),
      prisma.material.aggregate({ _sum: { pricePerUnit: true, quantity: true } }),
    ]);

    // Get recent requests & logs
    const recentRequests = await prisma.request.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: requestInclude,
    });

    const recentLogs = await prisma.activityLog.findMany({
      take: 6,
      orderBy: { timestamp: 'desc' },
    });

    // Compute total value from materials
    const materials = await prisma.material.findMany({
      select: { quantity: true, pricePerUnit: true },
    });
    const totalValue = materials.reduce((acc: number, m: any) => acc + (m.quantity * (m.pricePerUnit || 0)), 0);

    return {
      totalUsers,
      activeUsers,
      totalMaterials,
      totalCategories,
      totalValue,
      pendingApprovals,
      lowStockItems,
      outOfStockItems,
      activeBorrows,
      recentRequests: recentRequests.map(mapRequest),
      recentLogs: recentLogs.map(mapActivityLog),
    };
  },

  // ==========================================
  // PASSWORD (for login)
  // ==========================================
  async getUserWithPassword(identifier: string) {
    const query = identifier.trim().toLowerCase();

    let user = await prisma.user.findFirst({
      where: { email: { equals: query, mode: 'insensitive' } },
    });
    if (!user) {
      user = await prisma.user.findFirst({
        where: { username: { equals: query, mode: 'insensitive' } },
      });
    }
    // Role-based shortcut
    if (!user && (query === 'admin' || query.startsWith('admin@'))) {
      user = await prisma.user.findFirst({ where: { role: 'ผู้ดูแลระบบ', status: 'ใช้งาน' } });
    }
    if (!user && (query === 'approver' || query.startsWith('approver@'))) {
      user = await prisma.user.findFirst({ where: { role: 'ผู้อนุมัติ', status: 'ใช้งาน' } });
    }
    if (!user && (query === 'staff' || query.startsWith('staff@'))) {
      user = await prisma.user.findFirst({ where: { role: 'เจ้าหน้าที่', status: 'ใช้งาน' } });
    }

    return user; // raw Prisma user (with password field)
  },

  async updateLastLogin(id: string) {
    await prisma.user.update({
      where: { id },
      data: { lastLogin: formatThaiDateTime(new Date()) },
    });
  },
};
