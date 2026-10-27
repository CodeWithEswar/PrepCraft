import { LearningPage,type SubjectId } from "@/features/learning"
import { learningPreview,previewConcept } from "@/features/learning/server"
import { notFound } from "next/navigation"
import { WorkspacePreviewPage, previewSections, type PreviewSection } from "@/features/workspace-preview"
import { connection } from "next/server"
import { PlanningPage, emptyPlanning } from "@/features/planning"
import { dayKeyAt } from "@/lib/time/workspace-calendar"
import { ExecutionPreview } from "@/features/execution"

import { RevisionPage,revisionPreview } from "@/features/revision"

import { MasteryPage,masteryPreview } from "@/features/mastery"
import { BehavioralHome } from "@/features/behavioral"
import { behavioralPreview,behavioralPreviewDetail } from "@/features/behavioral/server"
import { MockPreview } from "@/features/mock-interviews"
export const instant=false

export function generateStaticParams() { return previewSections.map(section=>({section})) }
export default async function WorkspacePreviewSection({params,searchParams}:{params:Promise<{section:string}>;searchParams:Promise<{subject?:string}>}) {
  const {section}=await params
  if(!previewSections.includes(section as PreviewSection)) notFound()
  if(section==="mocks"){await connection();return <MockPreview/>}
  if(section==="behavioral"){await connection();const initial=behavioralPreview();return <BehavioralHome preview initial={initial} initialDetail={behavioralPreviewDetail(initial.stories[0].id)}/>}
  if(["learn","fundamentals","aptitude"].includes(section)){await connection();const q=await searchParams,subject=(["aptitude","java","sql-dbms","operating-systems","networks"].includes(q.subject||"")?q.subject:section==="fundamentals"?"java":"aptitude") as SubjectId,catalog=learningPreview(subject),detail=previewConcept(catalog.concepts.find(c=>c.status==="published")!.id);return <LearningPage preview catalog={catalog} initialConcept={detail} subject={subject} overview={{opened:0,bookmarks:0,attempts:0,correct:0,subjects:[],continue:[],due:[]}}/>}
  if(section==="progress"){await connection();return <MasteryPage preview snapshot={masteryPreview(new Date().toISOString())}/>}
  if(section==="revision"){await connection();const {snapshot,details}=revisionPreview(new Date().toISOString());return <RevisionPage preview snapshot={snapshot} previewDetails={details} initialDetail={details[0].item}/>}
  if(section==="practice"||section==="timed-practice")return <ExecutionPreview/>
  if(section==="plan"){
    await connection()
    const now=new Date().toISOString(),today=dayKeyAt(now,"Asia/Calcutta")
    return <PlanningPage preview snapshot={emptyPlanning({workspaceId:"preview-general",slug:"preview",name:"Your preparation workspace",timezone:"Asia/Calcutta",today,company:null,role:"Software Engineer",targetDate:null,canEdit:false,weeklyTargetMinutes:0,defaultDailyMinutes:0,studyDays:[],curriculumVersion:"none",contextVersion:"preview",hasCurriculum:false},now)}/>
  }
  return <WorkspacePreviewPage key={section} section={section as PreviewSection}/>
}
