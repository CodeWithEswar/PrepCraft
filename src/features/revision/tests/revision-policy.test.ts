import { describe,it,expect } from "vitest"
import { INTERVALS,nextInterval,nextReviewDay,mapAttemptOutcome,REVISION_POLICY } from "../policies/revision-policy-v1"
import { revisionPreview } from "../services/revision-preview"
import { recallPressure,recallScore,rankRevisions,revisionReasons,retentionBand } from "../services/revision-priority"
import { revisionRequestSchema,cursorSchema } from "../schemas/revision.schema"
const now="2026-10-25T12:00:00.000Z",base=revisionPreview(now).snapshot.items[0]
describe("transparent revision policy",()=>{
 for(const outcome of ["independent_success","minor_assistance","major_assistance","failed_recall"] as const)it(`starts ${outcome} at one day`,()=>expect(nextInterval(null,outcome)).toBe(1))
 it.each([[1,3],[3,7],[7,14],[14,30],[30,30]])("advances independent %s to %s",(previous,next)=>expect(nextInterval(previous,"independent_success")).toBe(next))
 for(const previous of INTERVALS){it(`holds ${previous} with a small hint`,()=>expect(nextInterval(previous,"minor_assistance")).toBe(previous));it(`resets ${previous} after failed recall`,()=>expect(nextInterval(previous,"failed_recall")).toBe(1))}
 it.each([[1,1],[3,1],[7,3],[14,7],[30,14]])("moves major assistance %s back to %s",(previous,next)=>expect(nextInterval(previous,"major_assistance")).toBe(next))
 it("rejects an unknown interval",()=>expect(()=>nextInterval(42,"independent_success")).toThrow())
 it("rejects an invented execution outcome",()=>expect(()=>mapAttemptOutcome("passed" )).toThrow())
 it("maps actual execution outcomes",()=>expect(["solved_independently","solved_small_hint","solved_major_hint","could_not_solve"].map(mapAttemptOutcome)).toEqual(["independent_success","minor_assistance","major_assistance","failed_recall"]))
 it("preserves the policy version",()=>expect(REVISION_POLICY).toBe("revision-policy-v1"))
 it.each([
 ["2026-03-08T04:30:00Z","America/New_York","2026-03-08"],
 ["2026-10-31T23:30:00Z","America/New_York","2026-11-01"],
 ["2026-10-24T22:00:00Z","Asia/Calcutta","2026-10-26"],
 ["2026-10-24T22:00:00Z","UTC","2026-10-25"],
 ["2026-10-25T00:30:00Z","Europe/London","2026-10-26"],
 ])("uses calendar days across %s in %s",(at,zone,day)=>expect(nextReviewDay(at,zone,null,"independent_success")).toBe(day))
})
describe("queue evidence and eligibility",()=>{
 it("excludes future and inactive items",()=>expect(rankRevisions([{...base,due_at:"2026-10-26T00:00Z"},{...base,state:"retired"}],now)).toEqual([]))
 it("prioritizes overdue failed recall over independent due today",()=>{const failed={...base,id:"failed",last_outcome:"failed_recall" as const,due_at:"2026-10-20T09:00Z"};expect(rankRevisions([{...base,id:"independent",last_outcome:"independent_success"},failed],now)[0].id).toBe("failed")})
 it("uses stable identity as final tie break",()=>expect(rankRevisions([{...base,id:"b"},{...base,id:"a"}],now).map(item=>item.id)).toEqual(["a","b"]))
 it("bounds snooze and failure weights",()=>expect(recallScore({...base,snooze_count:100,failure_count:100},now)).toBe(recallScore({...base,snooze_count:3,failure_count:3},now)))
 it("explains actual evidence without inventing target or mistake links",()=>expect(revisionReasons({...base,failure_count:2,snooze_count:1},now,"UTC").map(reason=>reason.code)).toEqual(["DUE_TODAY","ASSISTED_LAST_REVIEW","REPEATED_FAILURE","SNOOZED_PREVIOUSLY"]))
 it("derives overdue in the workspace timezone",()=>expect(revisionReasons({...base,due_at:"2026-10-24T23:30Z"},now,"Asia/Calcutta")[0].code).toBe("DUE_TODAY"))
 it("returns qualitative pressure",()=>expect(recallPressure({...base,last_outcome:"failed_recall"},now)).toBe("High"))
 it("requires evidence for retention bands",()=>{expect(retentionBand({...base,last_outcome:"failed_recall",independent_streak:10})).toBe("Needs reinforcement");expect(retentionBand({...base,last_outcome:"independent_success",independent_streak:4})).toBe("Strong retention")})
 it("validates workspace-scoped versioned mutations",()=>expect(revisionRequestSchema.safeParse({slug:"one",itemId:base.id,version:0,requestId:base.id,command:{kind:"snooze",until:"invalid",reason:""}}).success).toBe(false))
 it("accepts a frozen keyset cursor",()=>expect(cursorSchema.safeParse({asOf:now,rank:-88,due:now,id:base.id}).success).toBe(true))
})
