import { connection } from "next/server"
import { MasteryPage } from "@/features/mastery"
import { getMasterySnapshot } from "@/features/mastery/server"
export const instant=false
export default async function ProgressPage({params}:{params:Promise<{workspaceSlug:string}>}){await connection();const {workspaceSlug}=await params;return <MasteryPage snapshot={await getMasterySnapshot(workspaceSlug)}/>}
