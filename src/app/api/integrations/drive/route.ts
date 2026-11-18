import { requireUser } from '@/lib/auth/server';
import { ApiFailure, failure, sameOrigin, success } from '@/lib/http';
import { connection } from '@/lib/drive/server';
export async function GET(){try{const {user}=await requireUser();return success({connected:Boolean(await connection(user.id,'read'))});}catch(error){return failure(error);}}
export async function DELETE(request:Request){try{
  sameOrigin(request);const {user}=await requireUser();const tokens=await connection(user.id,'read');
  if(tokens){let response:Response;try{response=await fetch('https://oauth2.googleapis.com/revoke',{method:'POST',body:new URLSearchParams({token:tokens.refresh_token||tokens.access_token}),signal:AbortSignal.timeout(15000)});}catch{throw new ApiFailure('UPSTREAM_ERROR','Google revoke request failed. Retry disconnect.',502,true);}
    if(!response.ok&&response.status!==400)throw new ApiFailure('UPSTREAM_ERROR','Google could not revoke the grant. Retry.',502,true);}
  await connection(user.id,'delete');return success({disconnected:true});
}catch(error){return failure(error);}}
