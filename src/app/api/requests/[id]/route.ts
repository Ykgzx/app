import { NextRequest, NextResponse } from 'next/server';
import { prismaRepository } from '@/lib/server/prisma-repository';
import { ApiResponse } from '@/lib/types/api';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const request = await prismaRepository.getRequestById(id);

    if (!request) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'ไม่พบข้อมูลคำขอ' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<typeof request>>({
      success: true,
      data: request,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลคำขอ';
    return NextResponse.json<ApiResponse>(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
