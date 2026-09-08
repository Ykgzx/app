# 🏛️ ระบบจัดการวัสดุเทศบาล (Municipal Equipment Management System)

ระบบจัดการวัสดุและครุภัณฑ์สำหรับเทศบาลนครรังสิต พัฒนาด้วย **Next.js 16 (App Router)** + **React 19** + **TypeScript** + **Zustand (State & Persistence)** + **Prisma ORM Ready & REST API Layer**  
ออกแบบ UI/UX สวยงาม ทันสมัย เป็นภาษาไทยทั้งหมด รองรับการทำงานของผู้ใช้งาน 3 ระดับอย่างสมบูรณ์ พร้อมชั้นเชื่อมต่อ API Gateway เต็มรูปแบบพร้อมต่อฐานข้อมูลจริง

---

## 👥 1. การแบ่งผู้ใช้งาน 3 ระดับ (User Roles & Permissions)

ระบบจำแนกสิทธิ์และขอบเขตหน้าที่ของผู้ใช้งานออกเป็น 3 ระดับ:

### 1) 👑 ผู้ดูแลระบบ (Administrator)
- **จัดการข้อมูลผู้ใช้งาน**: เพิ่ม, แก้ไข, ลบข้อมูลผู้ใช้
- **กำหนดสิทธิ์การใช้งาน**: กำหนดบทบาท (ผู้ดูแลระบบ, ผู้อนุมัติ, เจ้าหน้าที่) และเปิด/ปิดสถานะการเข้าสู่ระบบ
- **จัดการข้อมูลหมวดหมู่วัสดุ**: สร้าง, แก้ไข, ลบหมวดหมู่ พร้อมเลือกไอคอนสัญลักษณ์
- **จัดการข้อมูลวัสดุและครุภัณฑ์**: เพิ่ม, แก้ไข, ลบข้อมูลวัสดุ พร้อมเลือกรูปภาพ/ไอคอน และระบุสถานที่จัดเก็บ
- **ระบบคลังสินค้าและสต็อก**: ตรวจสอบสต็อก, เติมสต็อก (Restock), ตรวจสอบรายการที่ใกล้หมด
- **ตรวจสอบประวัติการใช้งานทั้งหมด**: เข้าถึง Audit Trail และ Activity Log ทั้งหมดในระบบ
- **ดูรายงานสรุป**: ตรวจสอบรายงานและวิเคราะห์สถิติภาพรวม 6 ด้าน

### 2) 👤 เจ้าหน้าที่ผู้ใช้งาน (Staff / User)
- **เข้าสู่ระบบ**: เข้าใช้งานระบบผ่าน Username/Password หรือ Quick Role Selector
- **ค้นหาวัสดุและอุปกรณ์**: ค้นหาตามชื่อ, รหัส, หมวดหมู่, หรือสถานที่จัดเก็บ
- **ตรวจสอบจำนวนคงเหลือ**: เช็คสถานะสต็อกแบบ Real-time ก่อนส่งคำขอ
- **ส่งคำขอเบิกวัสดุ**: ส่งคำขอเบิกวัสดุสิ้นเปลือง พร้อมระบุจำนวนและเหตุผลการใช้งาน
- **ส่งคำขอยืมวัสดุ**: ส่งคำขอยืมวัสดุ/ครุภัณฑ์ พร้อมระบุจำนวน, วันที่เริ่มยืม, วันกำหนดส่งคืน, และวัตถุประสงค์
- **บันทึกการคืนวัสดุ**: นำส่งคืนอุปกรณ์, ระบุจำนวนที่คืน, ตรวจสอบสภาพอุปกรณ์ (สมบูรณ์/ชำรุด/สูญหาย)
- **ตรวจสอบสถานะคำขอ**: ติดตามสถานะคำขอ (รออนุมัติ / อนุมัติแล้ว / กำลังยืม / คืนแล้ว / ไม่อนุมัติ / ยกเลิก)
- **ตรวจสอบเหตุผลที่ไม่อนุมัติ**: ดูเหตุผลการไม่อนุมัติจากผู้อนุมัติได้อย่างชัดเจนในตารางและหน้ารายละเอียดคำขอ
- **ยกเลิกคำขอ**: สามารถกดยกเลิกคำขอของตนเองได้ในกรณีที่ยังอยู่ระหว่างรออนุมัติ
- **ดูประวัติการเบิก–ยืมของตนเอง**: ฟิลเตอร์ดูเฉพาะรายการของตนเอง

### 3) 🛡️ ผู้อนุมัติ (Approver)
- **ตรวจสอบคำขอเบิก–ยืม**: ตรวจสอบรายละเอียดคำขอ, ผู้ขอเบิก, แผนก, จำนวน, วันที่ยืม-คืน, และเหตุผล
- **อนุมัติคำขอ**: กดยืนยันอนุมัติคำขอ พร้อมทำการตัดยอดสต็อกในคลังโดยอัตโนมัติ
- **ไม่อนุมัติคำขอพร้อมระบุเหตุผล (Rejection Reason Flow)**: 
  - มี Modal สำหรับให้ผู้อนุมัติ**กรอกเหตุผลในการไม่อนุมัติ**อย่างชัดเจน
  - มีปุ่มเลือกเหตุผลมาตรฐานสำเร็จรูป (Preset Reasons) เช่น สต็อกไม่พอ, เอกสารไม่ครบ, อยู่ระหว่างซ่อมบำรุง, เกินระยะเวลาที่กำหนด, สงวนสิทธิ์สำหรับภารกิจฉุกเฉิน
  - ระบบตรวจสอบให้ต้องระบุเหตุผลก่อนกดยืนยันไม่อนุมัติ
  - เหตุผลจะถูกบันทึกและแสดงให้เจ้าหน้าที่ผู้ขอทราบทันที ทั้งในตารางและหน้ารายละเอียดคำขอ
