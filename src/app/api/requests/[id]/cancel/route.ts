import { NextRequest, NextResponse } from 'next/server';
import { prismaRepository } from '@/lib/server/prisma-repository';
import { ApiResponse, CancelRequestDto } from '@/lib/types/api';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let body: CancelRequestDto = {};
    try {
      body = (await req.json()) as CancelRequestDto;
    } catch {
      // Body optional
    }

    const cancelled = await prismaRepository.cancelRequest(id, body.userName, body.userId);

    if (!cancelled) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'ไม่พบคำขอที่ต้องการยกเลิก' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<typeof cancelled>>({
      success: true,
      message: `ยกเลิกคำขอ ${cancelled.requestCode} เรียบร้อยแล้ว`,
      data: cancelled,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการยกเลิกคำขอ';
    return NextResponse.json<ApiResponse>(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
