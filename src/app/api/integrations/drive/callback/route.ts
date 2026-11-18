import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { requireUser } from '@/lib/auth/server';
import { ApiFailure, failure } from '@/lib/http';
import { connection, driveConfig, exchangeGoogle, STATE_COOKIE } from '@/lib/drive/server';
import { unseal } from '@/lib/drive/crypto';
export async function GET(request:Request){try{
  const {user}=await requireUser();const cfg=driveConfig(),store=await cookies();
  const raw=store.get(STATE_COOKIE)?.value;store.delete(STATE_COOKIE);
  if(!raw)throw new ApiFailure('FORBIDDEN','Missing or expired OAuth state. Reconnect Drive.',403);
  let saved:{state:string;verifier:string;uid:string;expires:number};
  try{saved=unseal(raw,cfg.encryption);}catch{throw new ApiFailure('FORBIDDEN','Invalid OAuth state.',403);}
  const url=new URL(request.url),state=url.searchParams.get('state')||'';
  if(saved.uid!==user.id||saved.expires<Date.now()||Buffer.byteLength(state)!==Buffer.byteLength(saved.state)||!timingSafeEqual(Buffer.from(state),Buffer.from(saved.state)))throw new ApiFailure('FORBIDDEN','OAuth state did not match this user.',403);
  if(url.searchParams.has('error'))throw new ApiFailure('FORBIDDEN','Google authorization was declined. No Drive connection was saved.',403);
  const code=url.searchParams.get('code');if(!code)throw new ApiFailure('INVALID_INPUT','Missing Google authorization code.',400);
  const previous=await connection(user.id,'read');
  const tokens=await exchangeGoogle({grant_type:'authorization_code',code,redirect_uri:cfg.redirect,code_verifier:saved.verifier},previous??undefined);
  await connection(user.id,'write',tokens);
  return NextResponse.redirect(new URL('/integrations?drive=connected',process.env.NEXT_PUBLIC_APP_URL||request.url));
}catch(error){return failure(error);}}
