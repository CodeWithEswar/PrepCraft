import { connection } from "next/server"
import { getLearningSession } from "@/features/learning/server"
import { LearningActivityPage } from "@/features/learning"
export const instant=false
export default async function Activity({params}:{params:Promise<{workspaceSlug:string;sessionId:string}>}){await connection();const {workspaceSlug,sessionId}=await params;return <LearningActivityPage initial={await getLearningSession(workspaceSlug,sessionId)}/>}
