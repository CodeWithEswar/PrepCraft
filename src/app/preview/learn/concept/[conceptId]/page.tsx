import { notFound } from "next/navigation"
import { ConceptPage } from "@/features/learning"
import { previewConcept } from "@/features/learning/server"
export const instant=false
export default async function PreviewConcept({params}:{params:Promise<{conceptId:string}>}){const {conceptId}=await params,detail=previewConcept(conceptId);if(!detail)notFound();return <ConceptPage preview detail={detail} workspace={{id:"preview-learning",slug:"preview",userId:"preview",canEdit:false}}/>}
