import { dayKey } from './dates';
import type { CopilotIntent, Snapshot } from './schemas';
export type RecordCard={id:string;title:string;detail:string;href:string};
export type CopilotResult={message:string;cards:RecordCard[];viewAll?:string;draftNote?:string;mode:'GUIDED DEMO'|'LIVE MODEL'};
export const refusal='I can search fictional records and help prepare a draft for advisor review. I cannot purchase, delete, change prices, book appointments, reveal secrets or diagnose a fault. No data has changed.';
export function unsafeRequest(message:string){return /\b(ignore|disregard|override|system\s*:|developer\s*:|api\s*key|secret|password|sql|select\s+\*|drop\s+table|delete|remove\s+customer|approve|purchase|buy|change\s+(?:price|stock)|update\s+inventory|book\b|diagnos|exact\s+(?:repair\s+)?cost|repair\s+price)/i.test(message);}
export function guidedIntent(message:string,s:Snapshot,activeOrderId?:string):CopilotIntent{
 const q=message.toLowerCase(); if(unsafeRequest(message))return {kind:'help.unsupported',reason:refusal};
 const id=message.match(/SO-[A-Z0-9-]+/i)?.[0].toUpperCase();
 if(/\b(create|draft|prepare|start|new)\b/.test(q)&&/\b(order|draft|service)\b/.test(q))return {kind:'orders.prepare_draft',note:message};
 if(/\b(where|navigate|go to|open the|take me)\b/.test(q)){
  const page=/invent|parts|stock/.test(q)?'inventory':/appointment/.test(q)?'appointments':/customer/.test(q)?'customers':/order/.test(q)?'service-orders':'dashboard';return {kind:'help.navigate',page};
 }
 if(/summari[sz]e|summary|this order/.test(q))return {kind:'orders.summarize',orderId:id||activeOrderId};
 if(/low[ -]?stock|parts.*low|spare parts.*low|inventory.*low/.test(q))return {kind:'inventory.low_stock'};
 if(/appointments|scheduled today|schedule today|what.*scheduled/.test(q)){const customer=s.customers.find(c=>q.includes(c.name.toLowerCase().split(' ')[0]));return {kind:'appointments.find',date:/tomorrow/.test(q)?dayKey(new Date(Date.now()+86400000)):/today/.test(q)?dayKey():undefined,customerText:customer?.name};}
 if(/\b(order|orders|jobs)\b/.test(q)||id){
  const status=/in progress/.test(q)?'In Progress':/completed/.test(q)?'Completed':/ready/.test(q)?'Ready':/open|pending/.test(q)?'Open':undefined;
  const vehicle=s.vehicles.find(v=>q.includes(v.model.toLowerCase()))||s.vehicles.find(v=>q.includes(v.make.toLowerCase()));
  const customer=s.customers.find(c=>q.includes(c.name.toLowerCase().split(' ')[0]));
  const requested=q.match(/\bfor\s+(.+?)[?.!]*$/)?.[1]?.trim();
  const vehicleText=vehicle?(q.includes(vehicle.model.toLowerCase())?`${vehicle.make} ${vehicle.model}`:vehicle.make):(!customer?requested:undefined);
  return {kind:'orders.find',status,vehicleText,customerText:customer?.name,orderId:id};
 }
 if(/find|customer/.test(q)){
  const known=s.customers.find(c=>q.includes(c.name.toLowerCase().split(' ')[0]));
  return {kind:'customers.find',text:known?.name||message.replace(/find|customer|show|me|lookup/gi,'').trim()};
 }
 return {kind:'help.unsupported',reason:'Live AI unavailable; this demo supports the example questions shown. Try “Open service orders”, “Low-stock parts”, “Today’s appointments” or “Find Aisyah”.'};
}
export function executeRead(intent:CopilotIntent,s:Snapshot,mode:CopilotResult['mode']='GUIDED DEMO',activeOrderId?:string):CopilotResult{
 const base={cards:[] as RecordCard[],mode};const name=(id:string)=>s.customers.find(c=>c.id===id)?.name||'Unknown customer';const car=(id:string)=>{const v=s.vehicles.find(v=>v.id===id);return v?`${v.make} ${v.model} ${v.year}`:'Unknown vehicle';};
 switch(intent.kind){
 case 'help.unsupported':return {...base,message:refusal};
 case 'help.navigate':return {...base,message:'Open this workspace page to view the fictional application records.',cards:[{id:'Workspace',title:intent.page.replace('-',' '),detail:'Application navigation',href:`/${intent.page}`}]};
 case 'orders.prepare_draft':return {...base,message:'Start an editable draft. Choose the customer and vehicle, review every suggestion, then confirm the save yourself. No order has been saved.',draftNote:intent.note||''};
 case 'inventory.low_stock':{
  const parts=s.parts.filter(p=>p.stockQty<p.lowStockThreshold);return {...base,message:`${parts.length} parts are below their minimum stock threshold. Quantities below are verified application records.`,cards:parts.slice(0,5).map(p=>({id:p.sku,title:p.name,detail:`${p.stockQty} ${p.unit} in stock · minimum ${p.lowStockThreshold}`,href:`/inventory?search=${encodeURIComponent(p.sku)}`})),viewAll:'/inventory?low=1'};
 }
 case 'customers.find':{
  const matches=s.customers.filter(c=>`${c.name} ${c.id} ${c.vehicleIds.map(car).join(' ')}`.toLowerCase().includes(intent.text.toLowerCase()));return {...base,message:matches.length?`${matches.length} matching fictional customers.`:'No matching customer found. No contact details have been invented.',cards:matches.slice(0,5).map(c=>({id:c.id,title:c.name,detail:c.vehicleIds.map(car).join(' · '),href:`/customers?search=${encodeURIComponent(c.id)}`})),viewAll:'/customers'};
 }
 case 'appointments.find':{
  const matches=s.appointments.filter(a=>(!intent.date||dayKey(a.startsAt)===intent.date)&&(!intent.customerText||name(a.customerId).toLowerCase().includes(intent.customerText.toLowerCase())));return {...base,message:`${matches.length} stored appointments${intent.date?` on ${intent.date}`:''} (Asia/Kuala_Lumpur). Draft preferences are not bookings.`,cards:matches.slice(0,5).map(a=>({id:a.id,title:`${name(a.customerId)} · ${car(a.vehicleId)}`,detail:`${a.startsAt.slice(0,10)} ${a.startsAt.slice(11,16)} MYT · ${a.status} · ${a.purpose}`,href:'/appointments'})),viewAll:'/appointments'};
 }
 case 'orders.summarize':{
  const o=s.orders.find(o=>o.id===(intent.orderId||activeOrderId));if(!o)return {...base,message:'Order not found. Open an order or provide an exact stored order ID.'};
  return {...base,message:`${o.id} · ${o.status}. Customer-reported symptoms: ${o.complaints.join('; ')||'None recorded'}. Suggested inspections: ${o.inspectionTasks.join('; ')||'None recorded'}. Questions: ${o.missingInformation.join('; ')||'None recorded'}. Safety flags: ${o.safetyFlags.join('; ')||'None recorded'}. Appointment preference: ${o.appointmentPreference?`${o.appointmentPreference} — NOT BOOKED`:'None'}. No diagnosis or price is confirmed.`,cards:[{id:o.id,title:`${name(o.customerId)} · ${car(o.vehicleId)}`,detail:`${o.status} · Created ${o.createdAt.slice(0,10)}`,href:`/service-orders/${o.id}`}]};
 }
 case 'orders.find':{
  const matches=s.orders.filter(o=>(!intent.status||o.status===intent.status)&&(!intent.orderId||o.id===intent.orderId)&&(!intent.vehicleText||car(o.vehicleId).toLowerCase().includes(intent.vehicleText.toLowerCase()))&&(!intent.customerText||name(o.customerId).toLowerCase().includes(intent.customerText.toLowerCase())));
  return {...base,message:`${matches.length} matching service orders${intent.status?` with status “${intent.status}”`:''}. ${matches.length?'These are verified application records.':'No records found.'}`,cards:matches.slice(0,5).map(o=>({id:o.id,title:`${name(o.customerId)} · ${car(o.vehicleId)}`,detail:`${o.status} · ${o.complaints.join('; ')}`,href:`/service-orders/${o.id}`})),viewAll:'/service-orders'};
 }
 }
}
