'use client';
import { FormEvent, useState } from 'react';

export default function LoginPage(){
 const [password,setPassword]=useState(''); const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError('');const r=await fetch('/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password})});if(r.ok){location.href='/';}else{setError('Incorrect password.');setBusy(false)}}
 return <main className="login-page">
  <div className="login-bg-orb orb-one"/><div className="login-bg-orb orb-two"/>
  <section className="login-layout">
   <div className="login-intro">
    <div className="login-brand"><span className="brand-mark">B</span><div><b>BIS</b><span> ADMIN HUB</span></div></div>
    <div className="login-copy"><div className="eyebrow light">Private finance workspace</div><h1>Company finances,<br/><em>kept organized.</em></h1><p>One secure place for transactions, VAT, balances, monthly tallies and company records.</p></div>
    <div className="login-points"><span>✓ Bringing Industry Solution</span><span>✓ Bethesher</span><span>✓ Whole-company overview</span></div>
   </div>
   <form className="loginbox" onSubmit={submit}>
    <div className="loginbox-head"><div className="lock-icon">⌁</div><div><div className="login-label">ADMIN ACCESS</div><h2>Welcome back</h2><p>Enter your password to continue.</p></div></div>
    <label className="login-field"><span>Password</span><input autoFocus type="password" placeholder="Enter your password" value={password} onChange={e=>setPassword(e.target.value)} required /></label>
    {error&&<div className="error">{error}</div>}
    <button className="btn primary login-submit" disabled={busy}>{busy?'Checking…':'Enter Admin Hub'} <span>→</span></button>
    <div className="login-foot">Internal use only · Password protected</div>
   </form>
  </section>
 </main>
}