### 🔒 ตารางเปรียบเทียบสิทธิ์และการจำกัดการเข้าถึง (Role-Based Access Control Matrix)

| ฟังก์ชัน / หน้าของระบบ | 👑 ผู้ดูแลระบบ (Admin) | 🛡️ ผู้อนุมัติ (Approver) | 👤 เจ้าหน้าที่ (Staff) |
| :--- | :---: | :---: | :---: |
| **แดชบอร์ดภาพรวม (`/`)** | ✅ เข้าถึงได้ | ✅ เข้าถึงได้ | ✅ เข้าถึงได้ |
| **ส่งคำขอเบิก–ยืม (`/requests`)** | ✅ ส่งได้ | ✅ ส่งได้ | ✅ ส่งได้ |
| **ยกเลิกคำขอ (`/requests`)** | ✅ ยกเลิกได้ทั้งหมด | ❌ ยกเลิกของคนอื่นไม่ได้ | ⚠️ เฉพาะคำขอของตนเองที่ยังรออนุมัติ |
| **บันทึกรับคืนอุปกรณ์ (`/returns`)** | ✅ ตรวจรับคืนได้ | ✅ ตรวจรับคืนได้ | ⚠️ เฉพาะส่งคืนอุปกรณ์ที่ตนเองยืม |
| **อนุมัติ/ไม่อนุมัติคำขอ (`/approvals`)** | ✅ มีสิทธิ์พิจารณา | ✅ มีสิทธิ์พิจารณา | 🚫 **ไม่มีสิทธิ์เข้าถึง (Access Denied)** |
| **ดูระดับสต็อกสินค้า (`/inventory`)** | ✅ เข้าถึงได้ | ✅ เข้าถึงได้ | ✅ เข้าถึงได้ |
| **เติมสต็อกสินค้า Restock (`/inventory`)** | ✅ เติมสต็อกได้ | 🚫 ไม่มีสิทธิ์เติมสต็อก | 🚫 ไม่มีสิทธิ์เติมสต็อก |
| **จัดการข้อมูลวัสดุ (`/materials`)** | ✅ เพิ่ม/แก้ไข/ลบ/เติมสต็อก | 👁️ ดูข้อมูลสเปกได้อย่างเดียว | 🚫 **ไม่มีสิทธิ์เข้าถึง (Access Denied)** |
| **จัดการหมวดหมู่วัสดุ (`/categories`)** | ✅ เพิ่ม/แก้ไข/ลบ | 🚫 **ไม่มีสิทธิ์เข้าถึง (Access Denied)** | 🚫 **ไม่มีสิทธิ์เข้าถึง (Access Denied)** |
| **จัดการผู้ใช้งานระบบ (`/users`)** | ✅ เพิ่ม/แก้ไข/ลบ/กำหนดสิทธิ์ | 🚫 **ไม่มีสิทธิ์เข้าถึง (Access Denied)** | 🚫 **ไม่มีสิทธิ์เข้าถึง (Access Denied)** |
| **ดูประวัติการใช้งาน Audit Trail (`/history`)** | ✅ เข้าถึงได้ทั้งหมด | 🚫 **ไม่มีสิทธิ์เข้าถึง (Access Denied)** | 🚫 **ไม่มีสิทธิ์เข้าถึง (Access Denied)** |
| **รายงานสรุป 6 ด้าน (`/reports`)** | ✅ ดูและพิมพ์/Export | ✅ ดูและพิมพ์/Export | 🚫 **ไม่มีสิทธิ์เข้าถึง (Access Denied)** |

---

## ⚙️ 2. ขอบเขตด้านการทำงานของระบบ (System Modules)

### 🔐 2.1 ระบบเข้าสู่ระบบ (Authentication & Profile)
- **Login**: เข้าสู่ระบบด้วยอีเมลหรือชื่อผู้ใช้งาน (Email / Username) และรหัสผ่าน
- **บัญชีผู้ใช้สำหรับแต่ละบทบาท (Role-based Accounts)**:
  - 👑 **ผู้ดูแลระบบ (Administrator)**: `admin@rangsit.go.th` (ชื่อผู้ใช้: `admin` หรือ `somchai.j`)
  - 🛡️ **ผู้อนุมัติ (Approver)**: `approver@rangsit.go.th` (ชื่อผู้ใช้: `approver` หรือ `prayuth.m`)
  - 👤 **เจ้าหน้าที่ (Staff)**: `staff@rangsit.go.th` (ชื่อผู้ใช้: `staff` หรือ `wantana.s`)
- **การ์ดตัวช่วยกรอกอีเมล (Demo Accounts Helper)**: มีการ์ดแสดงอีเมลและบทบาทบนหน้า Login พร้อมปุ่มคลิกเพื่อกรอกอัตโนมัติ สะดวกต่อการทดสอบ
- **Logout**: ออกจากระบบและกลับสู่หน้า Login
- **เปลี่ยนรหัสผ่าน (Change Password)**: หน้าต่าง Modal ให้ผู้ใช้เปลี่ยนรหัสผ่านของตนเอง พร้อมตรวจสอบความถูกต้อง
- **ความปลอดภัย**: แยกสิทธิ์การเข้าถึงเมนูตามบทบาทของผู้ใช้ที่เข้าสู่ระบบจริง (ตัดแถบสลับสิทธิ์ทดสอบในหน้าบ้านออกเพื่อให้เหมือนระบบจริง)

