import "server-only"
import * as Sentry from "@sentry/nextjs"
import { platformEnv } from "@/lib/env/platform"
import { privateErrorEvent,privateTransaction } from "./privacy"
export function registerServerMonitoring(){if(!platformEnv.sentryDsn)return;Sentry.init({dsn:platformEnv.sentryDsn,environment:platformEnv.environment,release:platformEnv.release,dataCollection:{userInfo:false,cookies:false,httpHeaders:false,httpBodies:[],urlQueryParams:false,databaseQueryData:false,queues:false,stackFrameVariables:false,frameContextLines:0,genAI:{inputs:false,outputs:false},mcp:{inputs:false,outputs:false}},beforeSendLog:()=>null,traceLifecycle:"static",tracesSampleRate:0.05,beforeSend:privateErrorEvent,beforeSendTransaction:privateTransaction,integrations:defaults=>defaults.filter(i=>!["Console","Http","LocalVariables","RequestData","ProfilingIntegration"].includes(i.name))})}
export const captureRequestError=Sentry.captureRequestError
