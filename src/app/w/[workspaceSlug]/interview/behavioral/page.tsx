import { connection } from "next/server"
import { notFound } from "next/navigation"
import { BehavioralHome } from "@/features/behavioral"
import { getBehavioralHome,getStoryDetail } from "@/features/behavioral/server"
import { resolveWorkspace } from "@/features/workspaces/server"
export const instant=false
export default async function BehavioralPage({params}:{params:Promise<{workspaceSlug:string}>}){await connection();const {workspaceSlug}=await params;if(!await resolveWorkspace(workspaceSlug))notFound();const initial=await getBehavioralHome(workspaceSlug),detail=initial.stories[0]?await getStoryDetail(workspaceSlug,initial.stories[0].id).catch(()=>null):null;return <BehavioralHome key={initial.context.workspace.id} initial={initial} initialDetail={detail}/>}
