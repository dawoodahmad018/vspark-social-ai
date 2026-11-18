import { requireUser } from '@/lib/auth/server';
import { bodyJson, databaseFailure, failure, sameOrigin, success, ApiFailure } from '@/lib/http';
import { postSchema, validateSchedule } from '@/lib/validation';

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase.from('posts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100);
    if (error) throw databaseFailure(error.code);
    return success({ posts: data });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { supabase, user } = await requireUser();
    const input = postSchema.parse(await bodyJson(request));
    try { validateSchedule(input); } catch { throw new ApiFailure('INVALID_INPUT', 'Choose a future schedule time.', 400); }
    if (input.attachment_path && !input.attachment_path.startsWith(`${user.id}/`)) throw new ApiFailure('FORBIDDEN', 'Invalid attachment owner.', 403);
    const { data, error } = await supabase.from('posts').insert({ ...input, user_id: user.id }).select().single();
    if (error) throw databaseFailure(error.code);
    return success({ post: data }, 201);
  } catch (error) { return failure(error); }
}
