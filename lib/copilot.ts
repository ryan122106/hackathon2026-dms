import { dayKey } from './dates';
import type { CopilotIntent, Snapshot } from './schemas';
export type RecordCard={id:string;title:string;detail:string;href:string};
export type CopilotResult={message:string;cards:RecordCard[];viewAll?:string;draftNote?:string;notice?:string;provenance?:'AI GENERAL GUIDANCE'|'APP HELP';mode:'GUIDED DEMO'|'LIVE MODEL'|'APP GUARDRAIL'};
export const refusal='I can search fictional records and help prepare a draft for advisor review. I cannot purchase, delete, change prices, book appointments, reveal secrets or diagnose a fault. No data has changed.';
export function unsafeRequest(message:string){
 const q=message.toLowerCase();
 if(/\b(?:ignore|disregard|override)\b.{0,40}\b(?:instructions?|rules?|policy|safety|system)\b|(?:system|developer)\s*:|<\/?(?:system|developer)>|\b(?:select\s+\*|drop\s+table)\b/.test(q))return true;
 if(/\b(?:reveal|show|print|give|leak|extract)\b.{0,40}\b(?:api\s*key|secret|password|system prompt)\b/.test(q))return true;
 // Educational questions about a limitation are useful; direct or embedded action requests remain blocked.
 const action=/\b(?:buy|purchase|delete|erase|approve|book|schedule|diagnose|remove\s+(?:a\s+)?customer|change\s+(?:the\s+)?(?:price|stock)|update\s+(?:the\s+)?inventory)\b/;
 if(/\b(?:then|and then|also)\s+(?:please\s+)?(?:buy|purchase|delete|erase|approve|book|schedule|diagnose|update|change)\b/.test(q))return true;
 const educational=/^\s*(?:what|why|how|explain|tell me (?:about|why|how)|(?:can|could|would) you (?:please )?(?:explain|describe|tell me))\b/.test(q);
 if(!educational&&action.test(q))return true;
 return !educational&&/\b(?:exact\s+(?:repair\s+)?cost|repair\s+price)\b/.test(q);
}
export function guardrailReply(message:string){
 if(/ignore|override|reveal|api\s*key|secret|system\s*:/i.test(message))return 'I cannot reveal secrets or follow instructions that override the app’s safeguards. I can still help with workspace questions and service intake. No data has changed.';
 if(/buy|purchase|approve/i.test(message))return 'I cannot place or approve purchases. I can check current parts availability or show low-stock items for your review. No data has changed.';
 if(/book|schedule/i.test(message))return 'I cannot reserve an appointment. I can show the stored schedule or help capture an unconfirmed visit preference in an editable service draft. No data has changed.';
 if(/diagnos|cost|price/i.test(message))return 'I cannot confirm a fault or an exact repair price from a complaint. I can help record the symptoms and prepare questions for a qualified technician’s assessment. No data has changed.';
 return 'I cannot change or delete business records through chat. I can help find the relevant record or explain the advisor-controlled workflow. No data has changed.';
}
export function guidedIntent(message:string,s:Snapshot,activeOrderId?:string):CopilotIntent{
 const q=message.toLowerCase(); if(unsafeRequest(message))return {kind:'help.unsupported',reason:refusal};
 const id=message.match(/SO-[A-Z0-9-]+/i)?.[0].toUpperCase();
  if(/^(?:hi|hello|hey|thanks|thank you)\b|what can you|how (?:do|can) (?:i|we|you)|why (?:can|is|do)|what (?:does|is|questions)|explain|help me understand/i.test(q))return {kind:'help.converse',topic:/engine|brake|aircond|vehicle|technician/i.test(q)?'automotive':'workflow',answer:guidedConversation(message)};
 if(/\b(create|draft|prepare|start|new)\b/.test(q)&&/\b(order|draft|service)\b/.test(q))return {kind:'orders.prepare_draft',note:message};
 if(/\b(where|navigate|go to|open the|take me)\b/.test(q)){
  const page=/invent|parts|stock/.test(q)?'inventory':/appointment/.test(q)?'appointments':/customer/.test(q)?'customers':/order/.test(q)?'service-orders':'dashboard';return {kind:'help.navigate',page};
 }
 if(/summari[sz]e|summary|this order/.test(q))return {kind:'orders.summarize',orderId:id||activeOrderId};
 if(/low[ -]?stock|parts.*low|spare parts.*low|inventory.*low/.test(q))return {kind:'inventory.low_stock'};
 if(/how many.*(?:jobs|orders|appointments)|overview|needs? attention|workshop summary|daily summary/.test(q))return {kind:'workspace.summary'};
 if(/inventory|parts|filter|brake pads|spark plugs|coolant|tyres|stock/.test(q))return {kind:'inventory.find',text:q.replace(/\b(?:do|we|have|any|how|many|much|show|me|the|inventory|parts|in|stock|is|are|there|available)\b/g,'').replace(/[?!]/g,'').trim()};
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
 case 'help.converse':return {...base,message:guidedConversation(''),provenance:'APP HELP'};
 case 'workspace.summary':{
  const count=(status:string)=>s.orders.filter(o=>o.status===status).length;
  const low=s.parts.filter(p=>p.stockQty<p.lowStockThreshold).length;
  const appointments=s.appointments.filter(a=>dayKey(a.startsAt)===dayKey()&&a.status!=='Cancelled').length;
  return {...base,message:`Here’s your current fictional workshop overview:\n• ${count('Open')} Open jobs awaiting inspection\n• ${count('In Progress')} jobs In Progress\n• ${count('Ready')} Ready for collection\n• ${count('Completed')} Completed orders\n• ${appointments} appointments today (Malaysia Time)\n• ${low} parts below minimum stock\n\nOpen jobs, collection-ready vehicles and low-stock parts are useful starting points for an advisor’s review.`,cards:[{id:'Dashboard',title:'Workshop overview',detail:'Counts calculated from current app records',href:'/dashboard'}],viewAll:'/dashboard'};
 }
 case 'inventory.find':{
  const tokens=(intent.text||'').toLowerCase().replace(/[^a-z0-9 -]/g,' ').split(/\s+/).filter(Boolean).map(t=>t.endsWith('s')?t.slice(0,-1):t);
  const parts=s.parts.filter(p=>tokens.every(t=>`${p.sku} ${p.name}`.toLowerCase().includes(t)));
  return {...base,message:parts.length?`${parts.length} matching inventory items. These quantities come from the current fictional inventory.`:'No matching part was found in the current inventory. Try the part name or SKU; I won’t infer availability.',cards:parts.slice(0,5).map(p=>({id:p.sku,title:p.name,detail:`${p.stockQty} ${p.unit} in stock · minimum ${p.lowStockThreshold}`,href:`/inventory?search=${encodeURIComponent(p.sku)}`})),viewAll:'/inventory'};
 }
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

export function guidedConversation(message:string){
 if(/engine|enjin/i.test(message))return 'Ask the customer what they mean by the engine concern: does it fail to start, stall, make a noise or lose power? Ask when it began, when it occurs and whether warning lights are visible. Record their own words and leave diagnosis to a qualified technician. You can use Create Order with AI to prepare an editable intake draft.';
 if(/ready|in progress|status/i.test(message))return 'Open means awaiting inspection, In Progress means service work is underway, Ready means ready for customer collection, and Completed means the service workflow is finished. An advisor advances the status from the order detail page.';
 if(/book|appointment/i.test(message))return 'You can view the stored schedule on Appointments. A preferred visit time in a service draft is only a request, labelled NOT BOOKED. The advisor must arrange the visit separately; creating an order does not reserve a slot.';
 if(/creat|draft|order/i.test(message))return 'Choose Create Order with AI, select the customer and their vehicle, then describe the concern. Organize with AI prepares a draft. Review and edit every suggestion, tick I have reviewed this draft, and use Confirm & Save Order when it is accurate.';
 return 'Hi! I can explain the workspace, help you phrase intake questions, search orders and customers, check stock and appointments, or prepare an editable service-order draft. What would you like to work on?';
}