### 👥 2.2 ระบบจัดการผู้ใช้งาน (User Management)
- **เพิ่มผู้ใช้งานใหม่**: กรอกชื่อ-นามสกุล, ชื่อผู้ใช้, อีเมล, เบอร์โทรศัพท์, แผนก/กองสังกัด
- **แก้ไขข้อมูลผู้ใช้**: ปรับปรุงข้อมูลส่วนตัวและแผนก
- **ลบผู้ใช้งาน**: มีระบบยืนยัน (Confirmation Modal) ก่อนลบ
- **กำหนดสิทธิ์**: เลือกสิทธิ์ 3 ระดับผ่าน Radio Card พร้อมเปิด/ปิดสิทธิ์การเข้าสู่ระบบ (Active/Inactive)

### 📦 2.3 ระบบจัดการวัสดุ (Materials & Categories Management)
- **เพิ่มข้อมูลวัสดุ**: กำหนดรหัส, ชื่อ, หมวดหมู่, หน่วยนับ, จำนวน, เกณฑ์ขั้นต่ำ, ราคาต่อหน่วย, ที่เก็บ
- **แก้ไขและลบข้อมูลวัสดุ**: อัปเดตข้อมูลและลบรายการ
- **จัดการหมวดหมู่วัสดุ**: สร้างหมวดหมู่ (เช่น สำนักงาน, ไฟฟ้า, ก่อสร้าง, ประปา, IT ฯลฯ) พร้อมเลือก Emoji Icon
- **รูปภาพและสัญลักษณ์**: เลือกไอคอน/รูปภาพตัวแทนของแต่ละวัสดุ

### 📊 2.4 ระบบสต็อก (Inventory & Stock Control)
- **แสดงจำนวนคงเหลือ**: แสดงจำนวนคงเหลือพร้อม Progress Bar ระดับความจุสต็อก
- **อัปเดตสต็อกอัตโนมัติ**:
  - เมื่ออนุมัติเบิก/ยืม -> สต็อกจะถูกตัดออกทันที
  - เมื่อบันทึกคืนอุปกรณ์ -> สต็อกจะถูกเพิ่มกลับเข้าคลังทันที
- **เติมสต็อก (Restock)**: มีปุ่มเติมสต็อกสำหรับผู้ดูแลคลัง พร้อมระบุจำนวนและเหตุผล
- **แจ้งเตือนสต็อกต่ำกว่าที่กำหนด**: แถบ Alert และ Badge แสดงเตือนเมื่อสินค้าใกล้หมดหรือหมดสต็อก

### 📝 2.5 ระบบเบิก–ยืม (Requisition & Borrow System)
- **ส่งคำขอเบิก**: สำหรับวัสดุใช้สิ้นเปลือง (ระบุจำนวน, เหตุผล)
- **ส่งคำขอยืม**: สำหรับวัสดุ/ครุภัณฑ์ที่ต้องนำส่งคืน (ระบุจำนวน, เหตุผล, วันที่ยืม, วันกำหนดคืน)
- **ระบบตรวจสอบสต็อกก่อนส่ง**: ป้องกันไม่ให้ส่งคำขอเกินจำนวนคงเหลือที่มีอยู่จริง

### ✅ 2.6 ระบบอนุมัติและไม่อนุมัติ (Approval & Rejection System)
- **สถานะคำขอ**: รออนุมัติ / อนุมัติแล้ว / กำลังยืม / คืนแล้ว / ไม่อนุมัติ / ยกเลิกแล้ว
- **พิจารณาอนุมัติ**: ตรวจสอบสเปกและตัดสต็อก
- **ไม่อนุมัติพร้อมระบุเหตุผล (Reject with Mandatory Reason)**:
  - ผู้อนุมัติสามารถเลือกเหตุผลสำเร็จรูปหรือพิมพ์ระบุเหตุผลเองได้
  - บันทึกเหตุผลลงในระบบและ Audit Trail
  - แสดงกล่องข้อความเหตุผลสีแดงแจ้งเตือนให้เจ้าหน้าที่ทราบอย่างชัดเจน
- **ยกเลิกคำขอ**: จัดการคำขอที่ผิดพลาด

### 🔄 2.7 ระบบคืนอุปกรณ์ (Return System)
- **บันทึกคืน**: แสดงรายการที่อยู่ระหว่างยืมทั้งหมด
- **ตรวจสอบจำนวนที่คืน**: บันทึกจำนวนที่ส่งคืนจริง
- **ตรวจสภาพอุปกรณ์**: บันทึกสภาพ (สมบูรณ์ / ชำรุด / สูญหาย) พร้อมข้อคิดเห็นผู้ตรวจรับ
- **ปรับปรุงสต็อก**: เพิ่มจำนวนสินค้ากลับคืนสู่คลังและปรับสถานะเป็น "คืนแล้ว"

### 📈 2.8 ระบบรายงานสรุป 6 ด้าน (Reports System)
1. **รายงานการเบิก (Requisition Report)**: สรุปรายการเบิกวัสดุสิ้นเปลืองทั้งหมด
2. **รายงานการยืม (Borrow Report)**: สรุปรายการยืมอุปกรณ์ พร้อมวันที่และกำหนดคืน
3. **รายงานการคืน (Return Report)**: สรุปประวัติการรับคืนและสภาพอุปกรณ์
4. **รายงานอุปกรณ์คงเหลือ (Stock Balance Report)**: สรุปจำนวนคงคลังและมูลค่าทรัพย์สินรวม
5. **รายงานอุปกรณ์ใกล้หมด (Low Stock Report)**: รายการที่ต้องเร่งสั่งซื้อเติมสต็อก
6. **รายงานประวัติการใช้งาน (Audit / Activity Report)**: บันทึกการกระทำทุกขั้นตอนในระบบ
- **ฟังก์ชัน Export & Print**: รองรับการสั่งพิมพ์หน้ารายงาน และส่งออกข้อมูลเป็นไฟล์ Excel / CSV

