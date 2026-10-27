import { calculateMastery,MASTERY_POLICY } from "../policies/mastery-policy-v1"
import type { MasteryAggregate,MasteryArea,MasterySnapshot } from "../types/mastery.types"
export function masteryPreview(now:string):MasterySnapshot {
 const names=["Arrays","Strings","Hashing","Sliding Window","Trees","Graphs","Dynamic Programming"]
 const results=names.map((name,index)=>{
 const area:MasteryArea={id:`preview-${index}`,kind:index===3?"pattern":"topic",name,trackId:"dsa",trackName:"DSA & problem solving",priority:index<5?"core":"high",required:true}
 const count=[8,6,6,10,5,1,0][index],independent=[7,5,5,4,1,1,0][index],reviews=index<5?3:0,retained=index===4?1:reviews
 const a:MasteryAggregate|null=count?{entity_type:area.kind,entity_id:area.id,attempts:count+reviews,initial_attempts:count,distinct_entities:index===5?1:5,active_days:index===5?1:6,first_at:new Date(Date.parse(now)-30*86400000).toISOString(),last_at:new Date(Date.parse(now)-86400000).toISOString(),reviews,retained,recent_independent:independent,recent_reviews:reviews,difficulty:{easy:2,medium:Math.max(0,count-2),hard:0,unspecified:0},timing:{count:index===5?0:3,medianRatio:index===3?1.35:1,outliers:0},median_duration_ms:18*60000,reported_mistakes:index===3?{recognition:3,recognition_entities:3,edge_case:2,edge_case_entities:2}:{},buckets:[{band:"recent",initial_count:count,initial_independent:independent,review_count:reviews,review_independent:retained,total:count+reviews,minor:Math.max(0,count-independent),major:0,failed:index===4?2:0}],confidence_pairs:[{confidence:4,result:"solved_independently",count:independent},{confidence:3,result:"solved_small_hint",count:Math.max(0,count-independent)}],due_revision_id:null}:null
 const result=calculateMastery(area,a,{now,days:90,slug:"preview"});result.previousLevel=index===3?"needs_work":result.level;result.comparisonAvailable=true;result.action.href="/preview/practice";return result
 })
 return {workspace:{id:"mastery-preview",slug:"preview",userId:"preview",timezone:"UTC",name:"General SDE Preparation",canEdit:false},days:90,generatedAt:now,policyVersion:MASTERY_POLICY.version,results,totals:{attempts:results.reduce((n,r)=>n+(r.aggregate?.attempts||0),0),revisions:15,retained:13},unmapped:{count:0,items:[]},historyState:"ready",sources:{attempts:"ready",revision:"ready",mistakeJournal:"unavailable"},truncated:false}
}
