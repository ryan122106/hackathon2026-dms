'use client';
import { createContext,useContext,useEffect,useState,useRef,type ReactNode } from 'react';
import { createSeed } from '@/lib/seed-data';
import { stateSchema,orderSchema,statuses,type DemoState,type ServiceOrder,type OrderStatus } from '@/lib/schemas';
const key='dms-nextgen-state-v1';
type Store={data:DemoState;ready:boolean;storageWarning:string;saveOrder:(o:Omit<ServiceOrder,'id'|'status'|'createdAt'>)=>string;advanceOrder:(id:string)=>void};
const Context=createContext<Store|null>(null);
export function DemoProvider({children}:{children:ReactNode}){
 const [data,setData]=useState<DemoState>(()=>createSeed());const current=useRef(data);const [ready,setReady]=useState(false);const [storageWarning,setWarning]=useState('');
 useEffect(()=>{try{const saved=localStorage.getItem(key);if(saved){const parsed=stateSchema.safeParse(JSON.parse(saved));if(parsed.success){current.current=parsed.data;setData(parsed.data);}else setWarning('Stored demo data was invalid. Showing safe sample records.');}}catch{setWarning('Browser storage is unavailable. Saving requires browser storage.');}setReady(true);},[]);
 useEffect(()=>{const sync=(e:StorageEvent)=>{if(e.key===key&&e.newValue){try{const parsed=stateSchema.parse(JSON.parse(e.newValue));current.current=parsed;setData(parsed);}catch{setWarning('Another tab contains invalid demo data.');}}};window.addEventListener('storage',sync);return ()=>window.removeEventListener('storage',sync);},[]);
 function commit(next:DemoState){const safe=stateSchema.parse(next);try{localStorage.setItem(key,JSON.stringify(safe));}catch{throw new Error('Unable to save to browser storage. Your draft is still here; free storage or enable it and retry.');}current.current=safe;setData(safe);setWarning('');}
 function saveOrder(o:Omit<ServiceOrder,'id'|'status'|'createdAt'>){const id=`SO-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0,6).toUpperCase()}`;const record=orderSchema.parse({...o,id,status:'Open',createdAt:new Date().toISOString()});commit({...current.current,orders:[record,...current.current.orders]});return id;}
 function advanceOrder(id:string){commit({...current.current,orders:current.current.orders.map(o=>o.id===id?{...o,status:statuses[Math.min(statuses.indexOf(o.status)+1,3)] as OrderStatus}:o)});}
 return <Context.Provider value={{data,ready,storageWarning,saveOrder,advanceOrder}}>{children}</Context.Provider>;
}
export function useDemo(){const value=useContext(Context);if(!value)throw new Error('DemoProvider required');return value;}
