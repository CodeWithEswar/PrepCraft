import type { TodayContributions } from "../types/today.types"
import { unavailableContributions } from "./today-service"

export interface TodayDomainScope {workspaceId:string;dayKey:string;timezone:string;now:string}
export type TodayDomainPorts={ [Key in keyof TodayContributions]?: (scope:TodayDomainScope)=>Promise<TodayContributions[Key]> }
/** Independent source failures never turn an unknown value into zero or block task execution. */
export async function loadTodayContributions(ports:TodayDomainPorts,scope:TodayDomainScope):Promise<TodayContributions> {
  const defaults=unavailableContributions()
  const keys=["revision","focus","readiness","upcoming"] as const
  const results=await Promise.allSettled(keys.map(key=>ports[key]?.(scope)))
  const values=Object.fromEntries(keys.map((key,index)=>{
    const result=results[index]
    return [key,result.status==="fulfilled"&&result.value?result.value:result.status==="rejected"?{...defaults[key],state:"error"}:defaults[key]]
  }))
  return values as unknown as TodayContributions
}
