import { NavLink, Link } from 'react-router-dom';
import { Activity, BarChart3, FolderKanban, LayoutDashboard, LogOut, MessageSquareText, Settings, Sparkles, ChevronDown } from 'lucide-react';
const items = [
 {to:'/',label:'Overview',icon:LayoutDashboard}, {to:'/projects',label:'Projects',icon:FolderKanban}, {to:'/submit',label:'Submit feedback',icon:MessageSquareText}, {to:'/my-feedback',label:'My feedback',icon:Activity}, {to:'/analytics',label:'Analytics',icon:BarChart3},
];
function initialsFor(name = ''){return name.trim().split(/\s+/).slice(0,2).map(part=>part[0]?.toUpperCase()||'').join('')||'U'}
export default function Sidebar({profile={name:'Ajith E',role:'Project member'}}){
 return <aside className="sidebar">
  <div className="brand"><div className="brand-mark"><Sparkles size={19}/></div><div><strong>ProFeed</strong><small>Project feedback</small></div></div>
  <div className="workspace-label">WORKSPACE <ChevronDown size={13}/></div>
  <nav className="nav-list">{items.map(({to,label,icon:Icon})=><NavLink end={to==='/'} key={to} to={to} className={({isActive})=>`nav-link ${isActive?'active':''}`}><Icon size={18}/><span>{label}</span>{label==='Submit feedback'&&<span className="nav-dot"/>}</NavLink>)}</nav>
  <div className="sidebar-bottom">
   <div className="upgrade-card"><div className="upgrade-icon"><Sparkles size={17}/></div><strong>Feedback that moves you forward</strong><p>Turn team insights into better outcomes.</p><NavLink to="/analytics" className="upgrade-link">Explore insights <span>↗</span></NavLink></div>
   <NavLink to="/settings" className="nav-link"><Settings size={18}/><span>Settings</span></NavLink>
   <Link to="/login" className="nav-link logout-link" aria-label="Log out" title="Log out"><LogOut size={18}/><span>Log out</span></Link>
   <NavLink to="/settings" className="profile" aria-label="Open profile settings">{profile.photoDataUrl?<img className="avatar avatar-photo" src={profile.photoDataUrl} alt=""/>:<div className="avatar avatar-purple">{initialsFor(profile.name)}</div>}<div className="profile-copy"><strong>{profile.name}</strong><small>{profile.role}</small></div><ChevronDown size={15}/></NavLink>
  </div>
 </aside>
}
