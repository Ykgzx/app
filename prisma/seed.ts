// Seed Script สำหรับระบบจัดการวัสดุเทศบาลนครรังสิต
// รัน: npx prisma db seed (หลัง migrate)
// (อัปเดตเพื่อเคลียร์แคชของ TypeScript)

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 เริ่มต้น Seed ข้อมูล...');

  // Hash default password
  const defaultPasswordHash = await bcrypt.hash('password123', 12);

  // =============================================
  // Roles & Departments
  // =============================================
  console.log('🏢 สร้างบทบาทและแผนก...');
  const roleAdmin = await prisma.role.findFirst({ where: { role_name: 'ผู้ดูแลระบบ' } }) || await prisma.role.create({ data: { role_name: 'ผู้ดูแลระบบ' } });
  const roleApprover = await prisma.role.findFirst({ where: { role_name: 'ผู้อนุมัติ' } }) || await prisma.role.create({ data: { role_name: 'ผู้อนุมัติ' } });
  const roleStaff = await prisma.role.findFirst({ where: { role_name: 'เจ้าหน้าที่' } }) || await prisma.role.create({ data: { role_name: 'เจ้าหน้าที่' } });

  const deptWorks = await prisma.department.findFirst({ where: { department_name: 'กองช่าง (Public Works)' } }) || await prisma.department.create({ data: { department_name: 'กองช่าง (Public Works)' } });
  const deptOffice = await prisma.department.findFirst({ where: { department_name: 'สำนักปลัด (Office of the Palad)' } }) || await prisma.department.create({ data: { department_name: 'สำนักปลัด (Office of the Palad)' } });
  const deptFinance = await prisma.department.findFirst({ where: { department_name: 'กองคลัง (Finance)' } }) || await prisma.department.create({ data: { department_name: 'กองคลัง (Finance)' } });
  const deptHealth = await prisma.department.findFirst({ where: { department_name: 'กองสาธารณสุข (Public Health)' } }) || await prisma.department.create({ data: { department_name: 'กองสาธารณสุข (Public Health)' } });
  const deptEdu = await prisma.department.findFirst({ where: { department_name: 'กองการศึกษา (Education)' } }) || await prisma.department.create({ data: { department_name: 'กองการศึกษา (Education)' } });

  // =============================================
  // ผู้ใช้งาน (Users)
  // =============================================
  console.log('👤 สร้างผู้ใช้งาน...');
  const users = await Promise.all([
    prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        first_name: 'สมชาย',
        last_name: 'ใจดี',
        username: 'admin',
        password_hash: defaultPasswordHash,
        email: 'admin@gmail.com',
        department_id: deptWorks.id,
        role_id: roleAdmin.id,
        is_active: true,
        phone: '081-234-5678',
      },
    }),
    prisma.user.upsert({
      where: { username: 'staff' },
      update: {},
      create: {
        first_name: 'วันทนา',
        last_name: 'สุขกมล',
        username: 'staff',
        password_hash: defaultPasswordHash,
        email: 'staff@rangsit.go.th',
        department_id: deptOffice.id,
        role_id: roleStaff.id,
        is_active: true,
        phone: '082-345-6789',
      },
    }),
    prisma.user.upsert({
      where: { username: 'kritsada.r' },
      update: {},
      create: {
        first_name: 'กฤษฎา',
        last_name: 'เรืองจ',
        username: 'kritsada.r',
        password_hash: defaultPasswordHash,
        email: 'kritsada.r@rangsit.go.th',
        department_id: deptFinance.id,
        role_id: roleApprover.id,
        is_active: false,
        phone: '083-456-7890',
      },
    }),
    prisma.user.upsert({
      where: { username: 'supaporn.s' },
      update: {},
      create: {
        first_name: 'สุภาพร',
        last_name: 'แสงทอง',
        username: 'supaporn.s',
        password_hash: defaultPasswordHash,
        email: 'supaporn.s@rangsit.go.th',
        department_id: deptHealth.id,
        role_id: roleStaff.id,
        is_active: true,
        phone: '084-567-8901',
      },
    }),
    prisma.user.upsert({
      where: { username: 'approver' },
      update: {},
      create: {
        first_name: 'ประยุทธ์',
        last_name: 'มั่นคง',
        username: 'approver',
        password_hash: defaultPasswordHash,
        email: 'approver@rangsit.go.th',
        department_id: deptWorks.id,
        role_id: roleApprover.id,
        is_active: true,
        phone: '085-678-9012',
      },
    }),
    prisma.user.upsert({
      where: { username: 'nareerat.p' },
      update: {},
      create: {
        first_name: 'นารีรัตน์',
        last_name: 'พิมพา',
        username: 'nareerat.p',
        password_hash: defaultPasswordHash,
        email: 'nareerat.p@rangsit.go.th',
        department_id: deptEdu.id,
        role_id: roleStaff.id,
        is_active: true,
        phone: '086-789-0123',
      },
    }),
    prisma.user.upsert({
      where: { username: 'thanakorn.w' },
      update: {},
      create: {
        first_name: 'ธนากร',
        last_name: 'วงษ์ศรี',
        username: 'thanakorn.w',
        password_hash: defaultPasswordHash,
        email: 'thanakorn.w@rangsit.go.th',
        department_id: deptFinance.id,
        role_id: roleStaff.id,
        is_active: true,
        phone: '087-890-1234',
      },
    }),
    prisma.user.upsert({
      where: { username: 'porntip.s' },
      update: {},
      create: {
        first_name: 'พรทิพย์',
        last_name: 'ศรีสว่าง',
        username: 'porntip.s',
        password_hash: defaultPasswordHash,
        email: 'porntip.s@rangsit.go.th',
        department_id: deptOffice.id,
        role_id: roleAdmin.id,
        is_active: true,
        phone: '088-901-2345',
      },
    }),
  ]);
  console.log(`  ✅ สร้างผู้ใช้งาน ${users.length} คน`);

  // =============================================
  // หมวดหมู่วัสดุ (Categories)
  // =============================================
  console.log('📁 สร้างหมวดหมู่...');
  const createCategory = async (name: string, desc: string) => {
      let cat = await prisma.category.findFirst({ where: { category_name: name } });
      if (!cat) {
          cat = await prisma.category.create({ data: { category_name: name, description: desc } });
      }
      return cat;
  };
  const categories = await Promise.all([
    createCategory('วัสดุสำนักงาน', 'อุปกรณ์เครื่องเขียน กระดาษ แฟ้ม และอุปกรณ์สำนักงานทั่วไป'),
    createCategory('วัสดุไฟฟ้า', 'หลอดไฟ สายไฟ สวิตช์ ปลั๊กไฟ และอุปกรณ์ไฟฟ้าต่างๆ'),
    createCategory('วัสดุก่อสร้าง', 'ปูน ทราย อิฐ เหล็ก และวัสดุก่อสร้างทุกชนิด'),
    createCategory('วัสดุประปา', 'ท่อน้ำ ข้อต่อ วาล์ว ก๊อกน้ำ และอุปกรณ์ประปา'),
    createCategory('วัสดุคอมพิวเตอร์', 'หมึกพิมพ์ กระดาษ A4 อุปกรณ์ต่อพ่วง และวัสดุสิ้นเปลือง IT'),
    createCategory('วัสดุทำความสะอาด', 'น้ำยาทำความสะอาด ไม้กวาด ถุงขยะ และอุปกรณ์ทำความสะอาด'),
    createCategory('วัสดุการเกษตร', 'ปุ๋ย ยาฆ่าแมลง เมล็ดพันธุ์ และอุปกรณ์การเกษตร'),
    createCategory('วัสดุยานพาหนะ', 'น้ำมันเครื่อง ยางรถ อะไหล่ และอุปกรณ์ซ่อมบำรุงรถ'),
  ]);
  console.log(`  ✅ สร้างหมวดหมู่ ${categories.length} รายการ`);

  // =============================================
  // วัสดุและครุภัณฑ์ (Materials)
  // =============================================
  console.log('📦 สร้างวัสดุ...');
  const materialsData = [
    { code: 'OFF-001', name: 'กระดาษ A4 80 แกรม', categoryIdx: 0, unit: 'รีม', quantity: 450, minQuantity: 100, pricePerUnit: 120, location: 'ห้องเก็บของ A1', description: 'กระดาษถ่ายเอกสาร A4 ขนาด 80 แกรม ยี่ห้อ Double A' },
    { code: 'OFF-002', name: 'ปากกาลูกลื่น', categoryIdx: 0, unit: 'ด้าม', quantity: 200, minQuantity: 50, pricePerUnit: 15, location: 'ห้องเก็บของ A1', description: 'ปากกาลูกลื่น หมึกน้ำเงิน ขนาด 0.5 มม.' },
    { code: 'ELE-001', name: 'หลอดไฟ LED 18W', categoryIdx: 1, unit: 'หลอด', quantity: 35, minQuantity: 50, pricePerUnit: 89, location: 'ห้องเก็บของ B2', description: 'หลอดไฟ LED T8 ขนาด 18 วัตต์ แสงขาว' },
    { code: 'CON-001', name: 'ปูนซีเมนต์ปอร์ตแลนด์', categoryIdx: 2, unit: 'ถุง', quantity: 0, minQuantity: 20, pricePerUnit: 165, location: 'โกดัง C1', description: 'ปูนซีเมนต์ปอร์ตแลนด์ ประเภท 1 ตราเสือ 50 กก.' },
    { code: 'PLU-001', name: 'ท่อ PVC 4 นิ้ว', categoryIdx: 3, unit: 'ท่อน', quantity: 80, minQuantity: 30, pricePerUnit: 250, location: 'โกดัง C2', description: 'ท่อ PVC แข็ง ขนาด 4 นิ้ว ชั้น 8.5 ยาว 4 เมตร' },
    { code: 'COM-001', name: 'หมึกพิมพ์ HP 680', categoryIdx: 4, unit: 'ตลับ', quantity: 12, minQuantity: 10, pricePerUnit: 450, location: 'ห้องเก็บของ A2', description: 'หมึกพิมพ์ HP 680 สีดำ ของแท้' },
    { code: 'CLN-001', name: 'น้ำยาถูพื้น', categoryIdx: 5, unit: 'แกลลอน', quantity: 25, minQuantity: 10, pricePerUnit: 180, location: 'ห้องเก็บของ D1', description: 'น้ำยาถูพื้น สูตรฆ่าเชื้อ ขนาด 3.8 ลิตร' },
    { code: 'OFF-003', name: 'แฟ้มเอกสาร A4', categoryIdx: 0, unit: 'แฟ้ม', quantity: 300, minQuantity: 50, pricePerUnit: 35, location: 'ห้องเก็บของ A1', description: 'แฟ้มเอกสาร A4 แบบสันห่วง คละสี' },
    { code: 'ELE-002', name: 'สายไฟ THW 2.5 มม.', categoryIdx: 1, unit: 'เมตร', quantity: 500, minQuantity: 100, pricePerUnit: 12, location: 'ห้องเก็บของ B2', description: 'สายไฟ THW ขนาด 2.5 ตร.มม. สีดำ' },
    { code: 'CON-002', name: 'ทราย', categoryIdx: 2, unit: 'คิว', quantity: 15, minQuantity: 5, pricePerUnit: 800, location: 'โกดัง C1', description: 'ทราย หยาบ สำหรับงานก่อสร้าง' },
  ];

  const materials = [];
  for (const m of materialsData) {
    const isActive = m.quantity > 0;
    const mat = await prisma.material.upsert({
      where: { material_code: m.code },
      update: {},
      create: {
        material_code: m.code,
        material_name: m.name,
        category_id: categories[m.categoryIdx].id,
        unit: m.unit,
        stock_quantity: m.quantity,
        minimum_stock: m.minQuantity,
        location: m.location,
        description: m.description,
        is_active: isActive,
      },
    });
    materials.push(mat);
  }
  console.log(`  ✅ สร้างวัสดุ ${materials.length} รายการ`);

  // =============================================
  // คำขอเบิก-ยืมวัสดุ (Requests)
  // =============================================
  console.log('📋 สร้างคำขอเบิก-ยืม...');
  const requestsData = [
    { code: 'REQ-2569-0001', type: 'เบิกวัสดุ', requesterIdx: 1, materialIdx: 0, quantity: 50, reason: 'เบิกใช้สำหรับงานเอกสารประจำเดือน สิงหาคม 2569', status: 'PENDING' },
    { code: 'REQ-2569-0002', type: 'ยืมวัสดุ', requesterIdx: 5, materialIdx: 1, quantity: 100, reason: 'เบิกใช้สำหรับโครงการอบรมครู ประจำปี 2569', status: 'BORROWING', approverIdx: 4 },
    { code: 'REQ-2569-0003', type: 'เบิกวัสดุ', requesterIdx: 6, materialIdx: 5, quantity: 5, reason: 'หมึกพิมพ์หมด ต้องการเบิกเพิ่มสำหรับเครื่องพิมพ์ประจำแผนก', status: 'APPROVED', approverIdx: 4 },
    { code: 'REQ-2569-0004', type: 'ยืมวัสดุ', requesterIdx: 3, materialIdx: 6, quantity: 10, reason: 'เบิกใช้ทำความสะอาดสำนักงาน ประจำเดือน', status: 'BORROWING', approverIdx: 4 },
    { code: 'REQ-2569-0005', type: 'เบิกวัสดุ', requesterIdx: 3, materialIdx: 3, quantity: 30, reason: 'ซ่อมแซมถนนในเขตเทศบาล', status: 'REJECTED', approverIdx: 4, rejectReason: 'จำนวนสต็อกไม่เพียงพอต่อการใช้งานของโครงการ' },
    { code: 'REQ-2569-0006', type: 'เบิกวัสดุ', requesterIdx: 0, materialIdx: 4, quantity: 20, reason: 'ซ่อมแซมระบบประปาหมู่บ้านจัดสรร', status: 'PENDING' },
  ];

  for (const r of requestsData) {
    const existing = await prisma.request.findUnique({ where: { request_code: r.code } });
    if (!existing) {
      const req = await prisma.request.create({
        data: {
          request_code: r.code,
          request_type: r.type === 'ยืมวัสดุ' ? 'BORROW' : 'WITHDRAW',
          user_id: users[r.requesterIdx].id,
          reason: r.reason,
          status: r.status as any,
          borrow_date: r.type === 'ยืมวัสดุ' ? new Date() : null,
          due_date: r.type === 'ยืมวัสดุ' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null,
          request_items: {
            create: {
              material_id: materials[r.materialIdx].id,
              quantity: r.quantity,
            }
          }
        },
      });

      if (r.approverIdx !== undefined) {
        await prisma.approval.create({
          data: {
            request_id: req.id,
            approver_id: users[r.approverIdx].id,
            result: r.status === 'REJECTED' ? 'REJECTED' : 'APPROVED',
            reason: r.rejectReason || null,
          }
        });
      }
    }
  }
  console.log(`  ✅ สร้างคำขอเบิก-ยืม ${requestsData.length} รายการ`);

  // =============================================
  // ประวัติการใช้งาน (Activity Logs)
  // =============================================
  console.log('📝 สร้างบันทึกประวัติ...');
  const logsData = [
    { action: 'เข้าสู่ระบบ', description: 'สมชาย ใจดี เข้าสู่ระบบ', module: 'users', type: 'เข้าสู่ระบบ', userId: users[0].id },
    { action: 'เพิ่มวัสดุ', description: 'เพิ่มวัสดุใหม่: กระดาษ A4 80 แกรม จำนวน 200 รีม', module: 'materials', type: 'สร้าง', userId: users[0].id },
    { action: 'อนุมัติคำขอ', description: 'อนุมัติคำขอเบิก REQ-2569-0003 หมึกพิมพ์ HP 680', module: 'requests', type: 'อนุมัติ', userId: users[4].id },
    { action: 'แก้ไขผู้ใช้', description: 'แก้ไขข้อมูลผู้ใช้: กฤษฎา เรืองจ สถานะเปลี่ยนเป็นไม่ใช้งาน', module: 'users', type: 'แก้ไข', userId: users[7].id },
    { action: 'เบิกจ่ายวัสดุ', description: 'เบิกจ่าย น้ำยาถูพื้น จำนวน 10 แกลลอน ให้กองสาธารณสุข', module: 'materials', type: 'เบิกจ่าย', userId: users[0].id },
  ];

  for (const l of logsData) {
    await prisma.auditLog.create({
      data: {
        user_id: l.userId,
        action: l.action,
        table_name: l.module,
        description: l.description,
      },
    });
  }
  console.log(`  ✅ สร้างบันทึกประวัติ ${logsData.length} รายการ`);

  console.log('\n🎉 Seed สำเร็จ! ข้อมูลพร้อมใช้งาน');
  console.log('📌 รหัสผ่านเริ่มต้นสำหรับทุกบัญชี: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
