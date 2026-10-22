'use client';
import Link from 'next/link';
import {ArrowUpRight} from 'lucide-react';
import {useDemo} from './demo-provider';
import {Badge,Initials,Empty} from './ui';
import {formatDate} from '@/lib/dates';
import type {ServiceOrder} from '@/lib/schemas';
export function OrdersTable({orders,compact=false}:{orders:ServiceOrder[];compact?:boolean}){const {data}=useDemo();if(!orders.length)return <Empty/>;return <div className="orders-table"><div className={`order-row table-head ${compact?'compact':''}`}><span>ORDER ID</span><span>CUSTOMER</span><span>VEHICLE</span><span>REPORTED CONCERN</span>{!compact&&<span>CREATED</span>}<span>STATUS</span><span/></div>{orders.map(o=>{const c=data.customers.find(c=>c.id===o.customerId)!;const v=data.vehicles.find(v=>v.id===o.vehicleId)!;return <Link className={`order-row ${compact?'compact':''}`} key={o.id} href={`/service-orders/${o.id}`}><span className="order-id">{o.id}</span><span className="customer-cell"><Initials name={c.name}/>{c.name}</span><span className="vehicle-cell"><strong>{v.make} {v.model}</strong><small>{v.plate}</small></span><span className="concern-cell">{o.complaints[0]||'No symptoms recorded'}</span>{!compact&&<span className="date-cell">{formatDate(o.createdAt)}</span>}<span><Badge>{o.status}</Badge></span><span className="row-arrow"><ArrowUpRight size={16}/></span></Link>;})}</div>;}
