import { connection } from "next/server"
import { RevisionPage } from "@/features/revision"
import { getRevisionQueue,getRevisionDetail } from "@/features/revision/server"
export const instant=false
export default async function RevisionDetailRoute({params}:{params:Promise<{workspaceSlug:string;revisionItemId:string}>}){await connection();const {workspaceSlug,revisionItemId}=await params;const [snapshot,detail]=await Promise.all([getRevisionQueue(workspaceSlug),getRevisionDetail(workspaceSlug,revisionItemId)]);return <RevisionPage snapshot={snapshot} initialDetail={detail.item}/>}
