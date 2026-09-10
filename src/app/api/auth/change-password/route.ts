import { NextRequest, NextResponse } from 'next/server';
import { prismaRepository } from '@/lib/server/prisma-repository';
import { ApiResponse, ChangePasswordDto } from '@/lib/types/api';
import { hashPassword } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChangePasswordDto;
    const { userId, newPassword } = body;

    if (!userId || !newPassword) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'กรุณาระบุข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    const user = await prismaRepository.getUserById(userId);
    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'ไม่พบผู้ใช้ในระบบ' },
        { status: 404 }
      );
    }

    // Hash and save new password
    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await prismaRepository.createActivityLog({
      userName: user.fullName,
      action: 'เปลี่ยนรหัสผ่าน',
      description: `ผู้ใช้ ${user.fullName} ได้เปลี่ยนรหัสผ่านสำเร็จ`,
      module: 'ผู้ใช้งาน',
      type: 'แก้ไข',
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'เปลี่ยนรหัสผ่านสำเร็จ',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน';
    return NextResponse.json<ApiResponse>(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
