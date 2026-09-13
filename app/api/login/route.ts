import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request){
 const expected=process.env.ADMIN_HUB_PASSWORD;
 if(!expected) return NextResponse.json({error:'Login is not configured'},{status:500});
 const body=await req.json().catch(()=>({})); const supplied=String(body.password??'');
 const a=Buffer.from(supplied); const b=Buffer.from(expected); const ok=a.length===b.length && crypto.timingSafeEqual(a,b);
 if(!ok) return NextResponse.json({error:'Unauthorized'},{status:401});
 const res=NextResponse.json({ok:true}); res.cookies.set('admin_hub_session',crypto.randomBytes(32).toString('hex'),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*12}); return res;
}