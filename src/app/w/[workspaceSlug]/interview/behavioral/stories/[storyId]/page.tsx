import { connection } from "next/server"
import { notFound } from "next/navigation"
import { StoryForge } from "@/features/behavioral"
import { getBehavioralHome,getStoryDetail } from "@/features/behavioral/server"
export const instant=false
export default async function StoryPage({params}:{params:Promise<{workspaceSlug:string;storyId:string}>}){await connection();const {workspaceSlug,storyId}=await params;if(!/^[0-9a-f-]{36}$/i.test(storyId))notFound();const [home,detail]=await Promise.all([getBehavioralHome(workspaceSlug),getStoryDetail(workspaceSlug,storyId).catch(()=>null)]);if(!detail)notFound();return <StoryForge key={detail.story.id} initial={detail} context={home.context}/>}
