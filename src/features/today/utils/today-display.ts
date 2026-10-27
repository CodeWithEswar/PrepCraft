import type { TaskType } from "../types/today.types"
export const TASK_LABELS:Record<TaskType,string>={dsa:"DSA",revision:"Revision",aptitude:"Aptitude",language:"Programming language",fundamentals:"CS fundamentals",projects:"Projects",behavioral:"Interview / Behavioral",interview:"Interview preparation",timed_practice:"Timed practice",custom:"Custom"}
export function minutesLabel(minutes:number):string {const h=Math.floor(minutes/60),m=Math.round(minutes%60);return h?`${h}h${m?` ${m}m`:""}`:`${m}m`}
export function dateLabel(day:string):string {return new Intl.DateTimeFormat("en",{weekday:"long",day:"numeric",month:"long",timeZone:"UTC"}).format(new Date(`${day}T12:00:00Z`))}
