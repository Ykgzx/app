import { NextRequest, NextResponse } from 'next/server';
import { prismaRepository } from '@/lib/server/prisma-repository';
import { ApiResponse, ProcessReturnDto } from '@/lib/types/api';

export async function GET() {
  try {
    const records = await prismaRepository.getReturnRecords();
    return NextResponse.json<ApiResponse<typeof records>>({
      success: true,
      data: records,
      total: records.length,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลการคืน';
    return NextResponse.json<ApiResponse>(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ProcessReturnDto;

    if (!body.requestId || !body.returnedQuantity || !body.condition) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'กรุณาระบุรหัสคำขอ จำนวนที่คืน และสภาพอุปกรณ์' },
        { status: 400 }
      );
    }

    if (body.returnedQuantity <= 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'จำนวนที่ส่งคืนต้องมากกว่า 0' },
        { status: 400 }
      );
    }

    const returnRecord = await prismaRepository.processReturn(body);

    if (!returnRecord) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'ไม่พบคำขอยืมที่ต้องการบันทึกการส่งคืน' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<typeof returnRecord>>(
      {
        success: true,
        message: 'บันทึกการส่งคืนวัสดุและปรับปรุงสต็อกสำเร็จ',
        data: returnRecord,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึกการส่งคืน';
    return NextResponse.json<ApiResponse>(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
