import { NextRequest, NextResponse } from 'next/server';
import { prismaRepository } from '@/lib/server/prisma-repository';
import { ApiResponse, CreateActivityLogDto } from '@/lib/types/api';
import { ActivityLog } from '@/app/data/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || undefined;
    const module = searchParams.get('module') || undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;

    const logs = await prismaRepository.getActivityLogs({ type, module, limit });

    return NextResponse.json<ApiResponse<ActivityLog[]>>({
      success: true,
      data: logs,
      total: logs.length,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดึงประวัติการใช้งาน';
    return NextResponse.json<ApiResponse>(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateActivityLogDto;

    if (!body.action || !body.description || !body.userName) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'กรุณากรอกข้อมูลบันทึกให้ครบถ้วน' },
        { status: 400 }
      );
    }

    const newLog = await prismaRepository.createActivityLog(body);

    return NextResponse.json<ApiResponse<ActivityLog>>(
      {
        success: true,
        message: 'บันทึกประวัติการใช้งานสำเร็จ',
        data: newLog,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึก Log';
    return NextResponse.json<ApiResponse>(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
