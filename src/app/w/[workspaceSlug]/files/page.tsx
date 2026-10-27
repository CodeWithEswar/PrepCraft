import { connection } from "next/server"
import { FilesPage } from "@/features/files"
import { getPrivateFiles } from "@/features/files/server"
import { platformEnv } from "@/lib/env/platform"
export const instant=false
export default async function Page({params}:{params:Promise<{workspaceSlug:string}>}){await connection();const {workspaceSlug}=await params;return <FilesPage initial={await getPrivateFiles(workspaceSlug)} enabled={!!platformEnv.workerOrigin}/>}
