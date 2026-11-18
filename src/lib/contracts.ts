export const platforms = ['instagram', 'linkedin', 'x'] as const;
export type Platform = typeof platforms[number];
export type PostStatus = 'draft' | 'scheduled' | 'archived';
export type ApiCode = 'UNAUTHENTICATED' | 'FORBIDDEN' | 'INVALID_INPUT' | 'NOT_FOUND' | 'CONFLICT' | 'RATE_LIMITED' | 'NOT_CONFIGURED' | 'NOT_IMPLEMENTED' | 'UPSTREAM_ERROR' | 'INTERNAL_ERROR';
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: { code: ApiCode; message: string; retryable: boolean } };
export interface CaptionCandidate { id: string; caption: string; hashtags: string[] }
export interface GenerationInput { topic: string; platform: Platform; tone: 'professional' | 'friendly' | 'bold' }
export interface PostInput { prompt: string; caption: string; platform: Platform; scheduled_at: string | null; timezone: string; status: PostStatus; attachment_path: string | null }
export interface Post extends PostInput { id: string; user_id: string; drive_file_id: string | null; created_at: string; updated_at: string }
export type UpdatePostInput = PostInput & { expected_updated_at: string };
export interface NotificationPreferences { enabled: boolean; recipient_email: string; lead_minutes: number; include_caption: boolean }
export interface IntegrationState { configured: boolean; implemented: boolean; label: string }
export interface IntegrationStatus { auth: IntegrationState; gemini: IntegrationState; drive: IntegrationState; email: IntegrationState; uploads: IntegrationState }
