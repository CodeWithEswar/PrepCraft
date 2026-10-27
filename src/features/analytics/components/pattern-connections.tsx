"use client"
import { useState } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { emitAnalyticsEvent } from "@/lib/observability/analytics-events"
import { ChartFrame,ChartSkeleton,useChartMobile,ChartTable } from "@/components/charts"
import { chartEvidence } from "../services/chart-evidence"
import type { AnalyticsSnapshot } from "../types/analytics.types"
const RelationshipGraph=dynamic(()=>import("@/components/charts/d3/pattern-relationship-graph"),{ssr:false,loading:()=> <ChartSkeleton/>})
export function PatternConnections({snapshot:s}:{snapshot:AnalyticsSnapshot}){const mobile=useChartMobile(),[expanded,setExpanded]=useState(false),rows=s.core?.relations||[],e=chartEvidence(s,"outcomes",rows.reduce((n,r)=>n+r.n,0),s.core?rows.length?"ready":"empty":"error"),columns=[{key:"topicName",label:"Topic"},{key:"patternName",label:"Recorded pattern"},{key:"n",label:"Associated attempts",format:"number" as const}];return <ChartFrame title="Observed pattern connections" question="Which recorded patterns connect to these topics?" evidence={e} summary="Connections come from explicit topic attribution and recorded attempt patterns. They do not imply prerequisites, causation or a forced pattern assignment. The SQL read model is limited to 60 edges; the on-demand map shows at most 40 nodes. The labeled list is primary on mobile." columns={columns} rows={rows.map(r=>({...r}))}>{mobile?<ChartTable columns={columns} rows={rows.map(r=>({...r}))}/>:<>{!expanded?<><ChartTable columns={columns} rows={rows.slice(0,8).map(r=>({...r}))}/>{rows.length>1&&<Button variant="outline" onClick={()=>{emitAnalyticsEvent("analytics.chart.expanded",{view:s.view,pointCount:rows.length});setExpanded(true)}}>Explore relationship map</Button>}</>:<RelationshipGraph relations={rows}/>}</>}</ChartFrame>}
