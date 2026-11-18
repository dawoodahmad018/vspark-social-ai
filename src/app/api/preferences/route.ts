import { requireUser } from '@/lib/auth/server';
import { bodyJson, databaseFailure, failure, sameOrigin, success } from '@/lib/http';
import { preferencesSchema } from '@/lib/validation';

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase.from('notification_preferences').select('enabled,recipient_email,lead_minutes,include_caption').eq('user_id', user.id).maybeSingle();
    if (error) throw databaseFailure(error.code);
    return success({ preferences: data ?? { enabled: false, recipient_email: user.email ?? '', lead_minutes: 0, include_caption: true } });
  } catch (error) { return failure(error); }
}
export async function PATCH(request: Request) {
  try {
    sameOrigin(request);
    const { supabase, user } = await requireUser();
    const input = preferencesSchema.parse(await bodyJson(request));
    const { data, error } = await supabase.from('notification_preferences').upsert({ ...input, user_id: user.id }).select('enabled,recipient_email,lead_minutes,include_caption').single();
    if (error) throw databaseFailure(error.code);
    return success({ preferences: data });
  } catch (error) { return failure(error); }
}
