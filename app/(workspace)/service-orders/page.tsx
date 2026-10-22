'use client';
import {useEffect,useState} from 'react';
import {useDemo} from '@/components/demo-provider';
import {PageHeading,CreateButton,SearchField,SafetyNotice} from '@/components/ui';
import {OrdersTable} from '@/components/orders-table';
import {statuses} from '@/lib/schemas';
export default function Orders(){const {data}=useDemo();const [search,setSearch]=useState('');const [status,setStatus]=useState('All');useEffect(()=>{const query=new URLSearchParams(window.location.search);const s=query.get('status');if(s&&statuses.includes(s as typeof statuses[number]))setStatus(s);},[]);
 const filtered=data.orders.filter(o=>{const c=data.customers.find(c=>c.id===o.customerId)!;const v=data.vehicles.find(v=>v.id===o.vehicleId)!;return(status==='All'||o.status===status)&&`${o.id} ${c.name} ${v.make} ${v.model} ${v.plate}`.toLowerCase().includes(search.toLowerCase());});
 return <><PageHeading eyebrow="WORKSPACE / OPERATIONS" title="Service Orders" description="A clear view of every job, from intake to collection." action={<CreateButton/>}/><section className="card orders-list"><div className="tabs" role="group" aria-label="Filter order status">{['All',...statuses].map(s=><button key={s} onClick={()=>setStatus(s)} className={status===s?'selected':''}>{s==='All'?'All orders':s}<span>{data.orders.filter(o=>s==='All'||o.status===s).length}</span></button>)}</div><div className="list-toolbar"><SearchField value={search} onChange={setSearch} placeholder="Search by order, customer, vehicle or plate…"/><span className="muted">{filtered.length} orders</span></div><OrdersTable orders={filtered}/><div className="list-foot">Showing {filtered.length} of {data.orders.length} fictional service orders</div></section><SafetyNotice>Fictional sample orders and advisor-approved drafts share the same workspace. New orders are saved in this browser.</SafetyNotice></>;
}