---

## 🌐 3. สถาปัตยกรรม REST API & Database Integration Layer

ระบบได้รับการสร้างทางเชื่อมต่อ API Layer ไว้อย่างสมบูรณ์แบบ รองรับทั้งการทดสอบแบบ In-Memory Server State และพร้อมสลับเชื่อมต่อกับฐานข้อมูลจริง (PostgreSQL / MySQL / SQLite ผ่าน Prisma ORM)

### 🔌 3.1 รายการ REST API Endpoints

| หมวดหมู่ | Method | Endpoint | รายละเอียด |
| :--- | :--- | :--- | :--- |
| **Authentication** | `POST` | `/api/auth/login` | เข้าสู่ระบบและรับข้อมูลผู้ใช้ |
| | `GET` | `/api/auth/me?userId={id}` | ดึงข้อมูลโปรไฟล์ผู้ใช้งาน |
| | `POST` | `/api/auth/change-password` | เปลี่ยนรหัสผ่าน |
| **ผู้ใช้งาน (Users)** | `GET` | `/api/users` | ดึงรายชื่อผู้ใช้ทั้งหมด (รองรับ filter: search, role, department) |
| | `POST` | `/api/users` | เพิ่มผู้ใช้งานใหม่ |
| | `GET` | `/api/users/:id` | ดึงข้อมูลผู้ใช้ตาม ID |
| | `PUT` | `/api/users/:id` | แก้ไขข้อมูลผู้ใช้ |
| | `DELETE` | `/api/users/:id` | ลบผู้ใช้ |
| **หมวดหมู่ (Categories)** | `GET` | `/api/categories` | ดึงรายการหมวดหมู่พร้อมจำนวนวัสดุ |
| | `POST` | `/api/categories` | เพิ่มหมวดหมู่ใหม่ |
| | `GET` | `/api/categories/:id` | ดูรายละเอียดหมวดหมู่ |
| | `PUT` | `/api/categories/:id` | แก้ไขหมวดหมู่ |
| | `DELETE` | `/api/categories/:id` | ลบหมวดหมู่ |
| **วัสดุและครุภัณฑ์ (Materials)** | `GET` | `/api/materials` | ค้นหาและดึงรายการวัสดุ (search, categoryId, status) |
| | `POST` | `/api/materials` | เพิ่มรายการวัสดุใหม่ |
| | `GET` | `/api/materials/:id` | ดูรายละเอียดวัสดุ |
| | `PUT` | `/api/materials/:id` | แก้ไขข้อมูลวัสดุ |
| | `DELETE` | `/api/materials/:id` | ลบวัสดุ |
| | `POST` | `/api/materials/:id/restock` | เติมสต็อกวัสดุ (+เพิ่มจำนวน และบันทึกประวัติ) |
| **คำขอเบิก-ยืม (Requests)** | `GET` | `/api/requests` | ดึงรายการคำขอทั้งหมด (requesterId, status, type) |
| | `POST` | `/api/requests` | สร้างคำขอเบิก/ยืมใหม่ (พร้อมตรวจสต็อก) |
| | `GET` | `/api/requests/:id` | ดูรายละเอียดคำขอ |
| | `POST` | `/api/requests/:id/approve` | อนุมัติคำขอ (ตัดสต็อกอัตโนมัติ) |
| | `POST` | `/api/requests/:id/reject` | ไม่อนุมัติคำขอ (บังคับระบุเหตุผล) |
| | `POST` | `/api/requests/:id/cancel` | ยกเลิกคำขอ |
| **การส่งคืน (Returns)** | `GET` | `/api/returns` | ดูประวัติการส่งคืนอุปกรณ์ทั้งหมด |
| | `POST` | `/api/returns` | บันทึกการส่งคืน (ตรวจสภาพ + คืนสต็อกเข้าคลัง) |
| **ประวัติการใช้งาน (Logs)** | `GET` | `/api/logs` | ดู Audit Trail (filter: type, module, limit) |
| | `POST` | `/api/logs` | บันทึก Activity Log |
| **แดชบอร์ด (Dashboard)** | `GET` | `/api/dashboard/stats` | สรุปสถิติภาพรวม ยอดคงคลัง คำขอรออนุมัติ และกราฟ |

### 🛠️ 3.2 การเรียกใช้งาน Type-Safe API Client ในโค้ด
สามารถ import `api` จาก `@/lib/api-client` เพื่อเรียกใช้ได้ทันที:

```typescript
import { api } from '@/lib/api-client';

// ตัวอย่างการดึงข้อมูลวัสดุ
const res = await api.materials.getAll({ status: 'มีสต็อก' });
console.log(res.data);

// ตัวอย่างการอนุมัติคำขอ
await api.requests.approve('REQ-001', { approverName: 'สมชาย ใจดี' });

// ตัวอย่างการเติมสต็อก
await api.materials.restock('MAT-001', { addQuantity: 50, reason: 'สั่งซื้อเพิ่ม' });
```

---

## 🗄️ 4. โครงสร้างฐานข้อมูล PostgreSQL (Database Schema)

ฐานข้อมูลจริงใช้ **PostgreSQL** ประกอบด้วย **13 ตาราง + 4 Enums** พร้อม Indexes (ไฟล์ SQL: `prisma/schema.sql`)

### 📋 ตาราง 13 ตาราง

