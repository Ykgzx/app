import { NextRequest, NextResponse } from 'next/server';
import { prismaRepository } from '@/lib/server/prisma-repository';
import { ApiResponse, UpdateUserDto } from '@/lib/types/api';
import { User } from '@/app/data/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await prismaRepository.getUserById(id);

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'ไม่พบข้อมูลผู้ใช้' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<User>>({
      success: true,
      data: user,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้';
    return NextResponse.json<ApiResponse>(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as UpdateUserDto;

    const updatedUser = await prismaRepository.updateUser(id, body);
    if (!updatedUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'ไม่พบข้อมูลผู้ใช้ที่ต้องการแก้ไข' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<User>>({
      success: true,
      message: 'แก้ไขข้อมูลผู้ใช้สำเร็จ',
      data: updatedUser,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการแก้ไขผู้ใช้';
    return NextResponse.json<ApiResponse>(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ok = await prismaRepository.deleteUser(id);

    if (!ok) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'ไม่พบผู้ใช้ที่ต้องการลบ' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'ลบผู้ใช้งานสำเร็จ',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบผู้ใช้';
    return NextResponse.json<ApiResponse>(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
