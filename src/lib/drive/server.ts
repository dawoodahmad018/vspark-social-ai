import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { ApiFailure } from '@/lib/http';
import { seal, unseal } from './crypto';
export const DRIVE_SCOPE='https://www.googleapis.com/auth/drive.file';
export const STATE_COOKIE='vspark_drive_state';
export interface DriveTokens { access_token: string; refresh_token?: string; expires_at: number }
export function driveConfig() {
  const clientId=process.env.GOOGLE_CLIENT_ID, clientSecret=process.env.GOOGLE_CLIENT_SECRET, redirect=process.env.GOOGLE_REDIRECT_URI, encryption=process.env.TOKEN_ENCRYPTION_KEY;
  if(!clientId||!clientSecret||!redirect||!encryption||!/^[a-f\d]{64}$/i.test(encryption)) throw new ApiFailure('NOT_CONFIGURED','Configure Google OAuth, exact callback and a 64-hex-character encryption key.',503);
  return {clientId,clientSecret,redirect,encryption};
}
export function driveAdmin() {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)throw new ApiFailure('NOT_CONFIGURED','Server-only Drive token storage is not configured.',503);
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function connection(uid:string,action:'read'|'write'|'delete',tokens?:DriveTokens) {
  const {encryption}=driveConfig();
  const {data,error}=await driveAdmin().rpc('drive_connection',{p_user_id:uid,p_action:action,p_token:tokens?seal(tokens,encryption):null,p_expires_at:tokens?new Date(tokens.expires_at).toISOString():null});
  if(error)throw new ApiFailure('NOT_CONFIGURED','Apply migration 004_drive_token_rpc.sql and check server token-storage permissions.',503);
  if(action==='read'&&data?.encrypted_token){try{return unseal<DriveTokens>(data.encrypted_token,encryption);}catch{throw new ApiFailure('UPSTREAM_ERROR','Stored Google connection cannot be decrypted. Reconnect Google Drive.',502);}}
  return null;
}
export async function exchangeGoogle(fields:Record<string,string>,previous?:DriveTokens):Promise<DriveTokens> {
  const cfg=driveConfig();let response:Response;
  try{response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({...fields,client_id:cfg.clientId,client_secret:cfg.clientSecret}),signal:AbortSignal.timeout(15000),cache:'no-store'});}
  catch{throw new ApiFailure('UPSTREAM_ERROR','Google token exchange timed out. Retry or reconnect.',502,true);}
  const data=await response.json().catch(()=>null);
  if(!response.ok||typeof data?.access_token!=='string')throw new ApiFailure('UPSTREAM_ERROR','Google authorization expired or was rejected. Reconnect Drive.',502);
  if(data.scope&&!String(data.scope).split(' ').includes(DRIVE_SCOPE))throw new ApiFailure('FORBIDDEN','Google did not grant the required drive.file scope.',403);
  return {access_token:data.access_token,refresh_token:data.refresh_token??previous?.refresh_token,expires_at:Date.now()+Math.min(Number(data.expires_in)||3600,86400)*1000};
}
export async function driveToken(uid:string,force=false){
  let tokens=await connection(uid,'read');
  if(!tokens)throw new ApiFailure('NOT_CONFIGURED','Connect your Google Drive from Integrations first.',503);
  if(force||tokens.expires_at<Date.now()+60000){
    if(!tokens.refresh_token)throw new ApiFailure('UNAUTHENTICATED','Google grant expired. Reconnect Drive.',401);
    tokens=await exchangeGoogle({grant_type:'refresh_token',refresh_token:tokens.refresh_token},tokens);
    await connection(uid,'write',tokens);
  }
  return tokens.access_token;
}
export async function googleFetch(uid:string,url:string,options:RequestInit={}){
  const send=async(force=false)=>fetch(url,{...options,headers:{...options.headers,Authorization:`Bearer ${await driveToken(uid,force)}`},cache:'no-store',signal:AbortSignal.timeout(20000)});
  try{let response=await send();if(response.status===401)response=await send(true);return response;}
  catch(error){if(error instanceof ApiFailure)throw error;throw new ApiFailure('UPSTREAM_ERROR','Google Drive timed out. Your database post is retained; retry sync.',502,true);}
}