| # | ตาราง | คำอธิบาย | Primary Key | Columns สำคัญ |
| :-- | :--- | :--- | :---: | :--- |
| 1 | `roles` | สิทธิ์/ระดับผู้ใช้งาน | `id SERIAL` | role_name(VARCHAR 50 UNIQUE), description, created_at |
| 2 | `departments` | หน่วยงาน | `id SERIAL` | department_name(VARCHAR 150), description, created_at, updated_at |
| 3 | `users` | ผู้ใช้งาน | `id SERIAL` | username(UNIQUE), password_hash, first_name, last_name, email(UNIQUE), phone, role_id→roles, department_id→departments, is_active |
| 4 | `categories` | หมวดหมู่วัสดุ | `id SERIAL` | category_name(VARCHAR 150 UNIQUE), description, created_at, updated_at |
| 5 | `materials` | วัสดุและครุภัณฑ์ | `id SERIAL` | material_code(UNIQUE), material_name, category_id→categories, item_type(วัสดุ/ครุภัณฑ์), unit, stock_quantity(≥0), minimum_stock(≥0), image_url, location, is_active |
| 6 | `requests` | คำขอเบิก-ยืม | `id SERIAL` | request_code(UNIQUE), user_id→users, request_type(ENUM), status(ENUM), reason, borrow_date, due_date |
| 7 | `request_items` | รายการวัสดุในคำขอ | `id SERIAL` | request_id→requests(CASCADE), material_id→materials, quantity(>0) |
| 8 | `approvals` | ประวัติการอนุมัติ | `id SERIAL` | request_id→requests(CASCADE), approver_id→users, result(ENUM), reason, approved_at |
| 9 | `returns` | การคืนวัสดุ | `id SERIAL` | return_code(UNIQUE), request_id→requests, user_id→users, return_date, note |
| 10 | `return_items` | รายการวัสดุที่คืน | `id SERIAL` | return_id→returns(CASCADE), material_id→materials, quantity(>0), condition, note |
| 11 | `stock_movements` | ประวัติเคลื่อนไหวสต็อก | `id SERIAL` | material_id→materials, movement_type(ENUM), quantity(>0), reference_id, note, created_by→users |
| 12 | `stock_replenishments` | การเติมสต็อก | `id SERIAL` | material_id→materials, quantity(>0), supplier, reference_no, note, added_by→users |
| 13 | `audit_logs` | ประวัติการใช้งานระบบ | `id SERIAL` | user_id→users(SET NULL), action, table_name, record_id, description, ip_address |

### 🏷️ PostgreSQL Enums (4 ชุด)

| Enum | ค่าที่เป็นไปได้ |
| :--- | :--- |
| `request_type` | `'เบิก'`, `'ยืม'` |
| `request_status` | `'รออนุมัติ'`, `'อนุมัติ'`, `'ไม่อนุมัติ'`, `'ยกเลิก'`, `'เสร็จสิ้น'` |
| `approval_result` | `'อนุมัติ'`, `'ไม่อนุมัติ'` |
| `stock_movement_type` | `'เติมสต็อก'`, `'เบิก'`, `'ยืม'`, `'คืน'`, `'ปรับปรุง'` |

### 🔗 ER Diagram (ความสัมพันธ์)

```
roles ──1:N──> users ──1:N──> requests ──1:N──> request_items ──N:1──> materials
                │                │                                        │
departments ─1:N┘                ├──1:N──> approvals                      │
                                 │                                        │
                                 └──1:N──> returns ──1:N──> return_items ─┘
                                                                          │
                                           stock_movements ──N:1──────────┘
                                           stock_replenishments ──N:1─────┘
                                           audit_logs ──N:1──> users
```

---

## 🗂️ 5. โครงสร้างไฟล์ในโปรเจกต์

```
app/
├── prisma/
│   └── schema.prisma      # Prisma Schema ครบทุก Entity & Relations
├── src/
│   ├── lib/
│   │   ├── types/
│   │   │   └── api.ts     # DTOs & Standard API Response Interfaces
│   │   ├── server/
│   │   │   └── repository.ts # Server Data Layer / Repository (พร้อมสลับไป DB จริง)
│   │   └── api-client.ts  # Type-safe API Client SDK สำหรับ Frontend
│   └── app/
│       ├── api/           # REST API Routes Handlers ทั้งหมด
│       │   ├── auth/      # Login, Me, Change Password
│       │   ├── users/     # CRUD Users
│       │   ├── categories/# CRUD Categories
│       │   ├── materials/ # CRUD Materials & Restock
│       │   ├── requests/  # CRUD Requests, Approve, Reject, Cancel
│       │   ├── returns/   # Returns & Stock restore
│       │   ├── logs/      # Activity Logs / Audit Trail
│       │   └── dashboard/ # Dashboard aggregated statistics
│       ├── components/
│       │   ├── AppLayout.tsx
│       │   ├── Header.tsx
│       │   ├── Sidebar.tsx
│       │   ├── Modal.tsx
│       │   └── StatsCard.tsx
│       ├── data/
│       │   ├── mockData.ts
│       │   └── store.ts   # Zustand Store
│       ├── login/
│       ├── requests/
│       ├── returns/
│       ├── approvals/
│       ├── inventory/
│       ├── materials/
│       ├── categories/
│       ├── users/
│       ├── history/
│       ├── reports/
│       ├── globals.css
│       ├── layout.tsx
│       └── page.tsx
```

---

## 💻 6. วิธีการติดตั้งและรันระบบ

```bash
# 1. เข้าสู่โฟลเดอร์แอป
cd app

# 2. ติดตั้ง Dependencies
npm install

# 3. รัน Development Server
npm run dev
```

