import "server-only"
import coverage from "../content/coverage.json"
import lessons from "../content/lessons.server.json"
import type { LearningCatalog,ConceptDetail,SubjectId,LearningOverview,LearningConcept,LearningActivity,LearningSubject } from "../types/learning.types"
export const emptyLearningOverview:LearningOverview={opened:0,bookmarks:0,attempts:0,correct:0,subjects:[],continue:[],due:[]}
export function previewConcept(id:string):ConceptDetail|null{
 const l=lessons.find(l=>l.id===id);if(!l)return null
 const concept:LearningConcept={id:l.id,version:l.version,topic_id:l.topicId,name:l.name,summary:l.summary,mental_model:l.mental,worked_example:l.example,misconception:l.misconception,interview_prompt:l.interview,interview_answer:l.interviewAnswer,diagram:l.diagram as LearningConcept["diagram"],source_reference:l.source,author:l.author,reviewer:l.reviewer,reviewed_at:l.reviewedAt,language_version:l.subjectId==="java"?"Java SE 25":null}
 const activity:LearningActivity={id:l.activity.id,version:1,concept_id:l.id,concept_version:1,activity_type:l.activity.type as LearningActivity["activity_type"],title:l.activity.title,prompt:l.activity.prompt,options:l.activity.type==="ordering"?[...l.activity.options.slice(1),l.activity.options[0]]:l.activity.options,difficulty:l.activity.difficulty as LearningActivity["difficulty"],estimated_seconds:l.activity.estimatedSeconds}
 return {concept,activities:[activity],state:null,relations:[]}
}
export function learningPreview(subject:SubjectId="aptitude",topic:string|null=null,search="",after=""):LearningCatalog{
 const topics=coverage.topics.filter(t=>t.subjectId===subject).map(t=>({topic_id:t.id,subject_id:subject,name:t.name,sort_order:t.sort,planned_count:t.concepts.length+1,published_count:lessons.filter(l=>l.topicId===t.id).length,included:true})),selected=topic||topics.find(t=>t.published_count)?.topic_id
 const published=lessons.filter(l=>search?(l.name+" "+l.summary+" "+coverage.topics.find(t=>t.id===l.topicId)?.name).toLowerCase().includes(search.toLowerCase()):l.topicId===selected).map(l=>({id:l.id,version:1,topic_id:l.topicId,name:l.name,status:"published",summary:l.summary,sort_order:0,subject_id:l.subjectId as SubjectId,topic_name:coverage.topics.find(t=>t.id===l.topicId)!.name,bookmarked:false,opened_at:null,attempts:0,revision_id:null}))
 const planned=!search?coverage.topics.filter(t=>t.id===selected).flatMap(t=>t.concepts.map((name,i)=>({id:t.id+"-planned-"+i,version:1,topic_id:t.id,name,status:"draft",summary:"",sort_order:i+10,subject_id:t.subjectId as SubjectId,topic_name:t.name,bookmarked:false,opened_at:null,attempts:0,revision_id:null}))):[]
 return {workspace:{id:"preview-learning",slug:"preview",userId:"preview",canEdit:false},subjects:coverage.subjects.map((s,i)=>({id:s.id,name:s.name,track_id:s.trackId,tagline:s.tagline,icon:s.icon,sort_order:i,published_count:5})) as LearningSubject[],topics,concepts:[...published,...planned].filter(c=>c.id>after).slice(0,61),serverNow:new Date().toISOString()}
}
