import { connection } from "next/server"
import { LearningRoute } from "@/features/learning/server"
export const instant=false
export default async function Learn({params,searchParams}:{params:Promise<{workspaceSlug:string}>;searchParams:Promise<{topic?:string}>}){await connection();const {workspaceSlug}=await params,{topic}=await searchParams;return <LearningRoute slug={workspaceSlug} topic={topic||null}/>}
