import { getLearningConcept } from "@/features/learning/server"
import { getStoryDetail } from "@/features/behavioral/server"
import { getAnalyticsPlanningTitle } from "@/features/analytics/server"
import { notFound } from "next/navigation"
import { connection } from "next/server"
import { resolveWorkspace } from "@/features/workspaces/server"
import { PlanningPage } from "@/features/planning"
import { getPlanningSnapshot,getPlanningTaskDay } from "@/features/planning/server"
import { getAttemptFollowup } from "@/features/execution/server"
export const instant=false
export default async function PlanPage({params,searchParams}:{params:Promise<{workspaceSlug:string}>;searchParams:Promise<{followUp?:string;learnConcept?:string;behavioralStory?:string;analyticsTopic?:string;task?:string}>}){
  await connection()
  const {workspaceSlug}=await params,context=await resolveWorkspace(workspaceSlug)
  if(!context)notFound()
  const search=await searchParams,followUp=search.followUp&&/^[0-9a-f-]{36}$/i.test(search.followUp)?await getAttemptFollowup(workspaceSlug,search.followUp):null
  const learning=search.learnConcept&&/^[a-z0-9-]{1,200}$/.test(search.learnConcept)?await getLearningConcept(workspaceSlug,search.learnConcept).catch(()=>null):null
  const story=search.behavioralStory&&/^[0-9a-f-]{36}$/i.test(search.behavioralStory)?await getStoryDetail(workspaceSlug,search.behavioralStory).catch(()=>null):null
  const analyticsTitle=search.analyticsTopic?await getAnalyticsPlanningTitle(workspaceSlug,search.analyticsTopic):null
  const taskDay=search.task?await getPlanningTaskDay(workspaceSlug,search.task):undefined
  return <PlanningPage key={`${context.workspace.id}:${search.task||""}`} initialTaskId={taskDay?search.task:undefined} snapshot={await getPlanningSnapshot(workspaceSlug,taskDay,context)} initialTaskTitle={story?`Behavioral practice · ${story.story.title}`:learning?`Learn · ${learning.concept.name}`:followUp||analyticsTitle||undefined}/>
}