เปิดเบราว์เซอร์แล้วเข้าสู่: **[http://localhost:3000](http://localhost:3000)** หรือ **[http://localhost:3000/login](http://localhost:3000/login)**

---

## 🗄️ 8. การเชื่อมต่อฐานข้อมูล PostgreSQL (Database Connection)

ระบบเชื่อมต่อกับฐานข้อมูล **PostgreSQL** ผ่าน **Prisma ORM 7** + **@prisma/adapter-pg** + **pg (node-postgres)**

### 🔌 ข้อมูลการเชื่อมต่อ (Connection Details)

| รายการ | ค่า |
| :--- | :--- |
| **Database Manager** | PostgreSQL |
| **Host name/address** | `192.168.237.4` |
| **Port** | `5434` |
| **Maintenance database** | `osrs` |
| **Username** | `osrs_user` |
| **Password** | `7YsbD2WSvDgcP64EI3rv` |
| **Connection String** | `postgresql://osrs_user:7YsbD2WSvDgcP64EI3rv@192.168.237.4:5434/osrs?schema=public` |

### 📁 ไฟล์ที่เกี่ยวข้องกับการเชื่อมต่อ

| ไฟล์ | คำอธิบาย |
| :--- | :--- |
| `.env` | เก็บ `DATABASE_URL` (PostgreSQL connection string) |
| `prisma.config.ts` | กำหนด datasource URL สำหรับ Prisma CLI (Migrate, Generate) |
| `prisma/schema.prisma` | กำหนด provider เป็น `postgresql` และโครงสร้างตาราง |
| `src/lib/prisma.ts` | Prisma Client Singleton ใช้ `@prisma/adapter-pg` + `pg` Pool |

### 🛠️ วิธีการสร้างตารางในฐานข้อมูล (Database Migration)

```bash
# 1. เข้าสู่โฟลเดอร์แอป
cd app

# 2. สร้าง Migration จาก Prisma Schema
npx prisma migrate dev --name init

# 3. หรือ Push Schema ตรงไปที่ DB (ไม่สร้าง migration file)
npx prisma db push

# 4. Generate Prisma Client
npx prisma generate

# 5. เปิด Prisma Studio ดูข้อมูลใน DB
npx prisma studio
```

### 📦 Dependencies ที่เกี่ยวข้อง

```json
{
  "@prisma/client": "^7.9.1",
  "@prisma/adapter-pg": "latest",
  "pg": "^8.23.0",
  "prisma": "^7.9.1",
  "dotenv": "latest"
}
```

### 🔍 8.1 โครงสร้าง DB จริง vs Prisma Schema (8 ก.ย. 2569)

ได้รับ SQL Schema ตัวเต็มจากผู้พัฒนา DB — ฐานข้อมูลจริงมี **13 ตาราง + 4 PostgreSQL Enums + 17 Indexes**
ไฟล์ SQL ถูกบันทึกไว้ที่: `prisma/schema.sql`

#### ⚠️ ข้อแตกต่างสำคัญ (Prisma Schema vs DB จริง)

| ประเด็น | Prisma Schema ปัจจุบัน | DB จริง (PostgreSQL) |
| :--- | :--- | :--- |
| **จำนวนตาราง** | 6 ตาราง | **13 ตาราง** |
| **Primary Key** | `String @id @default(uuid())` | `SERIAL (Integer Auto Increment)` |
| **Naming** | camelCase (`requestId`) | snake_case (`request_id`) |
| **Users** | fullName(1 field), role(String), department(String) | first_name + last_name, role_id→`roles`, department_id→`departments` |
| **Roles** | String field ใน User | **แยกตาราง** `roles` (id, role_name, description) |
| **Departments** | String field ใน User | **แยกตาราง** `departments` (id, department_name, description) |
| **Requests** | 1 request = 1 material (materialId) | 1 request → N items ผ่านตาราง `request_items` |
| **Request Type** | String field | **PostgreSQL Enum** `request_type` ('เบิก','ยืม') |
| **Request Status** | String field | **PostgreSQL Enum** `request_status` (5 ค่า) |
| **Approvals** | ฝังใน requests | **แยกตาราง** `approvals` + Enum `approval_result` |
| **Returns** | `return_records` (1 ตาราง) | **แยก 2 ตาราง**: `returns` + `return_items` |
| **Stock Tracking** | ไม่มี | **2 ตารางใหม่**: `stock_movements` + `stock_replenishments` |
| **Audit Logs** | userName, action, module, type | action, table_name, record_id (ต่างกัน) |
| **Boolean Status** | String ("ใช้งาน"/"ไม่ใช้งาน") | `BOOLEAN is_active` (true/false) |
| **CHECK Constraints** | ไม่มี | มี (stock_quantity≥0, quantity>0 ฯลฯ) |

#### 🚨 สิ่งที่ต้องดำเนินการ (TODO)

1. **ปรับ Prisma Schema** — เขียนใหม่ให้ตรงกับ 13 ตาราง + 4 Enums ของ DB จริง
2. **ปรับ API Route Handlers** — ให้ query/mutate ตรงกับโครงสร้าง DB ใหม่
3. **ปรับ Frontend Store/Types** — ให้ interface ตรงกับ response จาก DB จริง
4. **⛔ ห้ามใช้ `prisma migrate` หรือ `prisma db push`** — จะทำให้ตารางที่มีอยู่เสียหาย

---

## 📝 9. บันทึกประวัติการพัฒนา (Development Changelog)

| วันที่ | รายการที่ดำเนินการ | ผู้รับผิดชอบ |
| :--- | :--- | :--- |
| **8 ก.ย. 2569 (SQL Schema ตัวเต็ม)** | **ได้รับและบันทึก SQL Schema ตัวเต็มของ DB จริง:**<br>1. ได้รับ SQL CREATE TABLE script จากผู้พัฒนา DB — มี 13 ตาราง + 4 PostgreSQL Enums + 17 Indexes<br>2. ตารางที่ Prisma Schema ยังไม่มี: `roles`, `departments`, `request_items`, `approvals`, `return_items`, `stock_movements`, `stock_replenishments`<br>3. บันทึก SQL ไว้ที่ `prisma/schema.sql` เป็น reference<br>4. อัปเดต README.md §4 เป็นโครงสร้าง DB จริง (13 ตาราง + ER Diagram + Enums) แทน Prisma Schema เก่า<br>5. อัปเดต README.md §8.1 เปรียบเทียบข้อแตกต่าง 15 ประเด็นระหว่าง Prisma Schema ปัจจุบัน vs DB จริง | Antigravity AI Assistant |
| **8 ก.ย. 2569** | **เชื่อมต่อฐานข้อมูล PostgreSQL (Database Integration):**<br>1. เปลี่ยน Prisma datasource provider จาก `sqlite` เป็น `postgresql`<br>2. อัปเดต `.env` กำหนด `DATABASE_URL` ชี้ไป PostgreSQL Server (`192.168.237.4:5434/osrs`)<br>3. อัปเดต `prisma.config.ts` ให้รองรับ Prisma 7 (ย้าย URL จาก schema.prisma มาอยู่ใน config)<br>4. ติดตั้ง `@prisma/adapter-pg` สำหรับ Prisma 7 Driver Adapter<br>5. สร้าง Prisma Client Singleton (`src/lib/prisma.ts`) ใช้ `PrismaPg` adapter + `pg` Pool พร้อม Singleton Pattern ป้องกัน connection exhaustion<br>6. Generate Prisma Client สำเร็จ 100%<br>7. ⚠️ **หมายเหตุ**: การทดสอบเชื่อมต่อจากเครื่อง dev ได้ผลลัพธ์ ETIMEDOUT — อาจต้องตรวจสอบ Firewall หรือ Network ก่อนใช้งานจริง | Antigravity AI Assistant |
| **17 ส.ค. 2569 (ปรับปรุง UI/UX)** | **ยกระดับ UI/UX แทนที่ Browser Native Alert/Confirm ด้วย Custom Modals & Toast:**<br>1. ยกเลิกการใช้ `confirm()` popup เดิมของบราวเซอร์ แล้วแทนที่ด้วยหน้าต่าง **Custom Confirmation Modal** ที่ออกแบบสวยงาม (ไอคอนแจ้งเตือน, การ์ดแสดงรหัสคำขอ/รายการวัสดุ/จำนวน/ผู้ขอ และปุ่มสไตล์ Danger/Outline)<br>2. ยกเลิกการใช้ `alert()` ในหน้ารายงาน แล้วแทนที่ด้วย **Toast Notification System** ที่ทันสมัยและนุ่มนวล<br>3. ตรวจสอบทั่วทั้งระบบ ไม่มีการใช้ popup dialog ดิบของบราวเซอร์อีกต่อไป UI กลมกลืนสวยงามระดับพรีเมียม 100% | Antigravity AI Assistant |
| **17 ส.ค. 2569 (เพิ่มปุ่มดูข้อมูล)** | **เพิ่มฟังก์ชันและหน้าต่าง Modal "ดูข้อมูล" (Material Details Modal):**<br>1. เพิ่มปุ่มคลิก "ดูข้อมูล" (Eye Icon Button) สีน้ำเงินสวยงามในตารางคลังสินค้า (`/inventory`) และตารางจัดการวัสดุ (`/materials`) สำหรับผู้ใช้งานทุกระดับ (Admin, Approver, Staff)<br>2. สร้าง Modal แสดงรายละเอียดและสเปกวัสดุแบบครบถ้วน (ไอคอนหมวดหมู่, รหัส, ชื่อ, จำนวนคงเหลือ, เกณฑ์ขั้นต่ำแจ้งเตือน, ราคาต่อหน่วย, มูลค่ารวม, สถานที่จัดเก็บ, วันที่อัปเดตล่าสุด, และคำอธิบายสเปก)<br>3. แยกสิทธิ์ปุ่มจัดการชัดเจน: เจ้าหน้าที่และผู้อนุมัติสามารถกด "ดูข้อมูล" ได้อย่างสะดวก และแอดมินสามารถกดทั้ง "ดูข้อมูล" และ "เติมสต็อก/แก้ไข/ลบ" ได้ตามปกติ | Antigravity AI Assistant |
| **17 ส.ค. 2569 (แก้ไข Login Match Priority)** | **แก้ไขปัญหาการแย่งสิทธิ์ค้นหาผู้ใช้ (Inactive User Collision):**<br>1. ปรับระบบการค้นหาบัญชีผู้ใช้ในหน้า Login และ Server Repository ให้ค้นหาแบบ Exact Email Match และ Exact Username Match เป็นอันดับแรก<br>2. ป้องกันไม่ให้บัญชีสถานะไม่ใช้งาน (เช่น บัญชีทดสอบที่ถูกปิดการใช้งาน) แย่งสิทธิ์การล็อกอินของบัญชีหลัก (`approver@rangsit.go.th`, `admin@rangsit.go.th`, `staff@rangsit.go.th`)<br>3. ทดสอบล็อกอินครบทั้ง 3 บทบาทผ่าน 100% ราบรื่นและแม่นยำ | Antigravity AI Assistant |
| **17 ส.ค. 2569 (แก้ไข Login & Store Sync)** | **แก้ไขปัญหาการเข้าสู่ระบบและ Sync ข้อมูลผู้ใช้ใน LocalStorage:**<br>1. ปรับปรุง Store Persistence Key และ Version (`rangsit-municipality-store-v2`) เพื่อป้องกันปัญหาข้อมูลผู้ใช้เก่าที่ค้างใน LocalStorage<br>2. ปรับปรุง Logic ใน `LoginPage` ให้ค้นหาผู้ใช้งานแบบครอบคลุมทั้งจาก Active Store Users, `mockUsers` Fallback, และ Role Matching<br>3. รองรับการเข้าสู่ระบบด้วยอีเมลทางการ (`admin@rangsit.go.th`, `approver@rangsit.go.th`, `staff@rangsit.go.th`) หรือ Username สั้น ได้อย่างราบรื่น 100%<br>4. อัปเดตการแสดงผลชื่อหน่วยงานเป็น "เทศบาลนครรังสิต" ครอบคลุมทั้งระบบ | Antigravity AI Assistant |
| **17 ส.ค. 2569 (แก้ไข Bug)** | **แก้ไขปัญหา React Hook Order (Rendered fewer hooks than expected):**<br>1. จัดเรียงลำดับการเรียก Hooks (`useState`, `useToast`, `useAppStore`) ในทุกหน้า (`/users`, `/categories`, `/history`, `/approvals`, `/materials`, `/reports`) ให้อยู่ส่วนบนสุดของคอมโพเนนต์ก่อนการตรวจสอบเงื่อนไข Early Return<br>2. ปฏิบัติตามกฎ Rules of Hooks อย่างถูกต้อง 100% ป้องกันข้อผิดพลาดในการ Render ขณะสลับบทบาทหรือเข้าสู่หน้าที่ไม่มีสิทธิ์ | Antigravity AI Assistant |
| **17 ส.ค. 2569 (ช่วงดึก)** | **บังคับใช้ระบบควบคุมสิทธิ์และป้องกันการแก้ไขข้ามบทบาท (Strict RBAC):**<br>1. สร้างคอมโพเนนต์ `<AccessDenied />` ป้องกันการเข้าถึง URL ตรงในหน้าที่ไม่มีสิทธิ์<br>2. ล็อกหน้า `/users`, `/categories`, `/history` ให้เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น<br>3. ล็อกหน้า `/approvals` และ `/reports` ห้ามเจ้าหน้าที่ (Staff) เข้าถึง<br>4. ล็อกหน้า `/materials` ให้ผู้อนุมัติดูได้อย่างเดียว (ซ่อนปุ่มเพิ่ม/แก้ไข/ลบ/เติมสต็อก) และห้ามเจ้าหน้าที่เข้าถึง<br>5. ล็อกปุ่มเติมสต็อกใน `/inventory` ให้เฉพาะผู้ดูแลระบบ<br>6. ล็อกปุ่มยกเลิกคำขอใน `/requests` ให้เจ้าหน้าที่ยกเลิกได้เฉพาะคำขอของตนเองที่ยังรออนุมัติเท่านั้น<br>7. กรองเมนูใน Sidebar ให้แสดงเฉพาะรายการที่ได้รับอนุญาตตามสิทธิ์จริง | Antigravity AI Assistant |
| **17 ส.ค. 2569 (ช่วงค่ำ)** | **ปรับปรุงระบบยืนยันตัวตนด้วยอีเมลแทนการสลับบทบาท:**<br>1. ถอดปุ่มสลับบทบาทด่วน (Role Switcher) ออกจาก Sidebar, Header และ Dashboard Banner เพื่อความปลอดภัยและเป็นไปตามระบบจริง<br>2. สร้างและกำหนดอีเมลเฉพาะสำหรับแต่ละบทบาท (`admin@rangsit.go.th`, `approver@rangsit.go.th`, `staff@rangsit.go.th`)<br>3. ปรับปรุงหน้า Login ให้รองรับการค้นหาและเข้าสู่ระบบด้วย Email / Username พร้อมการ์ดกรอกอีเมลตัวอย่างแบบ 1 คลิก<br>4. อัปเดต API `/api/auth/login` และ Server Repository ให้ค้นหาผู้ใช้งานจาก Email หรือ Username ได้อย่างสมบูรณ์ | Antigravity AI Assistant |
| **17 ส.ค. 2569** | **สร้างและเตรียมพร้อม API Layer เต็มรูปแบบก่อนเชื่อมต่อ DB จริง:**<br>1. ออกแบบ Prisma Schema (`prisma/schema.prisma`) ครบทั้ง 6 โมดูลหลัก<br>2. สร้าง Server-side Repository (`src/lib/server/repository.ts`) รองรับ CRUD, อนุมัติเบิกยืมตัดสต็อก, บันทึกการคืนเพิ่มสต็อก และบันทึก Audit Logs<br>3. สร้าง REST API Route Handlers 18 endpoints ภายใต้ `src/app/api/...`<br>4. สร้าง Type-safe API Client SDK (`src/lib/api-client.ts`) สำหรับฝั่ง Frontend<br>5. ตรวจสอบ Next.js Production Build (`npm run build`) ผ่าน 100% สมบูรณ์ | Antigravity AI Assistant |
| **16 ส.ค. 2569** | พัฒนาระบบจัดการวัสดุเทศบาล UI/UX ฉบับสมบูรณ์ (แดชบอร์ด, 3 ระดับสิทธิ์, เบิก-ยืม, อนุมัติ/ไม่อนุมัติพร้อมระบุเหตุผล, คืนอุปกรณ์, สต็อก, รายงาน 6 ด้าน) | Dev Team |
