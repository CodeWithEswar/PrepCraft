"use client"
import dynamic from "next/dynamic"
/** The report consumer keeps Recharts outside the compact inbox context. */
export const AnalyticsReportTiming=dynamic(()=>import("./charts/timing-corridor"),{ssr:false,loading:()=> <p role="status">Loading timing evidence…</p>})
