import { connection } from "next/server"
import { notFound } from "next/navigation"
import { StoryForge } from "@/features/behavioral"
import { behavioralPreview,behavioralPreviewDetail } from "@/features/behavioral/server"
export const instant=false
export default async function ExampleStory({params}:{params:Promise<{storyId:string}>}){await connection();const {storyId}=await params,initial=behavioralPreviewDetail(storyId);if(!initial)notFound();return <StoryForge preview initial={initial} context={behavioralPreview().context}/>}
