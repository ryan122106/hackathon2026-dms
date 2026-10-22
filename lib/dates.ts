export const timezone = 'Asia/Kuala_Lumpur';
export function dayKey(date: Date | string = new Date()) { return new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(date)); }
export function formatDate(date: string | Date = new Date()) { return new Intl.DateTimeFormat('en-MY',{timeZone:timezone,day:'numeric',month:'short',year:'numeric'}).format(new Date(date)); }
export function formatTime(date: string) { return new Intl.DateTimeFormat('en-MY',{timeZone:timezone,hour:'2-digit',minute:'2-digit',hour12:true}).format(new Date(date)); }
