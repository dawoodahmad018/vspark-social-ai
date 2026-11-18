import { requireUser } from '@/lib/auth/server';
import { ApiFailure, failure, sameOrigin, success } from '@/lib/http';
import { detectUpload, MAX_UPLOAD_BYTES } from '@/lib/uploads/validation';
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { supabase, user } = await requireUser();
    if (!request.headers.get('content-type')?.includes('multipart/form-data')) throw new ApiFailure('INVALID_INPUT', 'Send a multipart file.', 400);
    if (Number(request.headers.get('content-length')) > MAX_UPLOAD_BYTES + 65536) throw new ApiFailure('INVALID_INPUT', 'File must be at most 4 MB.', 400);
    const form = await request.formData(); const file = form.get('file');
    if (!(file instanceof File) || file.size > MAX_UPLOAD_BYTES) throw new ApiFailure('INVALID_INPUT', 'Choose a file up to 4 MB.', 400);
    const bytes = new Uint8Array(await file.arrayBuffer());
    let format;
    try { format = detectUpload(bytes, file.type); } catch { throw new ApiFailure('INVALID_INPUT', 'Only matching PNG, JPEG, WebP and PDF files up to 4 MB are allowed.', 400); }
    const path = `${user.id}/${crypto.randomUUID()}.${format.extension}`;
    const { error } = await supabase.storage.from('post-assets').upload(path, bytes, { contentType: format.type, upsert: false });
    if (error) throw new ApiFailure('UPSTREAM_ERROR', 'Upload failed. Check Firebase role provisioning and private Storage permissions, then retry.', 502, true);
    return success({ path }, 201);
  } catch (error) { return failure(error); }
}
