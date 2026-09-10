import { NextRequest, NextResponse } from 'next/server';
import { prismaRepository } from '@/lib/server/prisma-repository';
import { ApiResponse, LoginResponseDto } from '@/lib/types/api';
import { generateToken, verifyPassword, getDefaultPasswordHash } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = body.username || body.email || body.identifier;
    const password = body.password;

    if (!identifier) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'กรุณาระบุอีเมลหรือชื่อผู้ใช้งาน' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'กรุณาระบุรหัสผ่าน' },
        { status: 400 }
      );
    }

    const user = await prismaRepository.getUserWithPassword(identifier);

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'อีเมล/ชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    if (user.status === 'ไม่ใช้งาน') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'บัญชีผู้ใช้นี้ถูกปิดการใช้งาน กรุณาติดต่อผู้ดูแลระบบ' },
        { status: 403 }
      );
    }

    // ตรวจสอบรหัสผ่าน
    // ถ้าผู้ใช้มี password hash ในฐานข้อมูล ให้ใช้ hash นั้น
    // ถ้าไม่มี ใช้ default password hash (password123)
    const passwordHash = user.password || await getDefaultPasswordHash();
    const isPasswordValid = await verifyPassword(password, passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'อีเมล/ชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    // สร้าง JWT Token จริง
    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    // Update last login
    await prismaRepository.updateLastLogin(user.id);

    // Log Activity
    await prismaRepository.createActivityLog({
      userName: user.fullName,
      action: 'เข้าสู่ระบบ',
      description: `${user.fullName} (${user.role}) เข้าสู่ระบบสำเร็จ`,
      module: 'ระบบ',
      type: 'เข้าสู่ระบบ',
    });

    const responseData: LoginResponseDto = {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        department: user.department,
        role: user.role as LoginResponseDto['user']['role'],
        status: user.status as LoginResponseDto['user']['status'],
        avatar: user.avatar || user.fullName.slice(0, 2),
        phone: user.phone || undefined,
      },
    };

    return NextResponse.json<ApiResponse<LoginResponseDto>>({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      data: responseData,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
    return NextResponse.json<ApiResponse>(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
