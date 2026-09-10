// Seed Script สำหรับระบบจัดการวัสดุเทศบาลนครรังสิต
// รัน: npx prisma db seed (หลัง migrate)

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
  // ผู้ใช้งาน (Users)
  // =============================================
  console.log('👤 สร้างผู้ใช้งาน...');
  const users = await Promise.all([
    prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        fullName: 'สมชาย ใจดี',
        username: 'admin',
        password: defaultPasswordHash,
        email: 'admin@rangsit.go.th',
        department: 'กองช่าง (Public Works)',
        role: 'ผู้ดูแลระบบ',
        status: 'ใช้งาน',
        lastLogin: '-',
        avatar: 'สช',
        phone: '081-234-5678',
      },
    }),
    prisma.user.upsert({
      where: { username: 'staff' },
      update: {},
      create: {
        fullName: 'วันทนา สุขกมล',
        username: 'staff',
        password: defaultPasswordHash,
        email: 'staff@rangsit.go.th',
        department: 'สำนักปลัด (Office of the Palad)',
        role: 'เจ้าหน้าที่',
        status: 'ใช้งาน',
        lastLogin: '-',
        avatar: 'วส',
        phone: '082-345-6789',
      },
    }),
    prisma.user.upsert({
      where: { username: 'kritsada.r' },
      update: {},
      create: {
        fullName: 'กฤษฎา เรืองจ',
        username: 'kritsada.r',
        password: defaultPasswordHash,
        email: 'kritsada.r@rangsit.go.th',
        department: 'กองคลัง (Finance)',
        role: 'ผู้อนุมัติ',
        status: 'ไม่ใช้งาน',
        lastLogin: '-',
        avatar: 'กร',
        phone: '083-456-7890',
      },
    }),
    prisma.user.upsert({
      where: { username: 'supaporn.s' },
      update: {},
      create: {
        fullName: 'สุภาพร แสงทอง',
        username: 'supaporn.s',
        password: defaultPasswordHash,
        email: 'supaporn.s@rangsit.go.th',
        department: 'กองสาธารณสุข (Public Health)',
        role: 'เจ้าหน้าที่',
        status: 'ใช้งาน',
        lastLogin: '-',
        avatar: 'สส',
        phone: '084-567-8901',
      },
    }),
    prisma.user.upsert({
      where: { username: 'approver' },
      update: {},
      create: {
        fullName: 'ประยุทธ์ มั่นคง',
        username: 'approver',
        password: defaultPasswordHash,
        email: 'approver@rangsit.go.th',
        department: 'กองช่าง (Public Works)',
        role: 'ผู้อนุมัติ',
        status: 'ใช้งาน',
        lastLogin: '-',
        avatar: 'ปม',
        phone: '085-678-9012',
      },
    }),
    prisma.user.upsert({
      where: { username: 'nareerat.p' },
      update: {},
      create: {
        fullName: 'นารีรัตน์ พิมพา',
        username: 'nareerat.p',
        password: defaultPasswordHash,
        email: 'nareerat.p@rangsit.go.th',
        department: 'กองการศึกษา (Education)',
        role: 'เจ้าหน้าที่',
        status: 'ใช้งาน',
        lastLogin: '-',
        avatar: 'นพ',
        phone: '086-789-0123',
      },
    }),
    prisma.user.upsert({
      where: { username: 'thanakorn.w' },
      update: {},
      create: {
        fullName: 'ธนากร วงษ์ศรี',
        username: 'thanakorn.w',
        password: defaultPasswordHash,
        email: 'thanakorn.w@rangsit.go.th',
        department: 'กองคลัง (Finance)',
        role: 'เจ้าหน้าที่',
        status: 'ใช้งาน',
        lastLogin: '-',
        avatar: 'ธว',
        phone: '087-890-1234',
      },
    }),
    prisma.user.upsert({
      where: { username: 'porntip.s' },
      update: {},
      create: {
        fullName: 'พรทิพย์ ศรีสว่าง',
        username: 'porntip.s',
        password: defaultPasswordHash,
        email: 'porntip.s@rangsit.go.th',
        department: 'สำนักปลัด (Office of the Palad)',
        role: 'ผู้ดูแลระบบ',
        status: 'ใช้งาน',
        lastLogin: '-',
        avatar: 'พศ',
        phone: '088-901-2345',
      },
    }),
  ]);
  console.log(`  ✅ สร้างผู้ใช้งาน ${users.length} คน`);

  // =============================================
  // หมวดหมู่วัสดุ (Categories)
  // =============================================
  console.log('📁 สร้างหมวดหมู่...');
  const categories = await Promise.all([
    prisma.category.upsert({ where: { name: 'วัสดุสำนักงาน' }, update: {}, create: { name: 'วัสดุสำนักงาน', description: 'อุปกรณ์เครื่องเขียน กระดาษ แฟ้ม และอุปกรณ์สำนักงานทั่วไป', icon: '📋', status: 'ใช้งาน' } }),
    prisma.category.upsert({ where: { name: 'วัสดุไฟฟ้า' }, update: {}, create: { name: 'วัสดุไฟฟ้า', description: 'หลอดไฟ สายไฟ สวิตช์ ปลั๊กไฟ และอุปกรณ์ไฟฟ้าต่างๆ', icon: '⚡', status: 'ใช้งาน' } }),
    prisma.category.upsert({ where: { name: 'วัสดุก่อสร้าง' }, update: {}, create: { name: 'วัสดุก่อสร้าง', description: 'ปูน ทราย อิฐ เหล็ก และวัสดุก่อสร้างทุกชนิด', icon: '🏗️', status: 'ใช้งาน' } }),
    prisma.category.upsert({ where: { name: 'วัสดุประปา' }, update: {}, create: { name: 'วัสดุประปา', description: 'ท่อน้ำ ข้อต่อ วาล์ว ก๊อกน้ำ และอุปกรณ์ประปา', icon: '🔧', status: 'ใช้งาน' } }),
    prisma.category.upsert({ where: { name: 'วัสดุคอมพิวเตอร์' }, update: {}, create: { name: 'วัสดุคอมพิวเตอร์', description: 'หมึกพิมพ์ กระดาษ A4 อุปกรณ์ต่อพ่วง และวัสดุสิ้นเปลือง IT', icon: '💻', status: 'ใช้งาน' } }),
    prisma.category.upsert({ where: { name: 'วัสดุทำความสะอาด' }, update: {}, create: { name: 'วัสดุทำความสะอาด', description: 'น้ำยาทำความสะอาด ไม้กวาด ถุงขยะ และอุปกรณ์ทำความสะอาด', icon: '🧹', status: 'ใช้งาน' } }),
    prisma.category.upsert({ where: { name: 'วัสดุการเกษตร' }, update: {}, create: { name: 'วัสดุการเกษตร', description: 'ปุ๋ย ยาฆ่าแมลง เมล็ดพันธุ์ และอุปกรณ์การเกษตร', icon: '🌱', status: 'ใช้งาน' } }),
    prisma.category.upsert({ where: { name: 'วัสดุยานพาหนะ' }, update: {}, create: { name: 'วัสดุยานพาหนะ', description: 'น้ำมันเครื่อง ยางรถ อะไหล่ และอุปกรณ์ซ่อมบำรุงรถ', icon: '🚗', status: 'ไม่ใช้งาน' } }),
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
    const status = m.quantity === 0 ? 'หมดสต็อก' : m.quantity <= m.minQuantity ? 'ใกล้หมด' : 'มีสต็อก';
    const mat = await prisma.material.upsert({
      where: { code: m.code },
      update: {},
      create: {
        code: m.code,
        name: m.name,
        categoryId: categories[m.categoryIdx].id,
        unit: m.unit,
        quantity: m.quantity,
        minQuantity: m.minQuantity,
        pricePerUnit: m.pricePerUnit,
        location: m.location,
        description: m.description,
        status,
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
    { code: 'REQ-2569-0001', type: 'เบิกวัสดุ', requesterIdx: 1, materialIdx: 0, quantity: 50, reason: 'เบิกใช้สำหรับงานเอกสารประจำเดือน สิงหาคม 2569', status: 'รออนุมัติ' },
    { code: 'REQ-2569-0002', type: 'ยืมวัสดุ', requesterIdx: 5, materialIdx: 1, quantity: 100, reason: 'เบิกใช้สำหรับโครงการอบรมครู ประจำปี 2569', status: 'กำลังยืม', approverIdx: 4 },
    { code: 'REQ-2569-0003', type: 'เบิกวัสดุ', requesterIdx: 6, materialIdx: 5, quantity: 5, reason: 'หมึกพิมพ์หมด ต้องการเบิกเพิ่มสำหรับเครื่องพิมพ์ประจำแผนก', status: 'อนุมัติแล้ว', approverIdx: 4 },
    { code: 'REQ-2569-0004', type: 'ยืมวัสดุ', requesterIdx: 3, materialIdx: 6, quantity: 10, reason: 'เบิกใช้ทำความสะอาดสำนักงาน ประจำเดือน', status: 'กำลังยืม', approverIdx: 4 },
    { code: 'REQ-2569-0005', type: 'เบิกวัสดุ', requesterIdx: 3, materialIdx: 3, quantity: 30, reason: 'ซ่อมแซมถนนในเขตเทศบาล', status: 'ไม่อนุมัติ', approverIdx: 4, rejectReason: 'จำนวนสต็อกไม่เพียงพอต่อการใช้งานของโครงการ' },
    { code: 'REQ-2569-0006', type: 'เบิกวัสดุ', requesterIdx: 0, materialIdx: 4, quantity: 20, reason: 'ซ่อมแซมระบบประปาหมู่บ้านจัดสรร', status: 'รออนุมัติ' },
  ];

  for (const r of requestsData) {
    const existing = await prisma.request.findUnique({ where: { requestCode: r.code } });
    if (!existing) {
      await prisma.request.create({
        data: {
          requestCode: r.code,
          requestType: r.type,
          requesterId: users[r.requesterIdx].id,
          materialId: materials[r.materialIdx].id,
          quantity: r.quantity,
          unit: materials[r.materialIdx].unit,
          reason: r.reason,
          status: r.status,
          approvedById: r.approverIdx !== undefined ? users[r.approverIdx].id : null,
          approvedDate: r.approverIdx !== undefined ? new Date() : null,
          rejectReason: r.rejectReason || null,
          borrowDate: r.type === 'ยืมวัสดุ' ? new Date() : null,
          expectedReturnDate: r.type === 'ยืมวัสดุ' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null,
        },
      });
    }
  }
  console.log(`  ✅ สร้างคำขอเบิก-ยืม ${requestsData.length} รายการ`);

  // =============================================
  // ประวัติการใช้งาน (Activity Logs)
  // =============================================
  console.log('📝 สร้างบันทึกประวัติ...');
  const logsData = [
    { userName: 'สมชาย ใจดี', action: 'เข้าสู่ระบบ', description: 'สมชาย ใจดี เข้าสู่ระบบ', module: 'ระบบ', type: 'เข้าสู่ระบบ' },
    { userName: 'สมชาย ใจดี', action: 'เพิ่มวัสดุ', description: 'เพิ่มวัสดุใหม่: กระดาษ A4 80 แกรม จำนวน 200 รีม', module: 'วัสดุ', type: 'สร้าง' },
    { userName: 'ประยุทธ์ มั่นคง', action: 'อนุมัติคำขอ', description: 'อนุมัติคำขอเบิก REQ-2569-0003 หมึกพิมพ์ HP 680', module: 'การอนุมัติ', type: 'อนุมัติ' },
    { userName: 'พรทิพย์ ศรีสว่าง', action: 'แก้ไขผู้ใช้', description: 'แก้ไขข้อมูลผู้ใช้: กฤษฎา เรืองจ สถานะเปลี่ยนเป็นไม่ใช้งาน', module: 'ผู้ใช้งาน', type: 'แก้ไข' },
    { userName: 'สมชาย ใจดี', action: 'เบิกจ่ายวัสดุ', description: 'เบิกจ่าย น้ำยาถูพื้น จำนวน 10 แกลลอน ให้กองสาธารณสุข', module: 'คลังสินค้า', type: 'เบิกจ่าย' },
  ];

  for (const l of logsData) {
    await prisma.activityLog.create({
      data: {
        userName: l.userName,
        action: l.action,
        description: l.description,
        module: l.module,
        type: l.type,
      },
    });
  }
  console.log(`  ✅ สร้างบันทึกประวัติ ${logsData.length} รายการ`);

  console.log('\n🎉 Seed สำเร็จ! ข้อมูลพร้อมใช้งาน');
  console.log('📌 รหัสผ่านเริ่มต้นสำหรับทุกบัญชี: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
