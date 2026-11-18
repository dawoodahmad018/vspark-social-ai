import { z } from 'zod';
import { requireUser } from '@/lib/auth/server';
import { ApiFailure, databaseFailure, failure, sameOrigin, success } from '@/lib/http';
import { driveAdmin, googleFetch } from '@/lib/drive/server';
export async function POST(request:Request,context:{params:Promise<{id:string}>}){try{
  sameOrigin(request);const {user,supabase}=await requireUser();const id=z.uuid().parse((await context.params).id);
  const owned=await supabase.from('posts').select('*').eq('id',id).eq('user_id',user.id).maybeSingle();
  if(owned.error)throw databaseFailure(owned.error.code);
  if(!owned.data)throw new ApiFailure('NOT_FOUND','Post not found.',404);
  const post=owned.data;let fileId:string|null=post.drive_file_id;
  if(!fileId){
    const generated=await googleFetch(user.id,'https://www.googleapis.com/drive/v3/files/generateIds?count=1&space=drive');
    const result=await generated.json();if(!generated.ok||!result.ids?.[0])throw new ApiFailure('UPSTREAM_ERROR','Google could not allocate an export ID.',502,true);
    // Atomic ID reservation makes concurrent creates/retries target the SAME file.
    const reserved=await driveAdmin().from('posts').update({drive_file_id:result.ids[0]}).eq('id',id).eq('user_id',user.id).is('drive_file_id',null).select('drive_file_id').maybeSingle();
    if(reserved.error)throw databaseFailure(reserved.error.code);
    if(reserved.data)fileId=reserved.data.drive_file_id;
    else {const current=await supabase.from('posts').select('drive_file_id').eq('id',id).eq('user_id',user.id).maybeSingle();fileId=current.data?.drive_file_id;}
    if(!fileId)throw new ApiFailure('CONFLICT','Post changed or was deleted. Refresh and retry.',409);
  }
  const content=`${post.caption}\n\nPlatform: ${post.platform}\nScheduled: ${post.scheduled_at??'Unscheduled draft'}\nTimezone: ${post.timezone}\nTopic: ${post.prompt}\n`;
  const media=`https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=media&fields=id,webViewLink`;
  const update=()=>googleFetch(user.id,media,{method:'PATCH',headers:{'Content-Type':'text/plain; charset=UTF-8'},body:content});
  let response=await update();
  if(response.status===404){
    const boundary=`vspark_${crypto.randomUUID()}`;
    const metadata={id:fileId,name:`V-Spark - ${String(post.prompt).slice(0,60).replace(/[\r\n]/g,' ')}.txt`,mimeType:'text/plain'};
    const body=`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n${content}\r\n--${boundary}--`;
    response=await googleFetch(user.id,'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',{method:'POST',headers:{'Content-Type':`multipart/related; boundary=${boundary}`},body});
    if(response.status===409)response=await update();
  }
  const data=await response.json().catch(()=>null);
  if(!response.ok||data?.id!==fileId)throw new ApiFailure('UPSTREAM_ERROR','Drive sync failed. Your database post is retained. Retry sync; check Google grant/API permissions.',502,true);
  return success({file_id:fileId,web_view_link:data.webViewLink||`https://drive.google.com/file/d/${encodeURIComponent(fileId)}/view`});
}catch(error){return failure(error);}}
