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

// Helper: map Prisma User (new DB schema) to frontend User shape
function mapUser(u: any) {
  return {
    id: String(u.id),
    fullName: `${u.first_name} ${u.last_name}`.trim(),
    username: u.username,
    email: u.email,
    department: u.department?.department_name || '',
    role: (u.role?.role_name || 'เจ้าหน้าที่') as 'ผู้ดูแลระบบ' | 'ผู้อนุมัติ' | 'เจ้าหน้าที่',
    status: (u.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน') as 'ใช้งาน' | 'ไม่ใช้งาน',
    lastLogin: '-',
    avatar: `${(u.first_name || '').slice(0, 1)}${(u.last_name || '').slice(0, 1)}` || '👤',
    phone: u.phone || '',
    createdAt: u.created_at ? u.created_at.toISOString().split('T')[0] : '',
  };
}

// User include clause — always include role & department names
const userInclude = {
  role: { select: { role_name: true } },
  department: { select: { department_name: true } },
} as const;

// Helper: map Prisma Category to frontend Category shape
function mapCategory(c: any) {
  return {
    id: String(c.id),
    name: c.category_name,
    description: c.description || '',
    icon: '📦', // No icon in DB
    itemCount: c._count?.materials ?? 0,
    status: 'ใช้งาน' as const, // No status in DB
    createdAt: c.created_at.toISOString().split('T')[0],
  };
}

// Helper: map Prisma Material to frontend Material shape
function mapMaterial(m: any) {
  return {
    id: String(m.id),
    code: m.material_code,
    name: m.material_name,
    categoryId: String(m.category_id),
    categoryName: m.category?.category_name || 'ทั่วไป',
    unit: m.unit || 'ชิ้น',
    quantity: m.stock_quantity,
    minQuantity: m.minimum_stock,
    pricePerUnit: Number(m.price_per_unit) || 0,
    totalValue: m.stock_quantity * (Number(m.price_per_unit) || 0),
    location: m.location || '',
    status: (m.is_active ? computeMaterialStatus(m.stock_quantity, m.minimum_stock) : 'ไม่ใช้งาน') as 'มีสต็อก' | 'ใกล้หมด' | 'หมดสต็อก',
    lastUpdated: formatThaiDate(m.updated_at),
    description: m.description || '',
  };
}

// Helper: map Prisma Request to frontend EnhancedRequest shape
function mapRequest(r: any) {
  const requesterName = r.user
    ? `${r.user.first_name} ${r.user.last_name}`.trim()
    : 'เจ้าหน้าที่';
  const requesterDept = r.user?.department?.department_name || '';
  
  // Since request items can be many, we map the first one for the frontend
  const firstItem = r.request_items?.[0];
  
  // Try to find the approval record for this request
  // Approvals are in a separate table, but we don't have direct relation in Request model yet.
  // We'll pass it if it was joined, otherwise fallback.
  const approval = r.approvals?.[0];
  const approverName = approval?.approver
    ? `${approval.approver.first_name} ${approval.approver.last_name}`.trim()
    : null;

  return {
    id: String(r.id),
    requestCode: r.request_code,
    requestType: r.request_type === 'BORROW' ? 'ยืมวัสดุ' : 'เบิกวัสดุ',
    requesterId: String(r.user_id),
    requesterName,
    department: requesterDept,
    materialId: firstItem?.material_id ? String(firstItem.material_id) : '',
    materialCode: firstItem?.material?.material_code || '',
    materialName: firstItem?.material?.material_name || 'วัสดุ',
    quantity: firstItem?.quantity || 0,
    unit: firstItem?.material?.unit || 'ชิ้น',
    reason: r.reason,
    status: r.status === 'PENDING' ? 'รออนุมัติ' : 
            r.status === 'APPROVED' ? 'อนุมัติแล้ว' : 
            r.status === 'REJECTED' ? 'ไม่อนุมัติ' : 
            r.status === 'BORROWING' ? 'กำลังยืม' : 
            r.status === 'RETURNED' ? 'คืนแล้ว' : 'ยกเลิกแล้ว',
    requestDate: formatThaiDate(r.created_at),
    borrowDate: r.borrow_date ? formatThaiDate(r.borrow_date) : undefined,
    expectedReturnDate: r.due_date ? formatThaiDate(r.due_date) : undefined,
    actualReturnDate: undefined, // Will be mapped in returns if needed
    returnedQuantity: undefined,
    returnCondition: undefined,
    returnNotes: undefined,
    approvedBy: approverName || null,
    approvedDate: approval?.approved_at ? formatThaiDate(approval.approved_at) : null,
    rejectReason: approval?.reason || null,
    cancelledBy: null, // Not in DB schema explicitly
    cancelledDate: null,
  };
}

// Helper: map Prisma Return to frontend ReturnRecord shape
function mapReturnRecord(r: any) {
  const borrowerName = r.request?.user
    ? `${r.request.user.first_name} ${r.request.user.last_name}`.trim()
    : '';
  const receiverName = r.user
    ? `${r.user.first_name} ${r.user.last_name}`.trim()
    : '';
    
  const firstItem = r.return_items?.[0];

  return {
    id: String(r.id),
    requestId: String(r.request_id),
    requestCode: r.request?.request_code || '',
    materialName: firstItem?.material?.material_name || '',
    borrowerName,
    department: r.request?.user?.department?.department_name || '',
    borrowedQuantity: r.request?.request_items?.[0]?.quantity || 0,
    returnedQuantity: firstItem?.quantity || 0,
    returnDate: r.return_date ? formatThaiDate(r.return_date) : formatThaiDate(r.created_at),
    condition: (firstItem?.condition || 'สมบูรณ์') as 'สมบูรณ์' | 'ชำรุด' | 'สูญหาย',
    receivedBy: receiverName,
    notes: r.note || '',
  };
}

// Helper: map Prisma AuditLog to frontend ActivityLog shape
function mapActivityLog(l: any) {
  return {
    id: String(l.id),
    userName: l.user ? `${l.user.first_name} ${l.user.last_name}`.trim() : 'System',
    action: l.action,
    description: l.description || '',
    module: l.table_name || 'System',
    type: 'แก้ไข' as any, // Not strictly in DB
    ipAddress: l.ip_address || '127.0.0.1',
    timestamp: formatThaiDateTime(l.created_at),
  };
}

// Include clause for Request queries
const requestInclude = {
  user: {
    select: { first_name: true, last_name: true, department: { select: { department_name: true } } },
  },
  request_items: { 
    include: { material: { select: { material_code: true, material_name: true, unit: true } } } 
  },
} as const;

const returnInclude = {
  request: {
    select: {
      request_code: true,
      request_items: true,
      user: {
        select: { first_name: true, last_name: true, department: { select: { department_name: true } } },
      },
    },
  },
  user: { select: { first_name: true, last_name: true } },
  return_items: { include: { material: { select: { material_name: true } } } },
} as const;


export const prismaRepository = {
  // ==========================================
  // USERS
  // ==========================================
  async getUsers(query?: { search?: string; role?: string; department?: string }) {
    const where: Record<string, unknown> = {};

    if (query?.search) {
      where.OR = [
        { first_name: { contains: query.search, mode: 'insensitive' } },
        { last_name: { contains: query.search, mode: 'insensitive' } },
        { username: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query?.role) where.role = { role_name: query.role };
    if (query?.department) where.department = { department_name: query.department };

    const users = await prisma.user.findMany({ 
        where, 
        orderBy: { created_at: 'desc' },
        include: userInclude
    });
    return users.map(mapUser);
  },

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({ 
        where: { id: Number(id) },
        include: userInclude
    });
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
        where: { role: { role_name: 'ผู้ดูแลระบบ' }, is_active: true },
        include: userInclude
      });
      return user ? mapUser(user) : null;
    }
    if (query === 'approver' || query.startsWith('approver@')) {
      user = await prisma.user.findFirst({
        where: { role: { role_name: 'ผู้อนุมัติ' }, is_active: true },
        include: userInclude
      });
      return user ? mapUser(user) : null;
    }
    if (query === 'staff' || query.startsWith('staff@')) {
      user = await prisma.user.findFirst({
        where: { role: { role_name: 'เจ้าหน้าที่' }, is_active: true },
        include: userInclude
      });
      return user ? mapUser(user) : null;
    }

    return null;
  },

  async getUserByUsernameOrEmail(identifier: string) {
    return this.getUserByUsername(identifier);
  },

  async createUser(dto: CreateUserDto) {
    const [firstName, ...rest] = dto.fullName.split(' ');
    const lastName = rest.join(' ');
    
    // Find or create role and department
    let role = await prisma.role.findFirst({ where: { role_name: dto.role } });
    if (!role) {
        role = await prisma.role.create({ data: { role_name: dto.role } });
    }
    let department = await prisma.department.findFirst({ where: { department_name: dto.department } });
    if (!department) {
        department = await prisma.department.create({ data: { department_name: dto.department } });
    }

    const { hashPassword, getDefaultPasswordHash } = await import('@/lib/auth');
    const password_hash = dto.password ? await hashPassword(dto.password) : await getDefaultPasswordHash();

    const user = await prisma.user.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        username: dto.username,
        password_hash,
        email: dto.email,
        department_id: department.id,
        role_id: role.id,
        is_active: dto.status === 'ใช้งาน',
        phone: dto.phone || null,
      },
      include: userInclude
    });

    const fullName = `${user.first_name} ${user.last_name}`.trim();

    await this.createActivityLog({
      userName: 'ระบบ',
      action: 'เพิ่มผู้ใช้',
      description: `เพิ่มผู้ใช้ใหม่: ${fullName} (${user.role.role_name}) แผนก ${user.department.department_name}`,
      module: 'ผู้ใช้งาน',
      type: 'สร้าง',
    });

    return mapUser(user);
  },

  async updateUser(id: string, dto: UpdateUserDto) {
    try {
      const updateData: any = { ...dto };
      if (dto.fullName) {
          const [firstName, ...rest] = dto.fullName.split(' ');
          updateData.first_name = firstName;
          updateData.last_name = rest.join(' ');
          delete updateData.fullName;
      }
      if (dto.password) {
          const { hashPassword } = await import('@/lib/auth');
          updateData.password_hash = await hashPassword(dto.password);
          delete updateData.password;
      }
      if (dto.status) {
          updateData.is_active = dto.status === 'ใช้งาน';
          delete updateData.status;
      }
      if (dto.role) {
          let role = await prisma.role.findFirst({ where: { role_name: dto.role } });
          if (!role) { role = await prisma.role.create({ data: { role_name: dto.role } }); }
          updateData.role_id = role.id;
          delete updateData.role;
      }
      if (dto.department) {
          let dept = await prisma.department.findFirst({ where: { department_name: dto.department } });
          if (!dept) { dept = await prisma.department.create({ data: { department_name: dto.department } }); }
          updateData.department_id = dept.id;
          delete updateData.department;
      }

      const user = await prisma.user.update({
        where: { id: Number(id) },
        data: updateData,
        include: userInclude
      });

      const fullName = `${user.first_name} ${user.last_name}`.trim();

      await this.createActivityLog({
        userName: 'ระบบ',
        action: 'แก้ไขข้อมูลผู้ใช้',
        description: `แก้ไขข้อมูลผู้ใช้: ${fullName}`,
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
      const user = await prisma.user.delete({ where: { id: Number(id) } });

      await this.createActivityLog({
        userName: 'ระบบ',
        action: 'ลบผู้ใช้',
        description: `ลบผู้ใช้: ${user.first_name} ${user.last_name}`.trim(),
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
      orderBy: { created_at: 'asc' },
    });
    return categories.map(mapCategory);
  },

  async getCategoryById(id: string) {
    const cat = await prisma.category.findUnique({
      where: { id: Number(id) },
      include: { _count: { select: { materials: true } } },
    });
    return cat ? mapCategory(cat) : null;
  },

  async createCategory(dto: CreateCategoryDto) {
    const cat = await prisma.category.create({
      data: {
        category_name: dto.name,
        description: dto.description || null,
      },
    });

    await this.createActivityLog({
      userName: 'ระบบ',
      action: 'เพิ่มหมวดหมู่',
      description: `เพิ่มหมวดหมู่ใหม่: ${cat.category_name}`,
      module: 'หมวดหมู่',
      type: 'สร้าง',
    });

    return mapCategory({ ...cat, _count: { materials: 0 } });
  },

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    try {
      const updateData: any = {};
      if (dto.name) updateData.category_name = dto.name;
      if (dto.description !== undefined) updateData.description = dto.description;

      const cat = await prisma.category.update({
        where: { id: Number(id) },
        data: updateData,
        include: { _count: { select: { materials: true } } },
      });

      await this.createActivityLog({
        userName: 'ระบบ',
        action: 'แก้ไขหมวดหมู่',
        description: `แก้ไขข้อมูลหมวดหมู่: ${cat.category_name}`,
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
      const cat = await prisma.category.delete({ where: { id: Number(id) } });

      await this.createActivityLog({
        userName: 'ระบบ',
        action: 'ลบหมวดหมู่',
        description: `ลบหมวดหมู่: ${cat.category_name}`,
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
        { material_name: { contains: query.search, mode: 'insensitive' } },
        { material_code: { contains: query.search, mode: 'insensitive' } },
        { category: { category_name: { contains: query.search, mode: 'insensitive' } } },
        { location: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query?.categoryId) where.category_id = Number(query.categoryId);
    // status mapping is complex now, omit for simple search or implement active check
    if (query?.status === 'ใช้งาน') where.is_active = true;

    const materials = await prisma.material.findMany({
      where,
      include: { category: { select: { category_name: true } } },
      orderBy: { created_at: 'desc' },
    });
    
    const mapped = materials.map(mapMaterial);
    
    const statusPriority: Record<string, number> = { 'หมดสต็อก': 0, 'ใกล้หมด': 1, 'มีสต็อก': 2, 'ไม่ใช้งาน': 3 };
    
    return mapped.sort((a, b) => {
      const priorityDiff = (statusPriority[a.status] ?? 9) - (statusPriority[b.status] ?? 9);
      if (priorityDiff !== 0) return priorityDiff;
      return a.code.localeCompare(b.code, 'th');
    });
  },

  async getMaterialById(id: string) {
    const mat = await prisma.material.findUnique({
      where: { id: Number(id) },
      include: { category: { select: { category_name: true } } },
    });
    return mat ? mapMaterial(mat) : null;
  },

  async createMaterial(dto: CreateMaterialDto) {
    const qty = Number(dto.quantity) || 0;
    const minQty = Number(dto.minQuantity) || 10;
    const isActive = computeMaterialStatus(qty, minQty) !== 'หมดสต็อก';

    const mat = await prisma.material.create({
      data: {
        material_code: dto.code,
        material_name: dto.name,
        category_id: Number(dto.categoryId),
        unit: dto.unit,
        stock_quantity: qty,
        minimum_stock: minQty,
        price_per_unit: dto.pricePerUnit ? Number(dto.pricePerUnit) : 0,
        location: dto.location || 'โกดังกลาง',
        description: dto.description || null,
        is_active: isActive,
      },
      include: { category: { select: { category_name: true } } },
    });

    await this.createActivityLog({
      userName: 'ระบบ',
      action: 'เพิ่มวัสดุ',
      description: `เพิ่มวัสดุใหม่: ${mat.material_name} (${mat.material_code}) จำนวน ${qty} ${mat.unit || 'ชิ้น'}`,
      module: 'วัสดุ',
      type: 'สร้าง',
    });

    return mapMaterial(mat);
  },

  async updateMaterial(id: string, dto: UpdateMaterialDto) {
    try {
      const existing = await prisma.material.findUnique({ where: { id: Number(id) } });
      if (!existing) return null;

      const qty = dto.quantity !== undefined ? Number(dto.quantity) : existing.stock_quantity;
      const minQty = dto.minQuantity !== undefined ? Number(dto.minQuantity) : existing.minimum_stock;
      
      const updateData: any = {
          stock_quantity: qty,
          minimum_stock: minQty,
      };
      if (dto.code) updateData.material_code = dto.code;
      if (dto.name) updateData.material_name = dto.name;
      if (dto.categoryId) updateData.category_id = Number(dto.categoryId);
      if (dto.unit) updateData.unit = dto.unit;
      if (dto.pricePerUnit !== undefined) updateData.price_per_unit = Number(dto.pricePerUnit);
      if (dto.location !== undefined) updateData.location = dto.location;
      if (dto.description !== undefined) updateData.description = dto.description;

      const mat = await prisma.material.update({
        where: { id: Number(id) },
        data: updateData,
        include: { category: { select: { category_name: true } } },
      });

      await this.createActivityLog({
        userName: 'ระบบ',
        action: 'แก้ไขวัสดุ',
        description: `แก้ไขข้อมูลวัสดุ: ${mat.material_name}`,
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
      const mat = await prisma.material.delete({ where: { id: Number(id) } });

      await this.createActivityLog({
        userName: 'ระบบ',
        action: 'ลบวัสดุ',
        description: `ลบวัสดุ: ${mat.material_name} (${mat.material_code})`,
        module: 'วัสดุ',
        type: 'ลบ',
      });

      return true;
    } catch {
      return false;
    }
  },

  async restockMaterial(id: string, addQty: number, reason: string, userName?: string) {
    const mat = await prisma.material.findUnique({ where: { id: Number(id) } });
    if (!mat) return null;

    const newQty = mat.stock_quantity + addQty;

    const updated = await prisma.material.update({
      where: { id: Number(id) },
      data: {
        stock_quantity: newQty,
      },
      include: { category: { select: { category_name: true } } },
    });
    
    // Create stock movement
    await prisma.stockMovement.create({
        data: {
            material_id: updated.id,
            movement_type: 'IN',
            quantity: addQty,
            note: reason
        }
    });

    await this.createActivityLog({
      userName: userName || 'ผู้ดูแลระบบ',
      action: 'เติมสต็อก',
      description: `เติมสต็อก ${mat.material_name} จำนวน +${addQty} ${mat.unit || 'ชิ้น'} (เหตุผล: ${reason})`,
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

    if (query?.requesterId) where.user_id = Number(query.requesterId);
    if (query?.status) {
        if (query.status === 'รออนุมัติ') where.status = 'PENDING';
        else if (query.status === 'อนุมัติแล้ว') where.status = 'APPROVED';
        else if (query.status === 'ไม่อนุมัติ') where.status = 'REJECTED';
        else if (query.status === 'กำลังยืม') where.status = 'BORROWING';
        else if (query.status === 'คืนแล้ว') where.status = 'RETURNED';
        else if (query.status === 'ยกเลิกแล้ว') where.status = 'CANCELLED';
    }
    if (query?.type) where.request_type = query.type === 'ยืมวัสดุ' ? 'BORROW' : 'WITHDRAW';

    const requests = await prisma.request.findMany({
      where,
      include: requestInclude,
      orderBy: { created_at: 'desc' },
    });
    return requests.map(mapRequest);
  },

  async getRequestById(id: string) {
    const req = await prisma.request.findUnique({
      where: { id: Number(id) },
      include: requestInclude,
    });
    return req ? mapRequest(req) : null;
  },

  async createRequest(dto: CreateRequestDto) {
    const mat = await prisma.material.findUnique({
      where: { id: Number(dto.materialId) },
      include: { category: { select: { category_name: true } } },
    });

    if (mat && mat.stock_quantity < dto.quantity) {
      throw new Error(`สต็อกคงเหลือไม่เพียงพอ (มีคงเหลือ ${mat.stock_quantity} ${mat.unit || 'ชิ้น'})`);
    }

    // Generate request code
    const count = await prisma.request.count();
    const padNum = String(count + 1).padStart(4, '0');

    const user = await prisma.user.findUnique({ where: { id: Number(dto.requesterId) } });

    const req = await prisma.request.create({
      data: {
        request_code: `REQ-2569-${padNum}`,
        request_type: dto.requestType === 'ยืมวัสดุ' ? 'BORROW' : 'WITHDRAW',
        user_id: Number(dto.requesterId),
        reason: dto.reason,
        status: 'PENDING',
        borrow_date: dto.borrowDate ? new Date(dto.borrowDate) : null,
        due_date: dto.expectedReturnDate ? new Date(dto.expectedReturnDate) : null,
        request_items: {
          create: {
            material_id: Number(dto.materialId),
            quantity: dto.quantity,
          }
        }
      },
      include: requestInclude,
    });

    const requesterFullName = user ? `${user.first_name} ${user.last_name}`.trim() : dto.requesterName || 'เจ้าหน้าที่';

    await this.createActivityLog({
      userName: requesterFullName,
      action: dto.requestType === 'ยืมวัสดุ' ? 'ส่งคำขอยืม' : 'ส่งคำขอเบิก',
      description: `${requesterFullName} ส่งคำขอ ${dto.requestType}: ${mat?.material_name || 'วัสดุ'} จำนวน ${dto.quantity} ${mat?.unit || 'ชิ้น'}`,
      module: 'การอนุมัติ',
      type: 'สร้าง',
    });

    return mapRequest(req);
  },

  async approveRequest(id: string, approverName?: string, approverId?: string) {
    const req = await prisma.request.findUnique({
      where: { id: Number(id) },
      include: { request_items: { include: { material: true } }, user: true },
    });
    if (!req) return null;

    // Deduct stock for all items
    for (const item of req.request_items) {
        if (item.material) {
            const newQty = Math.max(0, item.material.stock_quantity - item.quantity);
            await prisma.material.update({
                where: { id: item.material_id },
                data: { stock_quantity: newQty, updated_at: new Date() },
            });
            // Create stock movement
            await prisma.stockMovement.create({
                data: {
                    material_id: item.material_id,
                    movement_type: 'OUT',
                    quantity: item.quantity,
                    note: `จ่ายออกตามคำขอ ${req.request_code}`
                }
            });
        }
    }

    const newStatus = req.request_type === 'BORROW' ? 'BORROWING' : 'APPROVED';

    const updated = await prisma.request.update({
      where: { id: Number(id) },
      data: { status: newStatus },
      include: requestInclude,
    });
    
    // Create Approval record
    if (approverId) {
        await prisma.approval.create({
            data: {
                request_id: Number(id),
                approver_id: Number(approverId),
                result: 'APPROVED',
                approved_at: new Date()
            }
        });
    }

    const requesterName = req.user ? `${req.user.first_name} ${req.user.last_name}`.trim() : 'เจ้าหน้าที่';
    const materialName = req.request_items[0]?.material?.material_name || 'วัสดุ';

    await this.createActivityLog({
      userName: approverName || 'ผู้อนุมัติ',
      action: 'อนุมัติคำขอ',
      description: `อนุมัติคำขอ ${req.request_code} ของ ${requesterName} รายการ: ${materialName}`,
      module: 'การอนุมัติ',
      type: 'อนุมัติ',
    });

    return mapRequest(updated);
  },

  async rejectRequest(id: string, reason: string, approverName?: string, approverId?: string) {
    const req = await prisma.request.findUnique({
      where: { id: Number(id) },
      include: { user: true },
    });
    if (!req) return null;

    const updated = await prisma.request.update({
      where: { id: Number(id) },
      data: { status: 'REJECTED' },
      include: requestInclude,
    });

    if (approverId) {
        await prisma.approval.create({
            data: {
                request_id: Number(id),
                approver_id: Number(approverId),
                result: 'REJECTED',
                reason: reason,
                approved_at: new Date()
            }
        });
    }

    await this.createActivityLog({
      userName: approverName || 'ผู้อนุมัติ',
      action: 'ไม่อนุมัติคำขอ',
      description: `ไม่อนุมัติคำขอ ${req.request_code} เหตุผล: ${reason}`,
      module: 'การอนุมัติ',
      type: 'อนุมัติ',
    });

    return mapRequest(updated);
  },

  async cancelRequest(id: string, cancellerName?: string, cancellerId?: string) {
    const req = await prisma.request.findUnique({ where: { id: Number(id) } });
    if (!req) return null;

    const updated = await prisma.request.update({
      where: { id: Number(id) },
      data: { status: 'CANCELLED' },
      include: requestInclude,
    });

    await this.createActivityLog({
      userName: cancellerName || 'เจ้าหน้าที่',
      action: 'ยกเลิกคำขอ',
      description: `ยกเลิกคำขอ ${req.request_code} โดย ${cancellerName || 'เจ้าหน้าที่'}`,
      module: 'การอนุมัติ',
      type: 'แก้ไข',
    });

    return mapRequest(updated);
  },

  // ==========================================
  // RETURNS
  // ==========================================
  async getReturnRecords() {
    const records = await prisma.return.findMany({
      include: returnInclude,
      orderBy: { created_at: 'desc' },
    });
    return records.map(mapReturnRecord);
  },

  async processReturn(dto: ProcessReturnDto) {
    const req = await prisma.request.findUnique({
      where: { id: Number(dto.requestId) },
      include: { request_items: { include: { material: true } }, user: true },
    });
    if (!req) return null;

    const firstItem = req.request_items[0];

    // Restore stock
    if (firstItem?.material) {
      const newQty = firstItem.material.stock_quantity + dto.returnedQuantity;
      await prisma.material.update({
        where: { id: firstItem.material_id },
        data: { stock_quantity: newQty, updated_at: new Date() },
      });
      
      // Create stock movement
      await prisma.stockMovement.create({
          data: {
              material_id: firstItem.material_id,
              movement_type: 'IN',
              quantity: dto.returnedQuantity,
              note: `รับคืนตามคำขอ ${req.request_code}`
          }
      });
    }

    // Create return record
    const count = await prisma.return.count();
    const padNum = String(count + 1).padStart(4, '0');
    const returnRecord = await prisma.return.create({
      data: {
        return_code: `RET-2569-${padNum}`,
        request_id: req.id,
        user_id: dto.receivedById ? Number(dto.receivedById) : req.user_id,
        return_date: dto.returnDate ? new Date(dto.returnDate) : new Date(),
        note: dto.notes || null,
        return_items: {
          create: {
            material_id: firstItem?.material_id || 0,
            quantity: dto.returnedQuantity,
            condition: dto.condition
          }
        }
      },
      include: returnInclude,
    });

    // Update request status
    await prisma.request.update({
      where: { id: Number(dto.requestId) },
      data: {
        status: 'RETURNED',
      },
    });

    const requesterName = req.user ? `${req.user.first_name} ${req.user.last_name}`.trim() : 'ผู้ยืม';
    const materialName = firstItem?.material?.material_name || 'วัสดุ';

    await this.createActivityLog({
      userName: dto.receivedByName || 'ผู้ดูแลระบบ',
      action: 'บันทึกการคืน',
      description: `บันทึกการคืนวัสดุ ${materialName} จำนวน ${dto.returnedQuantity} ${firstItem?.material?.unit || 'ชิ้น'} จาก ${requesterName} (สภาพ: ${dto.condition})`,
      module: 'คลังสินค้า',
      type: 'เบิกจ่าย',
    });

    return mapReturnRecord(returnRecord);
  },

  // ==========================================
  // ACTIVITY LOGS
  // ==========================================
  async getActivityLogs(query?: { type?: string; module?: string; limit?: number }) {
    const logs = await prisma.auditLog.findMany({
      orderBy: { created_at: 'desc' },
      take: query?.limit || undefined,
      include: { user: true }
    });
    return logs.map(mapActivityLog);
  },

  async createActivityLog(dto: CreateActivityLogDto) {
    const log = await prisma.auditLog.create({
      data: {
        user_id: dto.userId ? Number(dto.userId) : null,
        action: dto.action,
        table_name: dto.module || 'System',
        record_id: null,
        description: dto.description,
        ip_address: dto.ipAddress || '192.168.1.100',
      },
      include: { user: true }
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
      activeBorrows,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { is_active: true } }),
      prisma.material.count(),
      prisma.category.count(),
      prisma.request.count({ where: { status: 'PENDING' } }),
      prisma.request.count({ where: { status: 'BORROWING' } }),
    ]);

    // Get recent requests & logs
    const recentRequests = await prisma.request.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: requestInclude,
    });

    const recentLogs = await prisma.auditLog.findMany({
      take: 6,
      orderBy: { created_at: 'desc' },
      include: { user: true }
    });

    // Compute low stock items and out of stock items
    const materials = await prisma.material.findMany({
      select: { stock_quantity: true, minimum_stock: true },
    });
    
    const lowStockItems = materials.filter(m => m.stock_quantity > 0 && m.stock_quantity <= m.minimum_stock).length;
    const outOfStockItems = materials.filter(m => m.stock_quantity === 0).length;
    const totalValue = 0; // Price per unit no longer in DB

    // Fetch all requests to compute charts
    const allRequests = await prisma.request.findMany({
      include: {
        user: { include: { department: true } },
        request_items: { include: { material: true } }
      }
    });

    // Compute monthlyReportData
    const thMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const monthData = Array(12).fill(null).map((_, i) => ({
      month: thMonths[i],
      withdrawals: 0,
      value: 0,
      requests: 0
    }));

    // Compute departmentUsageData
    const deptMap: Record<string, number> = {};
    let deptTotalValue = 0;

    allRequests.forEach(req => {
      // monthly logic
      const reqMonth = req.created_at.getMonth(); // 0 to 11
      const item = req.request_items[0];
      const qty = item ? item.quantity : 0;
      const price = (item && item.material) ? Number(item.material.price_per_unit) || 0 : 0;
      const val = qty * price;

      if (reqMonth >= 0 && reqMonth < 12) {
        monthData[reqMonth].requests += 1;
        if (req.request_type === 'WITHDRAW') {
          monthData[reqMonth].withdrawals += 1;
        }
        monthData[reqMonth].value += val;
      }

      // department logic
      const deptName = req.user?.department?.department_name || 'ไม่ระบุ';
      deptMap[deptName] = (deptMap[deptName] || 0) + val;
      deptTotalValue += val;
    });

    const monthlyReportData = monthData;

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];
    let deptArr = Object.keys(deptMap).map(dept => ({
      department: dept,
      value: deptMap[dept],
      percentage: deptTotalValue > 0 ? (deptMap[dept] / deptTotalValue) * 100 : 0,
    })).sort((a, b) => b.value - a.value);

    if (deptArr.length === 0) {
      deptArr = [{ department: 'ไม่มีข้อมูล', value: 0, percentage: 100 }];
    }

    const departmentUsageData = deptArr.map((item, index) => ({
      ...item,
      percentage: Math.round(item.percentage),
      color: colors[index % colors.length]
    }));

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
      monthlyReportData,
      departmentUsageData,
    };
  },

  // ==========================================
  // PASSWORD (for login)
  // ==========================================
  async getUserWithPassword(identifier: string) {
    const query = identifier.trim().toLowerCase();

    let user: any = await prisma.user.findFirst({
      where: { email: { equals: query, mode: 'insensitive' } },
      include: userInclude
    });
    if (!user) {
      user = await prisma.user.findFirst({
        where: { username: { equals: query, mode: 'insensitive' } },
        include: userInclude
      });
    }
    // Role-based shortcut
    if (!user && (query === 'admin' || query.startsWith('admin@'))) {
      user = await prisma.user.findFirst({ where: { role: { role_name: 'ผู้ดูแลระบบ' }, is_active: true }, include: userInclude });
    }
    if (!user && (query === 'approver' || query.startsWith('approver@'))) {
      user = await prisma.user.findFirst({ where: { role: { role_name: 'ผู้อนุมัติ' }, is_active: true }, include: userInclude });
    }
    if (!user && (query === 'staff' || query.startsWith('staff@'))) {
      user = await prisma.user.findFirst({ where: { role: { role_name: 'เจ้าหน้าที่' }, is_active: true }, include: userInclude });
    }

    if (user) {
        return {
            ...user,
            password: user.password_hash,
            status: user.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน',
            role: user.role?.role_name || 'เจ้าหน้าที่',
            fullName: `${user.first_name} ${user.last_name}`.trim(),
            department: user.department?.department_name || '',
            avatar: `${(user.first_name || '').slice(0, 1)}${(user.last_name || '').slice(0, 1)}` || '👤',
        }
    }

    return null;
  },

  async updateLastLogin(id: string) {
    // lastLogin column is removed from schema, doing nothing or logging
    console.log(`User ${id} logged in`);
  },
};
