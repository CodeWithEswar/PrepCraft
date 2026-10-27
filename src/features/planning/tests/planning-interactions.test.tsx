import { beforeEach,afterEach,it,expect,vi } from "vitest"
import { render,screen,fireEvent,waitFor,cleanup,within } from "@testing-library/react"
import { QueryClient,QueryClientProvider } from "@tanstack/react-query"
import { PlanningPage } from "../components/planning-page"
import { emptyPlanning } from "../services/planning-service"
import { planningKeys } from "../services/query-keys"
import { loadPlanningAction,mutatePlanningAction } from "../server/mutations"
vi.mock("../server/mutations",()=>({loadPlanningAction:vi.fn(),mutatePlanningAction:vi.fn()}))
vi.setConfig({testTimeout:25000})
const base=()=>{const s=emptyPlanning({workspaceId:"one",slug:"software",name:"Preparation",timezone:"UTC",today:"2026-10-19",company:null,role:"SDE",targetDate:null,canEdit:true,weeklyTargetMinutes:600,defaultDailyMinutes:120,studyDays:["monday","tuesday","wednesday","thursday","friday"],curriculumVersion:"v1",contextVersion:"c1",hasCurriculum:true},"2026-10-19T09:00:00Z");s.curriculum=[{id:"topic",trackId:"track",title:"Arrays",trackName:"DSA",priority:"core",type:"dsa",weight:1}];return s}
const clients:QueryClient[]=[]
function mount(snapshot=base()){const client=new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}});clients.push(client);client.setQueryData(planningKeys.week("one",snapshot.week),snapshot);vi.mocked(loadPlanningAction).mockResolvedValue(snapshot);render(<QueryClientProvider client={client}><PlanningPage snapshot={snapshot}/></QueryClientProvider>);return snapshot}
beforeEach(()=>{vi.useFakeTimers({toFake:["Date"]});vi.setSystemTime(new Date("2026-10-19T09:00:00Z"));vi.mocked(mutatePlanningAction).mockReset();Object.defineProperty(window,"matchMedia",{writable:true,value:vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}))})})
afterEach(()=>{cleanup();clients.splice(0).forEach(client=>client.clear());vi.useRealTimers()})
it("requires reviewing the proposal before any generated task is persisted",async()=>{
  const s=mount();vi.mocked(mutatePlanningAction).mockResolvedValue({success:true,snapshot:{...s,revision:1}})
  fireEvent.click(screen.getByRole("button",{name:"Build weekly plan"}))
  expect(await screen.findByRole("dialog",{name:"Review your weekly plan"})).toBeVisible()
  expect(mutatePlanningAction).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole("button",{name:"Apply reviewed proposal"}))
  await waitFor(()=>expect(mutatePlanningAction).toHaveBeenCalledWith(expect.objectContaining({slug:"software",revision:0,command:expect.objectContaining({kind:"apply",proposalKind:"generate"})})))
  await waitFor(()=>expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
})
it("preserves the task form when a capacity conflict rejects the save",async()=>{
  mount();vi.mocked(mutatePlanningAction).mockResolvedValue({success:false,error:"This change exceeds the available capacity."})
  fireEvent.click(screen.getAllByRole("button",{name:"Add task"})[0])
  const title=await screen.findByRole("textbox",{name:"Task title"});fireEvent.change(title,{target:{value:"Review SQL joins"}})
  fireEvent.click(within(screen.getByRole("dialog",{name:"Add preparation task"})).getByRole("button",{name:"Add task"}))
  await waitFor(()=>expect(screen.getAllByRole("alert").some(node=>node.textContent?.includes("available capacity"))).toBe(true))
  expect(title).toHaveValue("Review SQL joins")
  expect(screen.getByRole("dialog",{name:"Add preparation task"})).toBeVisible()
})
it("keeps calendar navigation and weekly review accessible without fabricated progress",async()=>{
  mount();fireEvent.click(screen.getByRole("button",{name:"Calendar"}))
  expect(screen.getByRole("heading",{name:"October 2026"})).toBeVisible()
  fireEvent.click(screen.getByRole("button",{name:"Review"}))
  expect(screen.getByRole("heading",{name:"Reflect, then plan forward."})).toBeVisible()
  expect(screen.getByRole("button",{name:"Close and save weekly review"})).toBeDisabled()
  expect(screen.getByText("Focused time is unavailable; task estimates are not counted as study time.")).toBeVisible()
})
