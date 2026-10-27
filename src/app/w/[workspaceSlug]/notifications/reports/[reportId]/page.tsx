import { connection } from "next/server"
import Link from "next/link"
import { WeeklyReport } from "@/features/notifications"
import { getNotificationReport } from "@/features/notifications/server"
export const instant=false
export default async function Page({params}:{params:Promise<{workspaceSlug:string;reportId:string}>}){await connection();const {workspaceSlug,reportId}=await params;return <div className="pc-not-report-page pc-not-theme"><header><h1>Weekly preparation report</h1><Link href={`/w/${workspaceSlug}/notifications`}>Back to inbox</Link></header><WeeklyReport report={await getNotificationReport(workspaceSlug,reportId)}/></div>}
