import { NextRequest, NextResponse } from 'next/server';
import { prismaRepository } from '@/lib/server/prisma-repository';
import { ApiResponse, UpdateMaterialDto } from '@/lib/types/api';
import { Material } from '@/app/data/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const material = await prismaRepository.getMaterialById(id);

    if (!material) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'ไม่พบข้อมูลวัสดุ' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Material>>({
      success: true,
      data: material,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลวัสดุ';
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
    const body = (await req.json()) as UpdateMaterialDto;

    const updatedMaterial = await prismaRepository.updateMaterial(id, body);
    if (!updatedMaterial) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'ไม่พบวัสดุที่ต้องการแก้ไข' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Material>>({
      success: true,
      message: 'แก้ไขข้อมูลวัสดุสำเร็จ',
      data: updatedMaterial,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการแก้ไขวัสดุ';
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
    const ok = await prismaRepository.deleteMaterial(id);

    if (!ok) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'ไม่พบวัสดุที่ต้องการลบ' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'ลบข้อมูลวัสดุสำเร็จ',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบวัสดุ';
    return NextResponse.json<ApiResponse>(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
