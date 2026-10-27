import { connection } from "next/server"
import { notFound,redirect } from "next/navigation"
import { resolveWorkspace } from "@/features/workspaces/server"
export const instant=false
export default async function InterviewPage({params}:{params:Promise<{workspaceSlug:string}>}){await connection();const {workspaceSlug}=await params;if(!await resolveWorkspace(workspaceSlug))notFound();redirect('/w/'+workspaceSlug+'/interview/behavioral')}
