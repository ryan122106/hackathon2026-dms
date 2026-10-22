import { Sparkles, ArrowUpRight,Search,ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
export function Brand(){return <span className="brand"><span className="brand-mark"><Sparkles size={20}/></span><span>DMS <strong>NextGen</strong><small>AI</small></span></span>;}
export function Badge({children}:{children:ReactNode}){const cls=String(children).toLowerCase().replaceAll(' ','-');return <span className={`badge ${cls}`}><i/>{children}</span>;}
export function PageHeading({eyebrow,title,description,action}:{eyebrow:string,title:string,description:string,action?:ReactNode}){return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>;}
export function CreateButton(){return <Link className="button primary" href="/service-orders/new"><Sparkles size={16}/> Create Order with AI <ArrowUpRight size={16}/></Link>;}
export function SearchField({value,onChange,placeholder='Search records…'}:{value:string;onChange:(s:string)=>void;placeholder?:string}){return <div className="search-field"><Search size={17}/><input aria-label={placeholder} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/></div>;}
export function Empty({title='No matching records',detail='Try a different search or filter.'}:{title?:string;detail?:string}){return <div className="empty"><Search size={28}/><h3>{title}</h3><p>{detail}</p></div>;}
export function SafetyNotice({children}:{children?:ReactNode}){return <div className="notice"><ShieldCheck size={17}/><span>{children||'AI suggests inspections, not diagnoses. You review and approve every order.'}</span></div>;}
export function Initials({name}:{name:string}){return <span className="avatar">{name.split(' ').map(n=>n[0]).slice(0,2).join('')}</span>;}
