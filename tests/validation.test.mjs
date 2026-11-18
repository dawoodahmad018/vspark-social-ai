import test from 'node:test';
import assert from 'node:assert/strict';
import { generationSchema, postSchema, preferencesSchema, updatePostSchema, validateSchedule } from '../src/lib/validation.ts';

const draft = { prompt: 'A useful topic', caption: 'A real caption #ideas', platform: 'instagram', scheduled_at: null, timezone: 'Asia/Karachi', status: 'draft', attachment_path: null };
test('generation rejects invalid topic, platform and unknown inputs', () => {
  assert.equal(generationSchema.safeParse({ topic: 'AI', platform: 'instagram', tone: 'friendly' }).success, false);
  assert.equal(generationSchema.safeParse({ topic: 'Useful topic', platform: 'other', tone: 'friendly' }).success, false);
  assert.equal(generationSchema.safeParse({ topic: 'Useful topic', platform: 'x', tone: 'bold', user_id: 'spoofed' }).success, false);
  assert.equal(generationSchema.safeParse({ topic: 'Useful topic', platform: 'x', tone: 'bold' }).success, true);
});
test('post contract rejects ownership fields and invalid timezones', () => {
  assert.equal(postSchema.safeParse(draft).success, true);
  assert.equal(postSchema.safeParse({ ...draft, user_id: 'spoofed' }).success, false);
  assert.equal(postSchema.safeParse({ ...draft, drive_file_id: 'spoofed' }).success, false);
  assert.equal(postSchema.safeParse({ ...draft, timezone: 'Mars/Invalid' }).success, false);
});
test('scheduling requires a future timestamp and update needs a version', () => {
  assert.doesNotThrow(() => validateSchedule(draft));
  assert.throws(() => validateSchedule({ ...draft, status: 'scheduled' }), /future/);
  assert.throws(() => validateSchedule({ ...draft, status: 'scheduled', scheduled_at: '2000-01-01T00:00:00Z' }), /future/);
  assert.doesNotThrow(() => validateSchedule({ ...draft, status: 'scheduled', scheduled_at: new Date(Date.now()+3600000).toISOString() }));
  assert.equal(updatePostSchema.safeParse(draft).success, false);
});
test('notification preferences validate recipient and bounded lead time', () => {
  const preferences = { enabled: false, recipient_email: 'owner@example.com', lead_minutes: 30, include_caption: true };
  assert.equal(preferencesSchema.safeParse(preferences).success, true);
  assert.equal(preferencesSchema.safeParse({ ...preferences, recipient_email: 'bad' }).success, false);
  assert.equal(preferencesSchema.safeParse({ ...preferences, lead_minutes: -1 }).success, false);
  assert.equal(preferencesSchema.safeParse({ ...preferences, lead_minutes: 1441 }).success, false);
});
