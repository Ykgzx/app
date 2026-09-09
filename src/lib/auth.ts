// Authentication Utility - JWT & Password Hashing
// ใช้สำหรับระบบจัดการวัสดุเทศบาลนครรังสิต

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Secret key สำหรับ JWT (ควรเก็บใน .env)
const JWT_SECRET = process.env.JWT_SECRET || 'rangsit-municipality-secret-key-change-in-production';
const JWT_EXPIRES_IN = '8h'; // Token หมดอายุใน 8 ชั่วโมง

// =========== Password Hashing ===========

/**
 * เข้ารหัสรหัสผ่าน (Hash)
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plainPassword, salt);
}

/**
 * ตรวจสอบรหัสผ่าน (Verify)
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

// =========== JWT Token ===========

export interface JwtPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
}

/**
 * สร้าง JWT Token
 */
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * ตรวจสอบ JWT Token
 * คืนค่า payload ถ้า token ถูกต้อง, throw error ถ้าไม่ถูกต้อง
 */
export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch {
    throw new Error('Token ไม่ถูกต้องหรือหมดอายุ');
  }
}

/**
 * ดึง Token จาก Authorization header
 * รองรับ: "Bearer <token>"
 */
export function extractTokenFromHeader(
  authHeader: string | null
): string | null {
  if (!authHeader) return null;
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}

// =========== Default Password Hashes ===========

// รหัสผ่านเริ่มต้นสำหรับบัญชีทดสอบ (hash ของ "password123")
// ใน production ให้ผู้ใช้เปลี่ยนรหัสผ่านทันที
let defaultPasswordHash: string | null = null;

export async function getDefaultPasswordHash(): Promise<string> {
  if (!defaultPasswordHash) {
    defaultPasswordHash = await hashPassword('password123');
  }
  return defaultPasswordHash;
}
