import { describe,it,expect } from "vitest"
import { schedule,pageFaults } from "../services/scheduler"
const fixture=[{id:"P1",arrival:0,burst:5},{id:"P2",arrival:1,burst:3},{id:"P3",arrival:2,burst:1}]
describe("deterministic scheduling labs",()=>{
 it("FCFS waits from arrival, not time zero",()=>{const s=schedule(fixture,"FCFS");expect(s.slices).toEqual([{id:"P1",start:0,end:5},{id:"P2",start:5,end:8},{id:"P3",start:8,end:9}]);expect(s.metrics.map(p=>p.waiting)).toEqual([0,4,6])})
 it("non-preemptive SJF only chooses arrived jobs",()=>{expect(schedule(fixture,"SJF").slices.map(s=>s.id)).toEqual(["P1","P3","P2"])})
 it("SRTF preempts with shorter remaining work",()=>{expect(schedule(fixture,"SRTF").slices).toEqual([{id:"P1",start:0,end:1},{id:"P2",start:1,end:2},{id:"P3",start:2,end:3},{id:"P2",start:3,end:5},{id:"P1",start:5,end:9}])})
 it("Round Robin enqueues new arrivals before the expired slice",()=>{expect(schedule(fixture,"Round Robin",2).slices.map(s=>s.id)).toEqual(["P1","P2","P3","P1","P2","P1"])})
 it("keeps CPU idle until work arrives",()=>{expect(schedule([{id:"A",arrival:3,burst:2}],"FCFS").slices).toEqual([{id:"Idle",start:0,end:3},{id:"A",start:3,end:5}])})
 it("never produces negative waiting or loses burst units",()=>{for(const algorithm of ["FCFS","SJF","SRTF","Round Robin"] as const){const result=schedule(fixture,algorithm);expect(result.metrics.every(p=>p.waiting>=0)).toBe(true);for(const p of fixture)expect(result.slices.filter(s=>s.id===p.id).reduce((sum,s)=>sum+s.end-s.start,0)).toBe(p.burst)}})
 it.each([0,-1,21,1.5])("rejects invalid quantum %s",quantum=>expect(()=>schedule(fixture,"Round Robin",quantum)).toThrow())
 it("rejects duplicate identities and unbounded work",()=>{expect(()=>schedule([fixture[0],fixture[0]],"FCFS")).toThrow();expect(()=>schedule([{id:"P",arrival:0,burst:999}],"SJF")).toThrow()})
 it("distinguishes FIFO age from LRU use",()=>{const pages=[1,2,3,1,4,1];expect(pageFaults(pages,3,"FIFO").at(-1)?.faults).toBe(5);expect(pageFaults(pages,3,"LRU").at(-1)?.faults).toBe(4)})
})
