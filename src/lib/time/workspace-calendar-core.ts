/** All calendar keys belong to the workspace's IANA timezone; no deployment-local dates. */
export function dayKeyAt(instant:Date|string,timezone:string):string {
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date(instant))
  return ["year","month","day"].map(type=>parts.find(part=>part.type===type)!.value).join("-")
}
export function shiftDay(day:string,offset:number):string {return new Date(Date.parse(`${day}T12:00:00Z`)+offset*86400000).toISOString().slice(0,10)}
export function weekKeys(day:string):string[] {
  const weekday=new Date(`${day}T12:00:00Z`).getUTCDay()
  const monday=shiftDay(day,-((weekday+6)%7))
  return Array.from({length:7},(_,index)=>shiftDay(monday,index))
}
export function daysBetween(from:string,to:string):number {return Math.round((Date.parse(`${to}T12:00:00Z`)-Date.parse(`${from}T12:00:00Z`))/86400000)}
export function localMinute(instant:Date|string,timezone:string):number {
  const parts=new Intl.DateTimeFormat("en-GB",{timeZone:timezone,hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date(instant))
  return Number(parts.find(p=>p.type==="hour")!.value)*60+Number(parts.find(p=>p.type==="minute")!.value)
}
/** Split real completed segments at local midnight, including DST's 23/25 hour days.
 * Providers must supply non-overlapping focus intervals; overlaps are unioned as defense in depth. */
export function focusByDay(segments:{start:string;end:string}[],timezone:string,days:string[]):Record<string,number> {
  const totals:Record<string,number>=Object.fromEntries(days.map(day=>[day,0]))
  const intervals=segments.map(s=>[Date.parse(s.start),Date.parse(s.end)]).filter(([start,end])=>Number.isFinite(start)&&Number.isFinite(end)&&end>start).sort((a,b)=>a[0]-b[0])
  const merged:number[][]=[]
  for(const interval of intervals){const last=merged.at(-1);if(last&&interval[0]<=last[1])last[1]=Math.max(last[1],interval[1]);else merged.push([...interval])}
  for(const [start,end] of merged){let cursor=start;while(cursor<end){const day=dayKeyAt(new Date(cursor),timezone);let boundary=Math.min(end,cursor+27*3600000);if(dayKeyAt(new Date(boundary-1),timezone)!==day){let low=cursor,high=boundary;while(high-low>1){const mid=Math.floor((low+high)/2);if(dayKeyAt(new Date(mid),timezone)===day)low=mid;else high=mid}boundary=high}if(day in totals)totals[day]+=(boundary-cursor)/60000;cursor=boundary}}
  return Object.fromEntries(Object.entries(totals).map(([day,minutes])=>[day,Math.round(minutes)]))
}
