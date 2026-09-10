import { NextRequest, NextResponse } from 'next/server';
import { prismaRepository } from '@/lib/server/prisma-repository';
import { ApiResponse, CreateCategoryDto } from '@/lib/types/api';
import { Category } from '@/app/data/types';

export async function GET() {
  try {
    const categories = await prismaRepository.getCategories();
    return NextResponse.json<ApiResponse<Category[]>>({
      success: true,
      data: categories,
      total: categories.length,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่';
    return NextResponse.json<ApiResponse>(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateCategoryDto;

    if (!body.name) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'กรุณาระบุชื่อหมวดหมู่' },
        { status: 400 }
      );
    }

    const newCategory = await prismaRepository.createCategory(body);

    return NextResponse.json<ApiResponse<Category>>(
      {
        success: true,
        message: 'เพิ่มหมวดหมู่สำเร็จ',
        data: newCategory,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่';
    return NextResponse.json<ApiResponse>(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
