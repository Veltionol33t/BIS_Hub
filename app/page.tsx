'use client';

import { useEffect, useMemo, useState } from 'react';

type BU={id:string;name:string;code:string;kind:string};
type Account={id:string;name:string;type:string;business_unit_id:string|null;is_personal:boolean;opening_balance:number;currency:string;description?:string|null;is_active:boolean};
type Cat={id:string;name:string;type:string;description?:string|null;is_active:boolean};
type Tx=any;

const money=(n:number)=>'₱'+Number(n||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
const empty={transaction_date:new Date().toISOString().slice(0,10),type:'expense',amount:'',category_id:'',account_id:'',description:'',counterparty:'',reference_number:'',project_name:'',notes:'',business_unit_id:'',is_personal:false,tax_type:'none',tax_inclusive:true};

export default function Hub(){
 const [page,setPage]=useState('dashboard');
 const [bus,setBus]=useState<BU[]>([]),[accounts,setAccounts]=useState<Account[]>([]),[categories,setCategories]=useState<Cat[]>([]);
 const [workspace,setWorkspace]=useState('whole'),[tx,setTx]=useState<Tx[]>([]),[summary,setSummary]=useState<any>({}),[balances,setBalances]=useState<any[]>([]);
 const [q,setQ]=useState(''),[type,setType]=useState(''),[month,setMonth]=useState(''),[category,setCategory]=useState(''),[account,setAccount]=useState('');
 const [modal,setModal]=useState<'transaction'|'account'|'category'|null>(null),[editing,setEditing]=useState<string|null>(null);
 const [form,setForm]=useState<any>(empty),[metaForm,setMetaForm]=useState({name:'',type:'expense',description:'',business_unit_id:'',is_personal:false,opening_balance:'0',currency:'PHP'});
 const [error,setError]=useState(''),[saving,setSaving]=useState(false),[loading,setLoading]=useState(true);

 const workspaceQuery=workspace==='personal'?'&personal=true':workspace==='whole'?'&personal=false':`&business_unit_id=${workspace}&personal=false`;
 const summaryQuery=workspace==='personal'?'personal=true':`business_unit_id=${workspace}`;
 const load=async()=>{
   setLoading(true);
   try{
     const m=await fetch('/api/meta').then(r=>r.json());
     setBus(m.businessUnits||[]);setAccounts(m.accounts||[]);setCategories(m.categories||[]);
     const [t,s,b]=await Promise.all([
       fetch(`/api/transactions?q=${encodeURIComponent(q)}${workspaceQuery}`).then(r=>r.json()),
       fetch(`/api/summary?${summaryQuery}`).then(r=>r.json()),
       fetch('/api/balances').then(r=>r.json())
     ]);
     setTx(Array.isArray(t)?t:[]);setSummary(s||{});setBalances(Array.isArray(b)?b:[]);
   }catch{setError('Could not load data. Check Supabase/Vercel settings.')}
   finally{setLoading(false)}
 };
 useEffect(()=>{load()},[workspace,q]);

 const selected=bus.find(x=>x.id===workspace);
 const title=workspace==='whole'?'Whole / All Companies':workspace==='personal'?'Personal / Other':selected?.name||'Company Admin Hub';
 const companyButtons=bus.filter(x=>x.kind==='company');
 const filtered=useMemo(()=>tx.filter(x=>(!type||x.type===type)&&(!month||x.transaction_date?.startsWith(month))&&(!category||x.category_id===category)&&(!account||x.account_id===account)),[tx,type,month,category,account]);

 function openTx(x?:Tx){
   setError('');setEditing(x?.id||null);
   setForm(x?{transaction_date:x.transaction_date,type:x.type,amount:String(x.amount),category_id:x.category_id||'',account_id:x.account_id||'',description:x.description||'',counterparty:x.counterparty||'',reference_number:x.reference_number||'',project_name:x.project_name||'',notes:x.notes||'',business_unit_id:x.business_unit_id||'',is_personal:!!x.is_personal,tax_type:x.tax_type||'none',tax_inclusive:x.tax_inclusive!==false}:{...empty,business_unit_id:workspace==='whole'||workspace==='personal'?'':workspace,is_personal:workspace==='personal'});
   setModal('transaction');
 }
 async function saveTx(e:any){
   e.preventDefault();setSaving(true);setError('');
   const body={...form,amount:Number(form.amount),business_unit_id:form.business_unit_id||null,is_personal:!!form.is_personal,tax_type:form.tax_type||'none',tax_inclusive:form.tax_inclusive!==false};
   const r=await fetch(editing?`/api/transactions/${editing}`:'/api/transactions',{method:editing?'PATCH':'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
   const d=await r.json();
   if(!r.ok){setError(d.error||'Could not save transaction');setSaving(false);return}
   setModal(null);setSaving(false);load();
 }
 async function deleteTx(id:string){
   if(!confirm('Delete this transaction? The deletion will be recorded in the audit log.'))return;
   const r=await fetch(`/api/transactions/${id}`,{method:'DELETE'});
   if(!r.ok){alert((await r.json()).error||'Delete failed');return}load();
 }
 async function saveMeta(){
   if(!metaForm.name.trim()){setError('Name is required.');return}
   const kind=modal==='account'?'accounts':'categories';
   const payload=modal==='account'?metaForm:{name:metaForm.name,type:metaForm.type,description:metaForm.description};
   const r=await fetch(editing?`/api/${kind}/${editing}`:`/api/${kind}`,{method:editing?'PATCH':'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
   const d=await r.json();
   if(!r.ok){setError(d.error||'Could not save');return}
   setModal(null);setEditing(null);setError('');load();
 }
 async function deleteMeta(kind:'account'|'category',id:string){
   if(!confirm('Delete this item? If it is used by transactions, deactivate it instead.'))return;
   const r=await fetch(`/api/${kind}s/${id}`,{method:'DELETE'});
   if(!r.ok){alert((await r.json()).error||'Delete failed');return}load();
 }

 const nav=[['dashboard','Dashboard'],['transactions','Transactions'],['vat','VAT / Tax'],['accounts','Accounts'],['categories','Categories'],['balances','Balances'],['reports','Monthly Tally']];

 return <div className="shell">
  <aside className="sidebar">
   <div className="brand">BIS ADMIN HUB</div>
   <div className="nav">{nav.map(([k,l])=><button key={k} className={'navbtn '+(page===k?'active':'')} onClick={()=>setPage(k)}>{l}</button>)}</div>
   <div className="side-footer">Internal company tool<br/>Password protected</div>
  </aside>
  <main className="main">
   <div className="top">
    <div><div className="title">{page==='dashboard'?title:nav.find(x=>x[0]===page)?.[1]}</div><div className="sub">Company finance, transactions and VAT overview</div></div>
    <div className="top-actions">
     <span className="workspace-label">Workspace</span>
     <select className="workspace-select" value={workspace} onChange={e=>setWorkspace(e.target.value)}>
      <option value="whole">Whole / All Companies</option>
      {companyButtons.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
      <option value="personal">Personal / Other</option>
     </select>
     <button className="btn primary" onClick={()=>openTx()}>+ New transaction</button>
    </div>
   </div>

   {page==='dashboard'&&<>
    <div className="cards"><Card label="Income" value={summary.income} cls="positive"/><Card label="Expenses" value={summary.expenses} cls="negative"/><Card label="Net balance" value={summary.net}/><Card label="Net VAT" value={summary.net_vat}/></div>
    <section className="panel">
     <div className="panel-head"><div><div className="panel-title">Recent transactions</div><div className="sub">Latest activity for {title}</div></div><button className="btn" onClick={()=>setPage('transactions')}>View all</button></div>
     <Table rows={tx.slice(0,10)} onEdit={openTx} onDelete={deleteTx}/>{!tx.length&&<div className="empty">No transactions yet.</div>}
    </section>
    <section className="panel" style={{marginTop:18}}><div className="panel-head"><div><div className="panel-title">Monthly tally</div><div className="sub">Income, expenses and VAT by month</div></div></div><MonthlyTable rows={summary.monthly||[]}/></section>
   </>}

   {page==='transactions'&&<>
    <div className="toolbar">
     <input className="search" placeholder="Search customer, supplier, SI/OR, project, notes or description…" value={q} onChange={e=>setQ(e.target.value)}/>
     <select className="btn" value={type} onChange={e=>{setType(e.target.value);setCategory('')}}><option value="">All types</option><option value="income">Income</option><option value="expense">Expense</option></select>
     <input className="btn" type="month" value={month} onChange={e=>setMonth(e.target.value)}/>
     <select className="btn" value={category} onChange={e=>setCategory(e.target.value)}><option value="">All categories</option>{categories.filter(c=>c.is_active&&(!type||c.type===type)).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
     <select className="btn" value={account} onChange={e=>setAccount(e.target.value)}><option value="">All accounts</option>{accounts.filter(a=>a.is_active).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select>
     <button className="btn" onClick={()=>{setQ('');setType('');setMonth('');setCategory('');setAccount('')}}>Clear</button>
    </div>
    <section className="panel"><Table rows={filtered} onEdit={openTx} onDelete={deleteTx}/>{!filtered.length&&<div className="empty">No matching transactions.</div>}</section>
   </>}

   {page==='vat'&&<><div className="cards three"><Card label="Output VAT" value={summary.output_vat}/><Card label="Input VAT" value={summary.input_vat}/><Card label="Net VAT" value={summary.net_vat}/></div><section className="panel"><div className="panel-head"><div className="panel-title">VAT transactions · fixed 12%</div></div><Table rows={tx.filter(x=>x.tax_type==='vat')} onEdit={openTx} onDelete={deleteTx}/></section></>}

   {page==='accounts'&&<MetaPage title="Accounts" sub="Bank, cash, e-wallet and other payment sources." rows={accounts} kind="account" balances={balances} onNew={()=>{setEditing(null);setMetaForm({name:'',type:'bank',description:'',business_unit_id:workspace==='whole'?'':workspace,is_personal:workspace==='personal',opening_balance:'0',currency:'PHP'});setError('');setModal('account')}} onEdit={(r:any)=>{setEditing(r.id);setMetaForm({name:r.name,type:r.type,description:r.description||'',business_unit_id:r.business_unit_id||'',is_personal:!!r.is_personal,opening_balance:String(r.opening_balance||0),currency:r.currency||'PHP'});setError('');setModal('account')}} onDelete={deleteMeta}/>}

   {page==='categories'&&<MetaPage title="Categories" sub="Manage income and expense categories used by transactions." rows={categories} kind="category" balances={[]} onNew={()=>{setEditing(null);setMetaForm({name:'',type:'expense',description:'',business_unit_id:'',is_personal:false,opening_balance:'0',currency:'PHP'});setError('');setModal('category')}} onEdit={(r:any)=>{setEditing(r.id);setMetaForm({name:r.name,type:r.type,description:r.description||'',business_unit_id:'',is_personal:false,opening_balance:'0',currency:'PHP'});setError('');setModal('category')}} onDelete={deleteMeta}/>}

   {page==='balances'&&<section className="panel"><div className="panel-head"><div><div className="panel-title">Account balances</div><div className="sub">Opening balance plus income minus expenses. Personal charges still reduce the real account balance.</div></div><button className="btn" onClick={()=>setPage('accounts')}>Manage accounts</button></div><div className="balance-grid">{balances.map(b=><div className="balance-card" key={b.id}><div className="label">{b.name}</div><div className="value">{money(Number(b.current_balance))}</div><div className="sub">{b.currency} · {b.is_personal?'Personal':'Company-linked'}</div></div>)}</div></section>}

   {page==='reports'&&<section className="panel"><div className="panel-head"><div><div className="panel-title">Monthly tally · {title}</div><div className="sub">Switch Workspace above to view Bringing Industry Solution, Bethesher, Whole, or Personal / Other.</div></div></div><MonthlyTable rows={summary.monthly||[]}/></section>}

   {loading&&<div className="loading">Loading…</div>}{error&&!modal&&<div className="error">{error}</div>}
  </main>

  {modal==='transaction'&&<div className="modal"><form className="modal-card wide" onSubmit={saveTx}>
   <div className="title" style={{fontSize:20}}>{editing?'Edit transaction':'New transaction'}</div><div className="sub">VAT is calculated at a fixed 12% when VAT is selected.</div>
   <div className="form" style={{marginTop:18}}>
    <Field label="Date *"><input type="date" value={form.transaction_date} onChange={e=>setForm({...form,transaction_date:e.target.value})} required/></Field>
    <Field label="Type *"><select value={form.type} onChange={e=>setForm({...form,type:e.target.value,category_id:''})}><option value="income">Income</option><option value="expense">Expense</option></select></Field>
    <Field label="Amount *"><input type="number" step="0.01" min="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} required/></Field>
    <Field label="Category *"><select value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})} required><option value="">Select category…</option>{categories.filter(c=>c.type===form.type&&c.is_active).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
    <Field label="Account *"><select value={form.account_id} onChange={e=>setForm({...form,account_id:e.target.value})} required><option value="">Select account…</option>{accounts.filter(a=>a.is_active).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
    <Field label="Company / Business unit"><select value={form.business_unit_id||''} onChange={e=>setForm({...form,business_unit_id:e.target.value})}><option value="">Unassigned</option>{companyButtons.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
    <Field label="Customer / Supplier"><input value={form.counterparty} onChange={e=>setForm({...form,counterparty:e.target.value})}/></Field>
    <Field label="Reference / SI / OR #"><input value={form.reference_number} onChange={e=>setForm({...form,reference_number:e.target.value})}/></Field>
    <Field label="Project"><input value={form.project_name} onChange={e=>setForm({...form,project_name:e.target.value})}/></Field>
    <Field label="Description" full><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></Field>
    <Field label="VAT"><select value={form.tax_type} onChange={e=>setForm({...form,tax_type:e.target.value})}><option value="none">No VAT</option><option value="vat">VAT 12%</option></select></Field>
    <Field label="VAT treatment"><select value={String(form.tax_inclusive)} onChange={e=>setForm({...form,tax_inclusive:e.target.value==='true'})} disabled={form.tax_type!=='vat'}><option value="true">Amount includes VAT</option><option value="false">Amount excludes VAT</option></select></Field>
    <Field label="Personal expense" full><label className="check"><input type="checkbox" checked={!!form.is_personal} onChange={e=>setForm({...form,is_personal:e.target.checked})}/> Personal charge (can use a company bank account)</label></Field>
    <Field label="Notes" full><textarea rows={3} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></Field>
   </div>
   {error&&<div className="error">{error}</div>}<div className="actions"><button type="button" className="btn" onClick={()=>setModal(null)}>Cancel</button><button className="btn primary" disabled={saving}>{saving?'Saving…':editing?'Update transaction':'Save transaction'}</button></div>
  </form></div>}

  {(modal==='account'||modal==='category')&&<div className="modal"><div className="modal-card">
   <div className="title" style={{fontSize:20}}>{editing?'Edit':'New'} {modal}</div>
   <div className="form" style={{marginTop:18}}>
    <Field label="Name *"><input value={metaForm.name} onChange={e=>setMetaForm({...metaForm,name:e.target.value})}/></Field>
    <Field label="Type *"><select value={metaForm.type} onChange={e=>setMetaForm({...metaForm,type:e.target.value})}>{modal==='account'?<><option value="bank">Bank</option><option value="cash">Cash</option><option value="ewallet">E-wallet</option><option value="other">Other</option></>:<><option value="expense">Expense</option><option value="income">Income</option></>}</select></Field>
    {modal==='account'&&<><Field label="Company"><select value={metaForm.business_unit_id} onChange={e=>setMetaForm({...metaForm,business_unit_id:e.target.value})}><option value="">Unassigned</option>{companyButtons.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></Field><Field label="Opening balance"><input type="number" step="0.01" value={metaForm.opening_balance} onChange={e=>setMetaForm({...metaForm,opening_balance:e.target.value})}/></Field><Field label="Currency"><input value={metaForm.currency} onChange={e=>setMetaForm({...metaForm,currency:e.target.value.toUpperCase()})}/></Field><Field label="Personal account"><label className="check"><input type="checkbox" checked={metaForm.is_personal} onChange={e=>setMetaForm({...metaForm,is_personal:e.target.checked})}/> Personal / other</label></Field></>}
    <Field label="Description" full><input value={metaForm.description} onChange={e=>setMetaForm({...metaForm,description:e.target.value})}/></Field>
   </div>
   {error&&<div className="error">{error}</div>}<div className="actions"><button className="btn" onClick={()=>setModal(null)}>Cancel</button><button className="btn primary" onClick={saveMeta}>Save</button></div>
  </div></div>}
 </div>
}

function Card({label,value,cls}:{label:string;value:number;cls?:string}){return <div className="card"><div className="label">{label}</div><div className={'value '+(cls||'')}>{money(value)}</div></div>}
function Table({rows,onEdit,onDelete}:{rows:Tx[];onEdit:(x:Tx)=>void;onDelete:(id:string)=>void}){return <div className="table-wrap"><table className="table"><thead><tr><th>Date</th><th>Type</th><th>Customer / Supplier</th><th>Category</th><th>Account</th><th>Reference</th><th>VAT</th><th className="right">Amount</th><th></th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td>{x.transaction_date}</td><td><span className={'pill '+x.type}>{x.type}</span></td><td>{x.counterparty||'—'}</td><td>{x.categories?.name||'—'}</td><td>{x.accounts?.name||'—'}</td><td>{x.reference_number||'—'}</td><td>{x.tax_type==='vat'?money(x.tax_amount):'—'}</td><td className="right">{money(x.amount)}</td><td><button className="btn small" onClick={()=>onEdit(x)}>Edit</button> <button className="btn small danger" onClick={()=>onDelete(x.id)}>Delete</button></td></tr>)}</tbody></table></div>}
function MonthlyTable({rows}:{rows:any[]}){return <div className="table-wrap"><table className="table"><thead><tr><th>Month</th><th>Transactions</th><th>Income</th><th>Expenses</th><th>Net</th><th>Output VAT</th><th>Input VAT</th></tr></thead><tbody>{rows.map(m=><tr key={m.month}><td>{m.month}</td><td>{m.count}</td><td>{money(m.income)}</td><td>{money(m.expenses)}</td><td>{money(m.income-m.expenses)}</td><td>{money(m.output_vat)}</td><td>{money(m.input_vat)}</td></tr>)}</tbody></table></div>}
function Field({label,children,full}:{label:string;children:React.ReactNode;full?:boolean}){return <div className={'field '+(full?'full':'')}><label>{label}</label>{children}</div>}
function MetaPage({title,sub,rows,kind,balances,onNew,onEdit,onDelete}:{title:string;sub:string;rows:any[];kind:'account'|'category';balances:any[];onNew:()=>void;onEdit:(r:any)=>void;onDelete:(k:any,id:string)=>void}){return <><div className="page-title-row"><div><div className="title">{title}</div><div className="sub">{sub}</div></div><button className="btn primary" onClick={onNew}>+ New {kind}</button></div><section className="panel"><div className="table-wrap"><table className="table"><thead><tr><th>Name</th><th>Type</th>{kind==='account'&&<th>Balance</th>}<th>Company</th><th>Description</th><th>Status</th><th></th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td><b>{r.name}</b></td><td>{r.type}</td>{kind==='account'&&<td>{money(Number(balances.find(b=>b.id===r.id)?.current_balance??r.opening_balance??0))}</td>}<td>{r.business_unit_id?'Assigned':'—'}</td><td>{r.description||'—'}</td><td>{r.is_active?'Active':'Inactive'}</td><td><button className="btn small" onClick={()=>onEdit(r)}>Edit</button> <button className="btn small danger" onClick={()=>onDelete(kind,r.id)}>Delete</button></td></tr>)}</tbody></table></div></section></>}