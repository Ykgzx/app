import { NextRequest, NextResponse } from 'next/server';
import { prismaRepository } from '@/lib/server/prisma-repository';
import { ApiResponse, UpdateCategoryDto } from '@/lib/types/api';
import { Category } from '@/app/data/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const category = await prismaRepository.getCategoryById(id);

    if (!category) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'ไม่พบข้อมูลหมวดหมู่' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Category>>({
      success: true,
      data: category,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่';
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
    const body = (await req.json()) as UpdateCategoryDto;

    const updatedCategory = await prismaRepository.updateCategory(id, body);
    if (!updatedCategory) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'ไม่พบหมวดหมู่ที่ต้องการแก้ไข' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Category>>({
      success: true,
      message: 'แก้ไขข้อมูลหมวดหมู่สำเร็จ',
      data: updatedCategory,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่';
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
    const ok = await prismaRepository.deleteCategory(id);

    if (!ok) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'ไม่พบหมวดหมู่ที่ต้องการลบ' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'ลบหมวดหมู่สำเร็จ',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบหมวดหมู่';
    return NextResponse.json<ApiResponse>(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
