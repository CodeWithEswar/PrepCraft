import type { CloudflareOptions } from "@sentry/cloudflare"
export interface WorkerMonitoringEnv {SENTRY_DSN?:string;SENTRY_RELEASE?:string;ENVIRONMENT?:string}
/** Content-free telemetry. No provider message, queue body, token, filename or request survives. */
export function workerMonitoring(env:WorkerMonitoringEnv):CloudflareOptions|undefined{
 if(!env.SENTRY_DSN)return undefined
 return {dsn:env.SENTRY_DSN,environment:env.ENVIRONMENT||"production",release:env.SENTRY_RELEASE,defaultIntegrations:false,tracesSampleRate:0,
  dataCollection:{userInfo:false,cookies:false,httpHeaders:false,httpBodies:[],urlQueryParams:false,databaseQueryData:false,queues:false,stackFrameVariables:false,frameContextLines:0,genAI:{inputs:false,outputs:false},mcp:{inputs:false,outputs:false}},
  beforeSendLog:()=>null,beforeSendTransaction:()=>null,
  beforeSend:event=>({type:undefined,event_id:event.event_id,timestamp:event.timestamp,level:"error",environment:env.ENVIRONMENT||"production",release:env.SENTRY_RELEASE,exception:{values:[{type:"WorkerError",value:"Worker operation failed. Inspect structured operational records."}]}})}
}
