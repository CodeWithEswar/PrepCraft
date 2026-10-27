import * as Sentry from "@sentry/nextjs"
import { publicMonitoring } from "@/lib/env/monitoring.public"
import { privateErrorEvent,privateTransaction } from "@/lib/observability/privacy"
const config=publicMonitoring()
if(config.dsn)Sentry.init({dsn:config.dsn,environment:config.environment,dataCollection:{userInfo:false,cookies:false,httpHeaders:false,httpBodies:[],urlQueryParams:false,databaseQueryData:false,queues:false,stackFrameVariables:false,frameContextLines:0,genAI:{inputs:false,outputs:false},mcp:{inputs:false,outputs:false}},beforeSendLog:()=>null,traceLifecycle:"static",tracesSampleRate:0.05,replaysSessionSampleRate:0,replaysOnErrorSampleRate:0,beforeSend:privateErrorEvent,beforeSendTransaction:privateTransaction,integrations:defaults=>defaults.filter(i=>["GlobalHandlers","BrowserApiErrors","Dedupe"].includes(i.name))})
export const onRouterTransitionStart=Sentry.captureRouterTransitionStart
