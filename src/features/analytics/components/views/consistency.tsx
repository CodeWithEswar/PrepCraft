"use client"
import type { AnalyticsSnapshot } from "../../types/analytics.types"
import { ChartFrame,ChartTable } from "@/components/charts"
import { chartEvidence } from "../../services/chart-evidence"
import { PreparationCalendar,PlanAdherence,ProgressNarrative } from "../analytics-widgets"
import ActivityChart from "../charts/activity-chart"
export default function Consistency(props:{snapshot:AnalyticsSnapshot;onRetry:()=>void}){const s=props.snapshot,a=s.activity,rows=a?.composition||[],columns=[{key:"type",label:"Recorded activity type"},{key:"focusMs",label:"Tracked focus",format:"duration" as const}];return <><PreparationCalendar snapshot={s}/><ActivityChart {...props}/><PlanAdherence snapshot={s}/><ChartFrame title="Focus composition" question="Where did your recorded focus go?" evidence={chartEvidence(s,"focus",a?.summary.activeDays||0,a?rows.length?"ready":"empty":"error")} summary="Personal closed focus intervals are clipped to the selected local dates and merged where they overlap. Planned task estimates do not become actual study time. Unplanned completed sessions remain included." columns={columns} rows={rows.map(r=>({...r}))}><ChartTable columns={columns} rows={rows.map(r=>({...r}))}/></ChartFrame><ProgressNarrative snapshot={s}/></>}
