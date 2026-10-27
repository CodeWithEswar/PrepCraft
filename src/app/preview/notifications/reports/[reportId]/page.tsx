import { connection } from "next/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { WeeklyReport } from "@/features/notifications"
import { notificationPreview } from "@/features/notifications/server"
export const instant=false
export default async function Page({params}:{params:Promise<{reportId:string}>}){await connection();const {reportId}=await params,b=notificationPreview(),r=b.settings.reports.find(r=>r.id===reportId);if(!r)notFound();return <div className="pc-not-report-page pc-not-theme"><header><h1>Weekly preparation report</h1><Link href="/preview/notifications">Back to inbox</Link></header><WeeklyReport report={r} preview/></div>}
