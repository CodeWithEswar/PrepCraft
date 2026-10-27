// @vitest-environment node
import { describe,it,expect,vi } from "vitest"
vi.mock("server-only",()=>({}))
vi.mock("@/features/mastery/server",async()=>({calculateMastery:(await import("@/features/mastery/policies/mastery-policy-v1")).calculateMastery}))
import { analyticsFiltersSchema,evidenceRequestSchema } from "@/features/analytics/schemas/analytics.schema"
import { fallbackAnalyticsContext,serializeAnalyticsFilters,parseAnalyticsFilters } from "@/features/analytics/services/analytics-policy"
import { analyticsInsights } from "@/features/analytics/services/insight-engine"
import { analyticsPreview } from "@/features/analytics/server/preview-data"
import { projectCore } from "@/features/analytics/services/source-projection"
import { createLogRecord } from "@/lib/observability/log-record"
const filters=analyticsFiltersSchema.parse({}),workspace={id:"one",slug:"one",userId:"one",name:"One",timezone:"Asia/Calcutta",canEdit:true},now="2026-10-26T12:00:00Z"
describe("Analytics eligibility contracts",()=>{
 it("rejects forged filters and invalid real calendar dates",()=>{expect(analyticsFiltersSchema.safeParse({mode:"ranked"}).success).toBe(false);expect(analyticsFiltersSchema.safeParse({range:"custom",from:"2026-02-30",to:"2026-03-01"}).success).toBe(false);expect(analyticsFiltersSchema.safeParse({topic:"../another-user"}).success).toBe(false)})
 it("accepts a maximum leap-year range but rejects reversed and oversized windows",()=>{expect(analyticsFiltersSchema.safeParse({range:"custom",from:"2024-01-01",to:"2024-12-31"}).success).toBe(true);for(const [from,to]of [["2024-01-01","2025-01-01"],["2026-10-20","2026-10-01"]])expect(analyticsFiltersSchema.safeParse({range:"custom",from,to}).success).toBe(false)})
 it("requires a typed, timestamped evidence cursor",()=>{expect(evidenceRequestSchema.safeParse({slug:"one",filters,metric:"all",cursor:{at:now,id:"forged"}}).success).toBe(false)})
 it("defaults to thirty complete local days with a correct India boundary",()=>{const c=fallbackAnalyticsContext(workspace,filters,now);expect(c.from).toBe("2026-09-26");expect(c.to).toBe("2026-10-25");expect(c.toAt).toBe("2026-10-25T18:30:00.000Z");expect(c.partial).toBe(false);expect(c.previousTo).toBe("2026-09-25")})
 it("uses actual 23-hour and 25-hour DST calendar days",()=>{for(const [date,hours]of [["2026-03-08",23],["2025-11-02",25]] as const){const c=fallbackAnalyticsContext({...workspace,timezone:"America/New_York"},{...filters,range:"custom",from:date,to:date},now);expect((Date.parse(c.toAt)-Date.parse(c.fromAt))/3600000).toBe(hours)}})
 it("keeps this month in the current month on its first partial day",()=>{const c=fallbackAnalyticsContext(workspace,{...filters,range:"month"},"2026-11-01T12:00:00Z");expect(c.from).toBe("2026-11-01");expect(c.to).toBe(c.from);expect(c.partial).toBe(true)})
 it("bounds daily plots and roundtrips filters without stale custom dates",()=>{const f={...filters,range:"90d" as const,from:"2026-01-01",to:"2026-02-01",compare:false,topic:"arrays"},query=serializeAnalyticsFilters(f);expect(query).not.toContain("from=");expect(parseAnalyticsFilters(Object.fromEntries(new URLSearchParams(query)))).toEqual({...f,from:undefined,to:undefined});const c=fallbackAnalyticsContext(workspace,{...filters,range:"custom",from:"2026-01-01",to:"2026-10-01",granularity:"day"},now);expect(c.granularity).toBe("week")})
})
describe("Evidence-safe interpretations",()=>{
 it("never turns unknown attribution into a constraint",()=>{const s=analyticsPreview("overview",filters,now);s.core!.topics.forEach(t=>t.id="unmapped");expect(analyticsInsights(s).some(i=>i.kind==="constraint")).toBe(false)})
 it("suppresses improvement statements for mixed, partial or capped cohorts",()=>{const s=analyticsPreview("overview",filters,now);s.core!.comparison.available=false;expect(analyticsInsights(s).some(i=>i.kind==="comparison")).toBe(false);s.core!.truncated=true;expect(analyticsInsights(s)).toEqual([])})
 it("keeps coding reports out of objective calibration and correctness",()=>{const s=analyticsPreview("timing",filters,now);expect(s.core!.current.accuracy).toBeNull();expect(s.core!.calibration).toEqual([]);expect(s.interviews!.mocks.every(m=>m.facets.find(f=>f.dimension==="communication")?.n===0)).toBe(true)})
 it("keeps unsupported plan filters missing instead of zero",()=>{const s=analyticsPreview("consistency",{...filters,difficulty:"hard"},now);expect(s.activity!.planningAvailable).toBe(false);expect(s.activity!.summary.planned).toBeNull();expect(s.core!.current.medianMs).toBeNull()})
 it("derives preview pattern counts from the same records",()=>{const s=analyticsPreview("topics",filters,now);expect(s.core!.patterns.reduce((n,p)=>n+p.n,0)).toBe(s.core!.current.eligible);for(const p of s.core!.patterns)expect(p.independent+p.assisted+p.unsolved).toBe(p.n);expect(s.core!.relations.reduce((n,p)=>n+p.n,0)).toBe(s.core!.current.eligible)})
 it("projects secondary payloads per view and stays within the route budget",()=>{const s=analyticsPreview("timing",filters,now),c=projectCore(s.core!,"consistency");expect(c.points).toEqual([]);expect(c.questions).toEqual([]);expect(c.calibration).toEqual([]);expect(Buffer.byteLength(JSON.stringify(s))).toBeLessThan(180000)})
 it("logs only bounded numeric and enum metadata",()=>{const record=createLogRecord("info","analytics.viewed",{view:"timing",pointCount:100,payloadBytes:5000,topic:"private title",workspaceId:"secret",answer:"private answer"});expect(record).toMatchObject({view:"timing",pointCount:100,payloadBytes:5000});expect(JSON.stringify(record)).not.toMatch(/private|secret/)})
})
