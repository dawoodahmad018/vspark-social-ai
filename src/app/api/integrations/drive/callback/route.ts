import { requireUser } from '@/lib/auth/server';
import { ApiFailure, failure, sameOrigin } from '@/lib/http';
async function unavailable(request: Request) {
  try {
    if (request.method !== 'GET') sameOrigin(request);
    await requireUser();
    throw new ApiFailure('NOT_IMPLEMENTED', 'This integration is not implemented yet. No external operation was performed.', 501);
  } catch (error) { return failure(error); }
}
export const GET = unavailable;
