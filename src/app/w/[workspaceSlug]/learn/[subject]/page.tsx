import { connection } from "next/server"
import { notFound } from "next/navigation"
import { LearningRoute } from "@/features/learning/server"
import type { SubjectId } from "@/features/learning"
export const instant=false
export default async function LearnTrack({params,searchParams}:{params:Promise<{workspaceSlug:string;subject:string}>;searchParams:Promise<{topic?:string}>}){await connection();const {workspaceSlug,subject}=await params,{topic}=await searchParams;if(!["aptitude","java","sql-dbms","operating-systems","networks"].includes(subject))notFound();return <LearningRoute slug={workspaceSlug} subject={subject as SubjectId} topic={topic||null}/>}
