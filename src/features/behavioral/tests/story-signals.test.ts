import { describe,it,expect } from "vitest"
import { storyBalance,nextStory,suggestStories } from "../services/story-signals"
import { storyFormSchema,ratingSchema,commandSchema } from "../schemas/behavioral.schema"
import type { StoryRow,BehavioralPrompt } from "../types/behavioral.types"
const now="2026-10-25T12:00:00.000Z",row:StoryRow={id:"00000000-0000-4000-8000-000000000001",title:"Real incident",summary:"Recovery",context:"Project",status:"practice_ready",story_type:"project",version:1,updated_at:now,mappings:[],last_practiced_at:null,practice_count:0,confidence:null,cue_level:null,revision_id:null,due_at:null}
describe("explainable story preparation",()=>{
 it("has no recommendation for an empty portfolio",()=>expect(nextStory([],now)).toBeNull())
 it("excludes retired stories",()=>expect(nextStory([{...row,status:"retired"}],now)).toBeNull())
 it("prioritizes due recall over a recent rehearsal",()=>{const due={...row,id:"due",due_at:"2026-10-24T00:00:00.000Z"},recent={...row,id:"recent",last_practiced_at:now,practice_count:2};expect(nextStory([recent,due],now)?.story.id).toBe("due");expect(nextStory([due],now)?.reasons.join(" ")).toContain("Shared Revision")})
 it("keeps a developing experience actionable through Forge",()=>expect(nextStory([{...row,status:"draft"}],now)?.reasons[0]).toContain("Story Forge"))
 it("counts composition without assigning quality",()=>{const b=storyBalance({situation:"A small team",task:"I owned recovery",action:"I compared alternatives and proposed rollback",result:"Service recovered",reflection:"Communicate earlier"});expect(b.total).toBe(16);expect(b.sections.reduce((sum,s)=>sum+s.share,0)).toBeCloseTo(1);expect(b.guidance).toContain("not a quality score")})
 it("handles an empty story without NaN",()=>{const b=storyBalance({situation:"",task:"",action:"",result:"",reflection:""});expect(b.total).toBe(0);expect(b.sections.every(s=>s.share===0)).toBe(true);expect(b.guidance).toContain("individual actions")})
 it("does not demand invented metrics",()=>expect(storyBalance({situation:"Context",task:"Responsibility",action:"I acted",result:"",reflection:""}).guidance).toContain("not required"))
 it("suggests real mapped experiences without changing their facts",()=>{const prompt={principles:[{id:"ownership",name:"Ownership"}]} as BehavioralPrompt,mapped={...row,mappings:[{id:"ownership",name:"Ownership",framework_id:"general",framework_version:1,relevance:"primary" as const}]};expect(suggestStories(prompt,[row,mapped])).toEqual([mapped])})
})
describe("private story contracts",()=>{
 const draft={title:"An experience",summary:"",situation:"",task:"",action:"",result:"",reflection:"",private_notes:"",context:"",period:"",story_type:null,status:"draft"}
 it("accepts incomplete drafts",()=>expect(storyFormSchema.safeParse(draft).success).toBe(true))
 it("requires STAR sections for practice-ready status",()=>expect(storyFormSchema.safeParse({...draft,status:"practice_ready"}).success).toBe(false))
 it("rejects oversized private text",()=>expect(storyFormSchema.safeParse({...draft,action:"a".repeat(10001)}).success).toBe(false))
 it("requires all self-ratings and retelling outcome",()=>expect(ratingSchema.safeParse({confidence:4}).success).toBe(false))
 it("allows an empty optional reflection without making up content",()=>expect(ratingSchema.parse({retold:true,confidence:4,clarity:3,actionSpecificity:4,resultSpecificity:3}).reflection).toBe(""))
 it("rejects a missing workspace and invalid request identity",()=>expect(commandSchema.safeParse({slug:"",requestId:"invalid",command:{kind:"create",title:"Story"}}).success).toBe(false))
})
