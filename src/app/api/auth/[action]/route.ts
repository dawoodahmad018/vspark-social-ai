import { cookies } from 'next/headers';
import { z } from 'zod';
import { ApiFailure, bodyJson, failure, sameOrigin, success } from '@/lib/http';
import { cookieOptions, firebaseExchange, ID_COOKIE, REFRESH_COOKIE } from '@/lib/auth/firebase';
const credentials = z.object({ email: z.email().max(254), password: z.string().min(8).max(128) }).strict();
export async function POST(request: Request, context: { params: Promise<{ action: string }> }) {
  try {
    sameOrigin(request);
    const { action } = await context.params;
    const store = await cookies();
    if (action === 'logout') {
      store.set(ID_COOKIE, '', { ...cookieOptions, maxAge: 0 });
      store.set(REFRESH_COOKIE, '', { ...cookieOptions, maxAge: 0 });
      return success({ signedOut: true });
    }
    if (action !== 'login' && action !== 'register' && action !== 'refresh') throw new ApiFailure('INVALID_INPUT', 'Unknown authentication action.', 404);
    const input = action === 'refresh' ? { refreshToken: store.get(REFRESH_COOKIE)?.value } : credentials.parse(await bodyJson(request));
    if (action === 'refresh' && !('refreshToken' in input && input.refreshToken)) throw new ApiFailure('UNAUTHENTICATED', 'Sign in to continue.', 401);
    const session = await firebaseExchange(action, input);
    store.set(ID_COOKIE, session.token, cookieOptions); store.set(REFRESH_COOKIE, session.refreshToken, cookieOptions);
    return success({ user: session.user });
  } catch (error) { return failure(error); }
}
