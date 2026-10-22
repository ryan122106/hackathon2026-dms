import { z } from 'zod';

export const statuses = ['Open', 'In Progress', 'Ready', 'Completed'] as const;
export const text = z.string().trim().min(1).max(400);
const items = z.array(text).max(12).transform(a => [...new Set(a)]);
export const customerSchema = z.object({ id: text, name: text, vehicleIds: z.array(text).max(8) }).strict();
export const vehicleSchema = z.object({ id: text, customerId: text, make: text, model: text, year: z.number().int().min(1980).max(2040), plate: text }).strict();
export const draftSchema = z.object({ complaints: items, inspectionTasks: items, missingInformation: items, safetyFlags: items, appointmentPreference: z.string().trim().max(300).nullable(), advisorSummary: z.string().trim().max(600) }).strict();
export const orderSchema = draftSchema.omit({ advisorSummary: true }).extend({ id: z.string().regex(/^SO-[A-Z0-9-]{4,50}$/), customerId: text, vehicleId: text, originalNote: z.string().max(1800), advisorNote: z.string().max(1800), status: z.enum(statuses), createdAt: z.iso.datetime(), origin: z.enum(['seed', 'ai-assisted']) }).strict();
export const appointmentSchema = z.object({ id: text, customerId: text, vehicleId: text, startsAt: z.iso.datetime({ offset: true }), status: z.enum(['Confirmed', 'Scheduled', 'Completed', 'Cancelled']), purpose: text }).strict();
export const partSchema = z.object({ sku: text, name: text, stockQty: z.number().int().min(0).max(100000), lowStockThreshold: z.number().int().min(0).max(100000), unit: text }).strict();
export const stateSchema = z.object({ customers: z.array(customerSchema).max(100), vehicles: z.array(vehicleSchema).max(200), orders: z.array(orderSchema).max(200), appointments: z.array(appointmentSchema).max(100), parts: z.array(partSchema).max(100) }).strict().superRefine((s, ctx) => {
  for (const collection of [s.customers.map(c=>c.id),s.vehicles.map(v=>v.id),s.orders.map(o=>o.id),s.appointments.map(a=>a.id),s.parts.map(p=>p.sku)]) if(new Set(collection).size !== collection.length) ctx.addIssue({code:'custom',message:'Duplicate record ID'});
  for(const v of s.vehicles) if(!s.customers.some(c=>c.id===v.customerId && c.vehicleIds.includes(v.id))) ctx.addIssue({code:'custom',message:'Invalid vehicle owner'});
  for(const c of s.customers) if(c.vehicleIds.some(id=>!s.vehicles.some(v=>v.id===id && v.customerId===c.id))) ctx.addIssue({code:'custom',message:'Invalid customer vehicle'});
  for(const o of [...s.orders,...s.appointments]) if(!s.vehicles.some(v=>v.id===o.vehicleId && v.customerId===o.customerId)) ctx.addIssue({code:'custom',message:'Customer/vehicle mismatch'});
});
export type DemoState = z.infer<typeof stateSchema>;
export type ServiceOrder = z.infer<typeof orderSchema>;
export type ServiceDraft = z.infer<typeof draftSchema>;
export type OrderStatus = typeof statuses[number];

// A read snapshot deliberately excludes raw notes, advisor notes and registration plates.
export const snapshotSchema = z.object({ customers: z.array(customerSchema).max(100), vehicles: z.array(vehicleSchema.omit({plate:true})).max(200), orders: z.array(orderSchema.omit({originalNote:true,advisorNote:true})).max(200), appointments: z.array(appointmentSchema).max(100), parts: z.array(partSchema).max(100) }).strict();
export type Snapshot = z.infer<typeof snapshotSchema>;
export function sanitizeSnapshot(s: DemoState): Snapshot {
  return { ...s, vehicles:s.vehicles.map(({plate: _plate,...v})=>v), orders:s.orders.map(({originalNote:_raw,advisorNote:_advisor,...o})=>o) };
}
export const intentSchema = z.discriminatedUnion('kind', [
  z.object({kind:z.literal('orders.find'),status:z.enum(statuses).optional(),vehicleText:text.optional(),customerText:text.optional(),orderId:text.optional()}).strict(),
  z.object({kind:z.literal('customers.find'),text:z.string().max(100)}).strict(),
  z.object({kind:z.literal('appointments.find'),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),customerText:text.optional()}).strict(),
  z.object({kind:z.literal('inventory.low_stock')}).strict(),
  z.object({kind:z.literal('orders.summarize'),orderId:text.optional()}).strict(),
  z.object({kind:z.literal('orders.prepare_draft'),note:z.string().max(500).optional()}).strict(),
  z.object({kind:z.literal('help.navigate'),page:z.enum(['dashboard','service-orders','customers','appointments','inventory'])}).strict(),
  z.object({kind:z.literal('help.unsupported'),reason:text}).strict()
]);
export type CopilotIntent = z.infer<typeof intentSchema>;
export const copilotRequestSchema = z.object({message:z.string().trim().min(2).max(500),activePage:z.string().max(150),activeOrderId:z.string().max(60).optional(),sanitizedSnapshot:snapshotSchema}).strict();
export const draftRequestSchema = z.object({note:z.string().trim().min(8).max(1800),vehicle:z.object({make:text,model:text}).strict()}).strict();
