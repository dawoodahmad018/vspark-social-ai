import { z } from 'zod';
import { requireUser } from '@/lib/auth/server';
import { ApiFailure, bodyJson, databaseFailure, failure, sameOrigin, success } from '@/lib/http';
import { updatePostSchema, validateSchedule } from '@/lib/validation';

type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) {
  try {
    sameOrigin(request);
    const { supabase, user } = await requireUser();
    const id = z.uuid().parse((await context.params).id);
    const { expected_updated_at, ...input } = updatePostSchema.parse(await bodyJson(request));
    try { validateSchedule(input); } catch { throw new ApiFailure('INVALID_INPUT', 'Choose a future schedule time.', 400); }
    if (input.attachment_path && !input.attachment_path.startsWith(`${user.id}/`)) throw new ApiFailure('FORBIDDEN', 'Invalid attachment owner.', 403);
    const { data, error } = await supabase.from('posts').update(input).eq('id', id).eq('user_id', user.id).eq('updated_at', expected_updated_at).select().maybeSingle();
    if (error) throw databaseFailure(error.code);
    if (!data) throw new ApiFailure('CONFLICT', 'The post changed or no longer exists. Refresh before editing.', 409);
    return success({ post: data });
  } catch (error) { return failure(error); }
}
export async function DELETE(request: Request, context: Context) {
  try {
    sameOrigin(request);
    const { supabase, user } = await requireUser();
    const id = z.uuid().parse((await context.params).id);
    const { data, error } = await supabase.from('posts').delete().eq('id', id).eq('user_id', user.id).select('id').maybeSingle();
    if (error) throw databaseFailure(error.code);
    if (!data) throw new ApiFailure('NOT_FOUND', 'Post not found.', 404);
    return success({ deleted: true });
  } catch (error) { return failure(error); }
}
