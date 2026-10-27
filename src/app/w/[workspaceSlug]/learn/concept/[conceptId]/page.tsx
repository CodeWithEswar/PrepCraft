import { connection } from "next/server"
import { notFound } from "next/navigation"
import { ConceptPage } from "@/features/learning"
import { getLearningConcept,getLearningContext } from "@/features/learning/server"
export const instant=false
export default async function Concept({params}:{params:Promise<{workspaceSlug:string;conceptId:string}>}){await connection();const {workspaceSlug,conceptId}=await params,context=await getLearningContext(workspaceSlug),detail=await getLearningConcept(workspaceSlug,conceptId).catch(()=>null);if(!detail)notFound();return <ConceptPage detail={detail} workspace={{id:context.workspace.id,slug:workspaceSlug,userId:context.membership.userId,canEdit:context.workspace.status==="active"}}/>}
