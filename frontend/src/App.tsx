import { useState, type FormEvent } from 'react'

const API = ''
type Session = { access_token:string; name:string; role:string }
type Ticket = { id:number; title:string; description:string; location:string; priority:string; status:string; created_by:number; assigned_staff:number|null }
type Staff = {id:number;name:string;email:string}
type Person = {id:number;name:string;email:string;role:string}

export default function App(){
 const [session,setSession]=useState<Session|null>(null)
 const [email,setEmail]=useState(''); const [password,setPassword]=useState('');const [name,setName]=useState('')
 const [register,setRegister]=useState(false);const [tickets,setTickets]=useState<Ticket[]>([])
 const [staff,setStaff]=useState<Staff[]>([]);const [users,setUsers]=useState<Person[]>([])
 const [message,setMessage]=useState('');const [title,setTitle]=useState('');const [description,setDescription]=useState('');const [location,setLocation]=useState('');const [priority,setPriority]=useState('medium')
 async function request(path:string,method='GET',body?:object,token=session?.access_token){
  const res=await fetch(API+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})})
  const data=await res.json().catch(()=>({}));if(!res.ok)throw Error(typeof data.detail==='string'?data.detail:JSON.stringify(data.detail||'Request failed'));return data
 }
 async function refresh(token=session?.access_token,role=session?.role){
  if(!token)return
  const t=await request('/api/requests','GET',undefined,token);setTickets(t)
  if(role==='admin'){setStaff(await request('/api/staff','GET',undefined,token));setUsers(await request('/api/users','GET',undefined,token))}
 }
 async function login(e:FormEvent){e.preventDefault();setMessage('');try{
  if(register){await request('/api/register','POST',{name,email,password});setRegister(false);setMessage('Registered! Please log in.');return}
  const data=await request('/api/login','POST',{email,password});setSession(data);setPassword('');await refresh(data.access_token,data.role)
 }catch(err){setMessage(String(err))}}
 async function act(path:string,method:string,body:object){try{await request(path,method,body);setMessage('Saved successfully');await refresh()}catch(e){setMessage(String(e))}}
 const field:React.CSSProperties={padding:11,borderRadius:8,border:'1px solid #64748b',background:'#fff',color:'#111827',width:'100%',boxSizing:'border-box'}
 const btn:React.CSSProperties={padding:'11px 17px',background:'#2563eb',color:'white',border:0,borderRadius:8,cursor:'pointer'}
 const panel:React.CSSProperties={background:'#1e293b',padding:20,borderRadius:12,margin:'16px 0'}
 return <main style={{background:'#0f172a',color:'white',minHeight:'100vh',fontFamily:'Arial,sans-serif',padding:'25px 16px'}}><div style={{maxWidth:950,margin:'auto'}}>
 <h1>RoomFix</h1><p>Maintenance Request Management System</p>
 {!session?<section style={{...panel,maxWidth:440}}><h2>{register?'Register as Resident':'Login'}</h2><form onSubmit={login} style={{display:'grid',gap:12}}>
 {register&&<input style={field} placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} required/>}
 <input style={field} type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required/>
 <input style={field} type="password" placeholder="Password (8+ characters for registration)" value={password} onChange={e=>setPassword(e.target.value)} required minLength={register?8:undefined}/>
 <button style={btn}>{register?'Create account':'Log in'}</button></form><button style={{...btn,background:'transparent',marginTop:12}} onClick={()=>{setRegister(!register);setMessage('')}}>{register?'Already have an account? Login':'Register new resident'}</button></section>
 :<><div style={panel}><h2>Welcome, {session.name}</h2><p>Role: <b>{session.role}</b></p><button style={btn} onClick={()=>{setSession(null);setTickets([]);setUsers([]);setMessage('')}}>Logout</button> <button style={btn} onClick={()=>refresh().catch(e=>setMessage(String(e)))}>Refresh</button></div>
 {session.role==='resident'&&<section style={panel}><h2>Submit Maintenance Request</h2><form style={{display:'grid',gap:10}} onSubmit={async e=>{e.preventDefault();await act('/api/requests','POST',{title,description,location,priority});setTitle('');setDescription('');setLocation('')}}><input style={field} placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} required minLength={3}/><textarea style={field} placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} required minLength={5}/><input style={field} placeholder="Location / Room number" value={location} onChange={e=>setLocation(e.target.value)} required minLength={2}/><select style={field} value={priority} onChange={e=>setPriority(e.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select><button style={btn}>Submit Request</button></form></section>}
 <section style={panel}><h2>{session.role==='admin'?'All Maintenance Requests':session.role==='maintenance_staff'?'My Assigned Requests':'My Maintenance Requests'}</h2>{tickets.length===0?<p>No requests yet.</p>:tickets.map(t=><article key={t.id} style={{border:'1px solid #475569',borderRadius:9,padding:14,margin:'12px 0'}}><h3>#{t.id} — {t.title}</h3><p>{t.description}</p><p>Location: {t.location} | Priority: {t.priority} | Status: <b>{t.status}</b></p><p>Created by user #{t.created_by} | Assigned staff: {t.assigned_staff??'None'}</p>
 {session.role==='admin'&&<div style={{display:'flex',gap:8,flexWrap:'wrap'}}><select style={{...field,width:240}} id={'staff-'+t.id} defaultValue=""><option value="">Select maintenance staff</option>{staff.map(s=><option key={s.id} value={s.id}>{s.name} (#{s.id})</option>)}</select><button style={btn} onClick={()=>{const id=(document.getElementById('staff-'+t.id) as HTMLSelectElement).value;if(id)act(`/api/requests/${t.id}/assign`,'PUT',{staff_id:Number(id)})}}>Assign</button></div>}
 {session.role==='maintenance_staff'&&['assigned','in_progress'].includes(t.status)&&<div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{(['in_progress','completed','rejected'] as const).map(s=><button key={s} style={btn} onClick={()=>act(`/api/requests/${t.id}/status`,'PUT',{status:s})}>{s.replace('_',' ')}</button>)}</div>}
 </article>)}</section>
 {session.role==='admin'&&<section style={panel}><h2>User Management</h2>{users.map(u=><div key={u.id} style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap',padding:8,borderBottom:'1px solid #334155'}}><span>{u.name} — {u.email} ({u.role})</span><select style={{...field,width:185}} value={u.role} onChange={e=>act(`/api/users/${u.id}/role`,'PUT',{role:e.target.value})}><option value="admin">Admin</option><option value="resident">Resident</option><option value="maintenance_staff">Maintenance Staff</option>{u.role==='manager'&&<option value="manager">Manager (legacy)</option>}</select></div>)}</section>}
 </>}
 {message&&<p role="alert" style={{background:'#334155',padding:14,borderRadius:8}}>{message}</p>}
 </div></main>
}
