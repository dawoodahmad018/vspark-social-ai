import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createHash, randomBytes } from 'node:crypto';
import { requireUser } from '@/lib/auth/server';
import { failure } from '@/lib/http';
import { connection, driveConfig, DRIVE_SCOPE, STATE_COOKIE } from '@/lib/drive/server';
import { seal } from '@/lib/drive/crypto';
import { cookieOptions } from '@/lib/auth/firebase';
export async function GET(){try{
  const {user}=await requireUser();const cfg=driveConfig();
  await connection(user.id,'read'); // Fail before consent if private token RPC is absent.
  const state=randomBytes(32).toString('base64url'),verifier=randomBytes(32).toString('base64url');
  (await cookies()).set(STATE_COOKIE,seal({state,verifier,uid:user.id,expires:Date.now()+600000},cfg.encryption),{...cookieOptions,maxAge:600});
  const url=new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search=new URLSearchParams({client_id:cfg.clientId,redirect_uri:cfg.redirect,response_type:'code',scope:DRIVE_SCOPE,access_type:'offline',prompt:'consent',state,code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256'}).toString();
  return NextResponse.redirect(url);
}catch(error){return failure(error);}}
