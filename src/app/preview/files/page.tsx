import { FilesPage } from "@/features/files"
import { connection } from "next/server"
export const instant=false
export default async function Page(){await connection();const id="00000000-0000-4000-8000-000000000001";return <FilesPage preview enabled={false} initial={{workspace:{id,slug:"preview",userId:id,name:"Preview workspace",canEdit:false},cursor:null,items:[{id,workspaceId:id,name:"Resume — Software Engineer.pdf",originalName:"Resume.pdf",category:"resume",mime:"application/pdf",bytes:245760,checksum:"a".repeat(64),status:"READY",version:1,failureCode:null,createdAt:"2026-10-27T00:00:00Z",updatedAt:"2026-10-27T00:00:00Z"}]}}/>}
