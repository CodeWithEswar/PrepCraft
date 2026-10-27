export { dayKeyAt, shiftDay, weekKeys, daysBetween, localMinute, focusByDay } from "./workspace-calendar-core"

function localParts(instant:number,timezone:string) {
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date(instant))
  const value=(type:string)=>parts.find(part=>part.type===type)!.value
  return `${value("year")}-${value("month")}-${value("day")}T${value("hour")}:${value("minute")}`
}
/** A wall-clock window must identify unique real instants. DST gaps/folds are never guessed. */
export function scheduledWindow(day:string,start:string,end:string,timezone:string):{start:string;end:string} {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(start)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(end)||end<=start)throw new Error("Choose an end time after the start time on the same day.")
  const resolve=(time:string)=>{
    const wall=`${day}T${time}`,base=Date.parse(`${wall}:00Z`)
    const offsets=new Set([-86400000,0,86400000].map(delta=>{const anchor=base+delta;return Date.parse(`${localParts(anchor,timezone)}:00Z`)-anchor}))
    const candidates=[...offsets].map(offset=>base-offset).filter(candidate=>localParts(candidate,timezone)===wall)
    if(candidates.length!==1)throw new Error(candidates.length?"This time repeats because of daylight saving. Choose a time outside the repeated hour.":"This local time does not exist because of a timezone change.")
    return new Date(candidates[0]).toISOString()
  }
  const from=resolve(start),to=resolve(end)
  if(to<=from)throw new Error("The selected window is not valid in this timezone.")
  return {start:from,end:to}
}
