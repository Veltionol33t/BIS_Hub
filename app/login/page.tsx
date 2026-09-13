'use client';
import { FormEvent, useState } from 'react';

export default function LoginPage(){
 const [password,setPassword]=useState(''); const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError('');const r=await fetch('/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password})});if(r.ok){location.href='/';}else{setError('Incorrect password.');setBusy(false)}}
 return <main className="login"><form className="loginbox" onSubmit={submit}><h1>Company Admin Hub</h1><p className="muted">Private internal access</p><input autoFocus type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />{error&&<div className="error">{error}</div>}<button className="btn" style={{width:'100%'}} disabled={busy}>{busy?'Checking…':'Enter Admin Hub'}</button></form></main>
}