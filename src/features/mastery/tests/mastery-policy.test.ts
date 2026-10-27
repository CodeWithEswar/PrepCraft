import {describe,it,expect} from "vitest"
import {calculateMastery,evidenceConfidence,MASTERY_POLICY} from "../policies/mastery-policy-v1"
import {masteryPreview} from "../services/mastery-preview"
import type {MasteryAggregate} from "../types/mastery.types"
const now="2026-10-25T12:00:00Z",sample=masteryPreview(now).results[0],area=sample.area,base=sample.aggregate!,context={now,days:90,slug:"one"}
const calc=(a:MasteryAggregate|null)=>calculateMastery(area,a,context)
const dimension=(a:MasteryAggregate|null,key:string)=>calc(a).dimensions.find(value=>value.key===key)!
describe("mastery evidence confidence",()=>{
 it("keeps absent evidence unassessed with no score",()=>{const r=calc(null);expect(r.level).toBe("unassessed");expect(r.score).toBeNull();expect(r.evidenceConfidence).toBe("insufficient");expect(r.weaknesses).toEqual([])})
 it("never labels a single attempt as weakness",()=>{const r=masteryPreview(now).results.find(r=>r.area.name==="Graphs")!;expect(r.level).toBe("unassessed");expect(r.evidenceConfidence).toBe("limited");expect(r.weaknesses).toHaveLength(0)})
 it("requires varied days and identities, not sheer activity",()=>expect(evidenceConfidence({...base,active_days:1,distinct_entities:1},now)).toBe("limited"))
 it("recognizes longitudinal mixed-difficulty evidence",()=>expect(evidenceConfidence(base,now)).toBe("strong"))
 it("limits stale confidence without automatically declaring weakness",()=>{const r=calc({...base,first_at:"2026-07-01T12:00Z",last_at:"2026-07-30T12:00Z"});expect(r.evidenceConfidence).toBe("limited");expect(r.level).toBe("strong");expect(r.gaps.some(g=>g.code==="STALE_EVIDENCE")).toBe(true)})
 it("does not give Strong evidence confidence for easy-only volume",()=>expect(evidenceConfidence({...base,difficulty:{easy:11,medium:0,hard:0,unspecified:0}},now)).not.toBe("strong"))
})
describe("dimension sufficiency and interpretation",()=>{
 it("returns seven explicit dimensions",()=>expect(calc(base).dimensions).toHaveLength(7))
 for(const key of ["independent","retention","recency","difficulty","timing","hints","calibration"])it(`keeps missing ${key} evidence null`,()=>expect(dimension(null,key).value).toBeNull())
 it("requires two actual reviews for retention",()=>expect(dimension({...base,reviews:0,retained:0,attempts:8,buckets:[{...base.buckets[0],review_count:0,review_independent:0,total:8}]},"retention").availability).toBe("insufficient"))
 it("does not classify untimed practice as poor timing",()=>{const d=dimension({...base,timing:{count:0,medianRatio:null,outliers:0}},"timing");expect(d.value).toBeNull();expect(d.interpretation).toBe("Evidence needed")})
 it("interprets a supported median relative to its real target",()=>expect(dimension({...base,timing:{count:3,medianRatio:1.5,outliers:0}},"timing").value).toBeCloseTo(2/3))
 it("does not turn harder labels into XP",()=>{expect(calc({...base,difficulty:{easy:0,medium:0,hard:11,unspecified:0}}).level).toBe(calc(base).level);expect(dimension(base,"difficulty").value).toBeNull()})
 it("counts minor assistance differently from major assistance",()=>{const a={...base,buckets:[{...base.buckets[0],minor:4,major:0}]};const b={...base,buckets:[{...base.buckets[0],minor:0,major:4}]};expect(dimension(a,"hints").value!).toBeGreaterThan(dimension(b,"hints").value!)})
 it("weights recent initial attempts more than historical attempts",()=>{const b={...base,buckets:[{...base.buckets[0],initial_count:4,initial_independent:4,review_count:3,review_independent:3,total:7},{band:"historical" as const,initial_count:4,initial_independent:0,review_count:0,review_independent:0,total:4,minor:0,major:0,failed:4}]};expect(dimension(b,"independent").value!).toBeGreaterThan(.5)})
 it("does not redistribute missing timing into a Strong result",()=>expect(calc({...base,timing:{count:0,medianRatio:null,outliers:0}}).level).not.toBe("strong"))
 it("keeps strong independent solving distinct from insufficient retention",()=>{const r=calc({...base,attempts:8,reviews:0,retained:0,buckets:[{...base.buckets[0],review_count:0,review_independent:0,total:8}]});expect(r.strengths.length).toBeGreaterThan(0);expect(r.gaps.some(g=>g.code==="INSUFFICIENT_RETENTION_EVIDENCE")).toBe(true)})
})
describe("evidence-backed weaknesses and actions",()=>{
 const weak=masteryPreview(now).results.find(r=>r.area.name==="Sliding Window")!
 it("explains reported pattern recognition evidence",()=>expect(weak.weaknesses.find(w=>w.code==="PATTERN_RECOGNITION_GAP")?.explanation).toContain("self-reported"))
 it("does not invent Mistake Journal findings",()=>expect(calc(base).weaknesses.some(w=>w.code==="REPEATED_EDGE_CASE_FAILURE")).toBe(false))
 it("requires repeated mistake tags across distinct items",()=>expect(calc({...base,reported_mistakes:{edge_case:4,edge_case_entities:1}}).weaknesses.some(w=>w.code==="REPEATED_EDGE_CASE_FAILURE")).toBe(false))
 it("every finding has a supported next action",()=>{for(const w of weak.weaknesses)expect(w.actionKind).toBeTruthy();expect(weak.action.href).toBeTruthy();expect(weak.action.reasons.length).toBeGreaterThan(0)})
 it("routes timed evidence gaps to Interview execution",()=>{const r=calc({...base,timing:{count:0,medianRatio:null,outliers:0}});expect(r.gaps.find(g=>g.title.startsWith("Solve Time"))?.actionKind).toBe("timed")})
 it("keeps high confidence plus failure from becoming a strength",()=>{const r=calc({...base,confidence_pairs:[{confidence:5,result:"could_not_solve",count:3}]});expect(r.weaknesses.some(w=>w.code==="OVERCONFIDENCE")).toBe(true);expect(r.dimensions.find(d=>d.key==="calibration")?.value).toBe(0)})
 it("recognizes low confidence plus independent results",()=>expect(calc({...base,confidence_pairs:[{confidence:1,result:"solved_independently",count:3}]}).weaknesses.some(w=>w.code==="UNDERCONFIDENCE")).toBe(true))
 it("aligned confidence is evidence, not a competence override",()=>expect(dimension({...base,confidence_pairs:[{confidence:5,result:"solved_independently",count:3}]},"calibration").value).toBe(1))
 it("never invents unseen questions, a code runner, or a time estimate",()=>{expect(weak.action.detail).toContain("Choose");expect(weak.action.detail).not.toContain("unseen");expect(weak.action.title).not.toContain("35")})
 it("returns deterministic versioned results",()=>{expect(calc(base)).toEqual(calc(base));expect(calc(base).policyVersion).toBe(MASTERY_POLICY.version)})
 it("rejects corrupt aggregates instead of scoring them",()=>expect(()=>calc({...base,attempts:-1})).toThrow())
 it("rejects unbounded invalid timing evidence",()=>expect(()=>calc({...base,timing:{count:2,medianRatio:Infinity,outliers:0}})).toThrow())
})
