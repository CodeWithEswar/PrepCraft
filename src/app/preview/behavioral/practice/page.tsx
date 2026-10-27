import { connection } from "next/server"
import { BehavioralFocus } from "@/features/behavioral"
import { behavioralPreviewSession,behavioralPreviewDetail } from "@/features/behavioral/server"
export const instant=false
export default async function ExamplePractice(){await connection();const initial=behavioralPreviewSession(),s=behavioralPreviewDetail(initial.binding.story_id)!.story;return <BehavioralFocus preview initial={initial} previewCues={{situation:s.situation,task:s.task,action:s.action,result:s.result,reflection:s.reflection}}/>}
