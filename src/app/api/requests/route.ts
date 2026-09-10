import { NextRequest, NextResponse } from 'next/server';
import { prismaRepository } from '@/lib/server/prisma-repository';
import { ApiResponse, CreateRequestDto, RequestType } from '@/lib/types/api';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requesterId = searchParams.get('requesterId') || undefined;
    const status = searchParams.get('status') || undefined;
    const type = (searchParams.get('type') as RequestType) || undefined;

    const requests = await prismaRepository.getRequests({ requesterId, status, type });

    return NextResponse.json<ApiResponse<typeof requests>>({
      success: true,
      data: requests,
      total: requests.length,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลคำขอ';
    return NextResponse.json<ApiResponse>(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateRequestDto;

    if (!body.requestType || !body.materialId || !body.quantity || !body.reason || !body.requesterId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'กรุณากรอกข้อมูลคำขอให้ครบถ้วน' },
        { status: 400 }
      );
    }

    if (body.quantity <= 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'จำนวนที่ขอต้องมากกว่า 0' },
        { status: 400 }
      );
    }

    const newRequest = await prismaRepository.createRequest(body);

    return NextResponse.json<ApiResponse<typeof newRequest>>(
      {
        success: true,
        message: 'ส่งคำขอสำเร็จ',
        data: newRequest,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการส่งคำขอ';
    return NextResponse.json<ApiResponse>(
      { success: false, error: msg },
      { status: 400 }
    );
  }
}
