// Next.js Middleware - ตรวจสอบ JWT Token สำหรับทุก API request
// ป้องกันการเข้าถึง API โดยไม่ได้ login

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// เส้นทางที่ไม่ต้องตรวจสอบ token (Public routes)
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/login',
  '/_next',
  '/favicon.ico',
  '/logo-rangsit.png',
  '/file.svg',
  '/globe.svg',
  '/next.svg',
  '/vercel.svg',
  '/window.svg',
];

// เส้นทาง API ที่ต้องตรวจสอบ token
const API_PREFIX = '/api/';

// RBAC: กำหนดสิทธิ์การเข้าถึง API ตาม role
const ROLE_PERMISSIONS: Record<string, { methods: string[]; roles: string[] }[]> = {
  '/api/users': [
    { methods: ['GET', 'POST', 'PUT', 'DELETE'], roles: ['ผู้ดูแลระบบ'] },
  ],
  '/api/categories': [
    { methods: ['GET'], roles: ['ผู้ดูแลระบบ', 'ผู้อนุมัติ', 'เจ้าหน้าที่'] },
    { methods: ['POST', 'PUT', 'DELETE'], roles: ['ผู้ดูแลระบบ'] },
  ],
  '/api/materials': [
    { methods: ['GET'], roles: ['ผู้ดูแลระบบ', 'ผู้อนุมัติ', 'เจ้าหน้าที่'] },
    { methods: ['POST', 'PUT', 'DELETE'], roles: ['ผู้ดูแลระบบ'] },
  ],
  '/api/requests': [
    { methods: ['GET', 'POST'], roles: ['ผู้ดูแลระบบ', 'ผู้อนุมัติ', 'เจ้าหน้าที่'] },
  ],
  '/api/requests/approve': [
    { methods: ['POST'], roles: ['ผู้อนุมัติ'] },
  ],
  '/api/requests/reject': [
    { methods: ['POST'], roles: ['ผู้อนุมัติ'] },
  ],
  '/api/logs': [
    { methods: ['GET'], roles: ['ผู้ดูแลระบบ'] },
    { methods: ['POST'], roles: ['ผู้ดูแลระบบ', 'ผู้อนุมัติ', 'เจ้าหน้าที่'] },
  ],
  '/api/returns': [
    { methods: ['GET', 'POST'], roles: ['ผู้ดูแลระบบ', 'ผู้อนุมัติ', 'เจ้าหน้าที่'] },
  ],
  '/api/dashboard': [
    { methods: ['GET'], roles: ['ผู้ดูแลระบบ', 'ผู้อนุมัติ', 'เจ้าหน้าที่'] },
  ],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ข้าม public paths
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // ตรวจสอบเฉพาะ API routes
  if (pathname.startsWith(API_PREFIX)) {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต: กรุณาเข้าสู่ระบบก่อน (Missing Token)' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);

    try {
      // ตรวจสอบ JWT token structure (ไม่สามารถ verify ใน Edge Runtime ได้เต็มที่)
      // การ verify จริงทำใน API route handlers ด้วย auth.ts
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      // Decode payload (base64url)
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payloadJson = atob(payloadBase64);
      const payload = JSON.parse(payloadJson);

      if (!payload.userId || !payload.role) {
        throw new Error('Invalid token payload');
      }

      // ตรวจสอบ expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return NextResponse.json(
          { success: false, error: 'Token หมดอายุ กรุณาเข้าสู่ระบบใหม่' },
          { status: 401 }
        );
      }

      // ตรวจสอบ RBAC (Server-side Role Check)
      const method = request.method;
      const userRole = payload.role;

      // ค้นหา permission rule ที่ตรงกับ pathname
      for (const [routePattern, rules] of Object.entries(ROLE_PERMISSIONS)) {
        if (pathname.startsWith(routePattern)) {
          const matchingRule = rules.find((rule) =>
            rule.methods.includes(method)
          );
          if (matchingRule && !matchingRule.roles.includes(userRole)) {
            return NextResponse.json(
              {
                success: false,
                error: `ไม่มีสิทธิ์เข้าถึง: บทบาท "${userRole}" ไม่สามารถ ${method} ${pathname} ได้`,
              },
              { status: 403 }
            );
          }
          break;
        }
      }

      // เพิ่ม user info ลง header เพื่อให้ API routes ใช้ได้
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload.userId);
      requestHeaders.set('x-user-role', payload.role);
      requestHeaders.set('x-user-name', encodeURIComponent(payload.username || ''));

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch {
      return NextResponse.json(
        { success: false, error: 'Token ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // ตรวจสอบเฉพาะ API routes (ไม่รวม static files)
    '/api/:path*',
  ],
};
