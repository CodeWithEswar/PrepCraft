import { createLogRecord } from "./log-record"
export type AnalyticsProductEvent="analytics.viewed"|"analytics.filter.changed"|"analytics.chart.expanded"|"analytics.table.opened"|"analytics.action.clicked"|"analytics.chart.failed"
/** A local integration event. No private labels, filters, workspace/user IDs or source records. */
export function emitAnalyticsEvent(event:AnalyticsProductEvent,context:{view?:"overview"|"dsa"|"timing"|"consistency"|"interviews"|"topics";pointCount?:number}={}){if(typeof window!=="undefined")window.dispatchEvent(new CustomEvent("prepcraft:analytics",{detail:createLogRecord(event.endsWith("failed")?"warn":"info",event,context)}))}
