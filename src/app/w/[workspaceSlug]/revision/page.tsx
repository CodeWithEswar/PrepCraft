import { connection } from "next/server"
import { RevisionPage } from "@/features/revision"
import { getRevisionQueue } from "@/features/revision/server"
export const instant=false
export default async function RevisionRoute({params}:{params:Promise<{workspaceSlug:string}>}){await connection();const {workspaceSlug}=await params;return <RevisionPage snapshot={await getRevisionQueue(workspaceSlug)}/>}
