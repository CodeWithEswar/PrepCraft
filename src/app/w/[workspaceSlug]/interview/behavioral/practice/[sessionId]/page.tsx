import { connection } from "next/server"
import { notFound } from "next/navigation"
import { BehavioralFocus } from "@/features/behavioral"
import { getBehavioralSession } from "@/features/behavioral/server"
import { resolveWorkspace } from "@/features/workspaces/server"
export const instant=false
export default async function BehavioralPractice({params}:{params:Promise<{workspaceSlug:string;sessionId:string}>}){await connection();const {workspaceSlug,sessionId}=await params;if(!/^[0-9a-f-]{36}$/i.test(sessionId))notFound();const [context,initial]=await Promise.all([resolveWorkspace(workspaceSlug),getBehavioralSession(workspaceSlug,sessionId).catch(()=>null)]);if(!context||!initial)notFound();return <BehavioralFocus key={sessionId} initial={initial} canEdit={context.workspace.status==="active"&&context.permissions.canView}/>}
