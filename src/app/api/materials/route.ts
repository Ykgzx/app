import { NextRequest, NextResponse } from 'next/server';
import { prismaRepository } from '@/lib/server/prisma-repository';
import { ApiResponse, CreateMaterialDto } from '@/lib/types/api';
import { Material } from '@/app/data/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const status = searchParams.get('status') || undefined;

    const materials = await prismaRepository.getMaterials({ search, categoryId, status });

    return NextResponse.json<ApiResponse<Material[]>>({
      success: true,
      data: materials,
      total: materials.length,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลวัสดุ';
    return NextResponse.json<ApiResponse>(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateMaterialDto;

    if (!body.code || !body.name || !body.categoryId || !body.unit) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'กรุณากรอกรหัส ชื่อ หมวดหมู่ และหน่วยนับของวัสดุ' },
        { status: 400 }
      );
    }

    const newMaterial = await prismaRepository.createMaterial(body);

    return NextResponse.json<ApiResponse<Material>>(
      {
        success: true,
        message: 'เพิ่มข้อมูลวัสดุสำเร็จ',
        data: newMaterial,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลวัสดุ';
    return NextResponse.json<ApiResponse>(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
