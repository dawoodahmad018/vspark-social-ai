import { z } from 'zod';

const platform = z.enum(['instagram', 'linkedin', 'x']);
const timezone = z.string().max(80).refine(value => {
  try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; }
}, 'Choose a valid IANA timezone.');
export const generationSchema = z.object({ topic: z.string().trim().min(3).max(1000), platform, tone: z.enum(['professional','friendly','bold']) }).strict();
export const postSchema = z.object({
  prompt: z.string().trim().min(3).max(1000), caption: z.string().trim().min(1).max(5000), platform,
  scheduled_at: z.iso.datetime({ offset: true }).nullable(), timezone,
  status: z.enum(['draft','scheduled','archived']), attachment_path: z.string().max(300).nullable(),
}).strict();
export const updatePostSchema = postSchema.extend({ expected_updated_at: z.iso.datetime({ offset: true }) });
export function validateSchedule(post: z.infer<typeof postSchema>) {
  if (post.status === 'scheduled' && (!post.scheduled_at || Date.parse(post.scheduled_at) <= Date.now())) {
    throw new Error('Scheduled posts need a future date and time.');
  }
}
export const preferencesSchema = z.object({ enabled: z.boolean(), recipient_email: z.email().max(254), lead_minutes: z.number().int().min(0).max(1440), include_caption: z.boolean() }).strict();
