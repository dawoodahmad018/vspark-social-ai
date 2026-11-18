import { NextResponse, type NextRequest } from 'next/server';
import { cookieOptions, firebaseExchange, firebaseIdentity, ID_COOKIE, REFRESH_COOKIE } from '@/lib/auth/firebase';
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const token = request.cookies.get(ID_COOKIE)?.value;
  if (token) {
    try { await firebaseIdentity(token); }
    catch {
      const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
      if (refreshToken) {
        try {
          const session = await firebaseExchange('refresh', { refreshToken });
          request.cookies.set(ID_COOKIE, session.token); request.cookies.set(REFRESH_COOKIE, session.refreshToken);
          response = NextResponse.next({ request });
          response.cookies.set(ID_COOKIE, session.token, cookieOptions);
          response.cookies.set(REFRESH_COOKIE, session.refreshToken, cookieOptions);
        } catch { /* Workspace layout denies unauthenticated requests. */ }
      }
    }
  }
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
export const config = { matcher: ['/dashboard/:path*','/posts/:path*','/integrations/:path*','/settings/:path*'] };
