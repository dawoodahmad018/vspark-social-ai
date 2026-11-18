import { timingSafeEqual } from 'node:crypto';
import { ApiFailure, failure } from '@/lib/http';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return failure(new ApiFailure('NOT_CONFIGURED', 'Scheduler is not configured.', 503));
  const actual = Buffer.from(request.headers.get('authorization') ?? '');
  const expected = Buffer.from(`Bearer ${secret}`);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return failure(new ApiFailure('UNAUTHENTICATED', 'Invalid worker authorization.', 401));
  return failure(new ApiFailure('NOT_IMPLEMENTED', 'Dispatch worker is not implemented. No emails were sent.', 501));
}
