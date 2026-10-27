"use client"
import type { AnalyticsSnapshot,AnalyticsEvidenceMetric } from "../../types/analytics.types"
import { PreparationBrief,ProgressNarrative,DifficultyPerformance } from "../analytics-widgets"
import TimingCorridor from "../charts/timing-corridor"
import SpeedOutcome from "../charts/speed-outcome"
import TimeByTopic from "../charts/time-by-topic"
import OutcomeTrend from "../charts/outcome-trend"
export default function Overview(props:{snapshot:AnalyticsSnapshot;onEvidence:(metric?:AnalyticsEvidenceMetric)=>void;onRetry:()=>void}){return <><PreparationBrief snapshot={props.snapshot}/><div className="pc-an-chart-pair pc-an-pair-wide"><TimingCorridor {...props} onEvidence={()=>props.onEvidence("timing")}/><SpeedOutcome {...props}/></div><div className="pc-an-chart-pair"><TimeByTopic {...props}/><OutcomeTrend {...props}/></div><DifficultyPerformance {...props}/><ProgressNarrative snapshot={props.snapshot}/></>}
