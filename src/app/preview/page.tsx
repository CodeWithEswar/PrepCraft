import { connection } from "next/server"
import { TodayDashboard, assembleToday } from "@/features/today"

export const instant=false
export default async function WorkspacePreview() {
  await connection()
  const snapshot=assembleToday({context:{workspaceId:"preview-general",slug:"preview",name:"Preview workspace",timezone:"Asia/Calcutta",role:"Your preparation workspace",company:null,targetDate:null,weeklyTargetMinutes:0,dailyMinutes:0,studyDays:[],hasCurriculum:false,contextVersion:"preview",canEdit:false},plan:null,tasks:[],now:new Date().toISOString()})
  return <TodayDashboard snapshot={snapshot} preview/>
}
