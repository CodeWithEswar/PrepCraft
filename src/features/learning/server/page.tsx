import "server-only"
import { getLearningCatalog,getLearningOverview,getLearningConcept } from "./queries"
import { emptyLearningOverview } from "./preview"
import { LearningPage } from "../components/learning-page"
import { logEvent } from "@/lib/observability/logger.server"
import type { SubjectId } from "../types/learning.types"
export async function LearningRoute({slug,subject="aptitude",topic=null}:{slug:string;subject?:SubjectId;topic?:string|null}){
 const [catalog,progress]=await Promise.all([getLearningCatalog({slug,subject,topic}),getLearningOverview(slug).then(data=>({data,error:false})).catch(()=>{logEvent("warn","learning.progress.unavailable",{code:"unavailable"});return {data:emptyLearningOverview,error:true}})])
 const first=catalog.concepts.find(c=>c.status==="published"),concept=first?await getLearningConcept(slug,first.id).catch(()=>null):null
 return <LearningPage catalog={catalog} overview={progress.data} subject={subject} initialConcept={concept} progressError={progress.error}/>
}
