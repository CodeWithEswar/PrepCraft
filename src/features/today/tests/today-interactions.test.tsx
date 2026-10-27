import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TodayDashboard } from "../components/today-command-center"
import { assembleToday } from "../services/today-service"
import type { TodayContext, TodayPlan, TodayTask } from "../types/today.types"
import { mutateTodayAction, loadTodayAction } from "../server/mutations"
import { todayKeys } from "../services/query-keys"

vi.setConfig({testTimeout:20000})

const {refresh}=vi.hoisted(()=>({refresh:vi.fn()}))
vi.mock("next/navigation",()=>({useRouter:()=>({refresh})}))
vi.mock("../server/mutations",()=>({mutateTodayAction:vi.fn(),loadTodayAction:vi.fn()}))
vi.mock("motion/react",async importOriginal=>({...await importOriginal<typeof import("motion/react")>(),useReducedMotion:()=>true}))
const now="2026-10-24T07:00:00Z"
const context:TodayContext={workspaceId:"w1",slug:"general",name:"General",timezone:"Asia/Kolkata",role:"SDE",company:null,targetDate:null,dailyMinutes:120,weeklyTargetMinutes:600,studyDays:[],hasCurriculum:true,contextVersion:"v1",canEdit:true}
const plan:TodayPlan={id:"p1",workspaceId:"w1",dayKey:"2026-10-24",timezone:context.timezone,status:"active",plannedMinutes:30,contextVersion:"v1",createdAt:now}
const task:TodayTask={id:"00000000-0000-4000-8000-000000000001",workspaceId:"w1",planId:"p1",dayKey:plan.dayKey,title:"Review SQL joins",notes:"Explain inner and left joins.",type:"fundamentals",source:"custom",sourceId:null,estimatedMinutes:30,required:true,status:"planned",dueAt:null,order:0,createdAt:now,startedAt:null,completedAt:null,version:0}
const snapshot=(tasks=[task])=>assembleToday({context,plan,tasks,now})
const clients:QueryClient[]=[]
function mount(){const client=new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}});clients.push(client);client.setQueryData(todayKeys.snapshot(context.workspaceId,plan.dayKey),snapshot());vi.mocked(loadTodayAction).mockResolvedValue(snapshot());render(<QueryClientProvider client={client}><TodayDashboard snapshot={snapshot()}/></QueryClientProvider>);return client}
beforeEach(()=>{vi.mocked(mutateTodayAction).mockReset();vi.mocked(loadTodayAction).mockReset();Object.defineProperty(window,"matchMedia",{writable:true,value:vi.fn().mockImplementation(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}))})})
afterEach(()=>{cleanup();clients.splice(0).forEach(client=>client.clear())})

it("promotes the next action only after confirmed completion and does not manufacture focused time",async()=>{
  const started={...task,status:"in_progress" as const,version:1,startedAt:now}
  const done={...started,status:"completed" as const,version:2,completedAt:now}
  vi.mocked(mutateTodayAction).mockResolvedValueOnce({success:true,snapshot:snapshot([started])}).mockResolvedValueOnce({success:true,snapshot:snapshot([done])})
  mount()
  fireEvent.click(screen.getByRole("button",{name:"Start this task"}))
  await waitFor(()=>expect(screen.getByRole("button",{name:"Complete task"})).toBeEnabled(),{timeout:10000})
  fireEvent.click(screen.getByRole("button",{name:"Complete task"}))
  expect(await screen.findByRole("heading",{name:"Your required preparation is complete."},{timeout:10000})).toBeVisible()
  expect(screen.getByText("Focused time not available",{exact:true})).toBeVisible()
  expect(mutateTodayAction).toHaveBeenLastCalledWith(expect.objectContaining({kind:"complete",version:1,slug:"general",dayKey:"2026-10-24"}))
})
it("keeps the current task and explains failure when a mutation is rejected",async()=>{
  vi.mocked(mutateTodayAction).mockResolvedValue({success:false,error:"Task changed. Refresh and try again."})
  mount();fireEvent.click(screen.getByRole("button",{name:"Start this task"}))
  expect(await screen.findByRole("alert",{},{timeout:10000})).toHaveTextContent("Task changed")
  expect(screen.getByRole("button",{name:"Start this task"})).toBeVisible()
  expect(screen.queryByRole("button",{name:"Complete task"})).not.toBeInTheDocument()
})
it("explains the actual recommendation without exposing a numeric score",async()=>{
  mount();fireEvent.click(screen.getByRole("button",{name:"Why this task?"}))
  const explanation=await screen.findByRole("dialog",{name:"Why this is next"})
  expect(explanation).toHaveTextContent("This unfinished task is part of your current preparation plan.")
  expect(explanation).not.toHaveTextContent("score")
})
