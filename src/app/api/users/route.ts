import { NextRequest, NextResponse } from 'next/server';
import { prismaRepository } from '@/lib/server/prisma-repository';
import { ApiResponse, CreateUserDto } from '@/lib/types/api';
import { User } from '@/app/data/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const role = searchParams.get('role') || undefined;
    const department = searchParams.get('department') || undefined;

    const users = await prismaRepository.getUsers({ search, role, department });

    return NextResponse.json<ApiResponse<User[]>>({
      success: true,
      data: users,
      total: users.length,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้';
    return NextResponse.json<ApiResponse>(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateUserDto;

    if (!body.fullName || !body.username || !body.email || !body.department || !body.role) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' },
        { status: 400 }
      );
    }

    const existing = await prismaRepository.getUserByUsername(body.username);
    if (existing) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'ชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้ว' },
        { status: 409 }
      );
    }

    const newUser = await prismaRepository.createUser(body);

    return NextResponse.json<ApiResponse<User>>(
      {
        success: true,
        message: 'เพิ่มผู้ใช้งานสำเร็จ',
        data: newUser,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการสร้างผู้ใช้';
    return NextResponse.json<ApiResponse>(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
