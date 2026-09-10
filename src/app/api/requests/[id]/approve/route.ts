import { NextRequest, NextResponse } from 'next/server';
import { prismaRepository } from '@/lib/server/prisma-repository';
import { ApiResponse, ApproveRequestDto } from '@/lib/types/api';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let body: ApproveRequestDto = {};
    try {
      body = (await req.json()) as ApproveRequestDto;
    } catch {
      // Body is optional
    }

    const approved = await prismaRepository.approveRequest(id, body.approverName, body.approverId);

    if (!approved) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'ไม่พบคำขอที่ต้องการอนุมัติ' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<typeof approved>>({
      success: true,
      message: `อนุมัติคำขอ ${approved.requestCode} เรียบร้อยแล้ว (ตัดสต็อกอัตโนมัติ)`,
      data: approved,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอนุมัติคำขอ';
    return NextResponse.json<ApiResponse>(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
