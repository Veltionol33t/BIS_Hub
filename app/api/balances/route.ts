import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
export async function GET(){try{const s=supabaseServer();const {data,error}=await s.from('account_balances').select('*').order('name');if(error)throw error;return NextResponse.json(data);}catch(e){return NextResponse.json({error:String(e)},{status:500})}}