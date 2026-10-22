// Defense in depth for free-text model inputs; only fictional data belongs in this app.
export function redactModelText(value:string){
 return value
  .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[email omitted]')
  .replace(/(?<![A-Z0-9-])[A-Z]{1,3}\s?\d{3,4}(?![A-Z0-9-])/g,'[registration omitted]')
  .replace(/(?:\+?\d[\d\s()-]{7,}\d)/g,'[number omitted]')
  .replace(/\b(?:address|alamat)\s*:[^;\n]+/gi,'[address omitted]');
}
