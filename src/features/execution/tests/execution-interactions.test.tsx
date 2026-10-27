import {beforeEach,afterEach,it,expect,vi} from "vitest"
import {render,screen,within,fireEvent,waitFor,cleanup} from "@testing-library/react"
import {QueryClient,QueryClientProvider} from "@tanstack/react-query"
import {ExecutionChamber} from "../components/execution-chamber"
import {WorkingSurface} from "../components/working-surface"
import {AttemptDebrief} from "../components/attempt-debrief"
import {executionPreviewSnapshot} from "../services/preview-snapshot"
import {executionKeys} from "../services/query-keys"
import {loadExecutionAction,mutateExecutionAction} from "../server/mutations"
import type {ExecutionSnapshot} from "../types/execution.types"
vi.setConfig({testTimeout:25000})
vi.mock("../server/mutations",()=>({loadExecutionAction:vi.fn(),mutateExecutionAction:vi.fn()}))
vi.mock("next/navigation",()=>({useRouter:()=>({push:vi.fn()})}))
vi.mock("motion/react",async original=>({...await original<typeof import("motion/react")>(),useReducedMotion:()=>true}))
const clients:QueryClient[]=[],id=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,"0")}`
let counter=100
const fixture=(mode:"practice"|"interview"|"oa"="practice")=>{const s=executionPreviewSnapshot(mode);s.session.id=id(counter++);s.session.userId=id(1);s.session.workspaceId=id(11);s.workspace={id:id(11),slug:"one",name:"One",timezone:"UTC"};s.items=s.items.map((item,index)=>({...item,id:id(counter+index),examples:[]}));counter+=10;s.session.currentItemId=s.items[0].id;s.clock={receivedAt:performance.now(),roundTripMs:0};return s}
function mount(s:ExecutionSnapshot){const client=new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}});clients.push(client);client.setQueryData(executionKeys.session(s.workspace.id,s.session.userId,s.session.id),s);vi.mocked(loadExecutionAction).mockResolvedValue({success:true,snapshot:s});render(<QueryClientProvider client={client}><ExecutionChamber snapshot={s}/></QueryClientProvider>)}
beforeEach(()=>{vi.mocked(mutateExecutionAction).mockReset();vi.mocked(loadExecutionAction).mockReset();Object.defineProperty(window,"matchMedia",{writable:true,value:vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn(),addListener:vi.fn(),removeListener:vi.fn()}))});localStorage.clear()})
afterEach(()=>{cleanup();clients.splice(0).forEach(client=>client.clear())})
it("renders confirmed Practice pause and resume rather than freezing a local counter",async()=>{
  const s=fixture(),paused={...s,session:{...s.session,status:"paused" as const,pausedAt:s.serverNow,version:1}},resumed={...s,session:{...s.session,status:"active" as const,version:2}}
  vi.mocked(mutateExecutionAction).mockResolvedValueOnce({success:true,snapshot:paused}).mockResolvedValueOnce({success:true,snapshot:resumed})
  mount(s);const header=within(document.querySelector(".pc-execution-focus-header")!)
  fireEvent.click(header.getByRole("button",{name:"Pause"}))
  await waitFor(()=>expect(header.getByRole("button",{name:"Resume"})).toBeEnabled())
  expect(mutateExecutionAction).toHaveBeenCalledWith(expect.objectContaining({command:{kind:"pause"},version:0}))
  fireEvent.click(header.getByRole("button",{name:"Resume"}))
  await waitFor(()=>expect(header.getByRole("button",{name:"Pause"})).toBeEnabled())
})
it("does not expose forbidden OA pause or hint actions",()=>{
  mount(fixture("oa"))
  expect(screen.queryByRole("button",{name:"Pause"})).not.toBeInTheDocument()
  expect(screen.queryByRole("button",{name:/Reveal hint/})).not.toBeInTheDocument()
  expect(screen.getByText("Hints are not available during an OA round.")).toBeVisible()
})
it("keeps code when the server cannot save a draft",async()=>{
  const s=fixture(),save=vi.fn().mockRejectedValue(Error("Unable to confirm this draft."))
  render(<WorkingSurface snapshot={s} item={s.items[0]} save={save} writable busy={false} online preview={false} flushRef={{current:null}}/>)
  const editor=screen.getByRole("textbox",{name:"Code editor"});fireEvent.change(editor,{target:{value:"const answer = 42"}})
  fireEvent.click(screen.getByRole("button",{name:"Save draft"}))
  expect(await screen.findByRole("alert")).toHaveTextContent("Unable to confirm")
  expect(editor).toHaveValue("const answer = 42")
})
it("saves the debrief separately from the already stopped timer",async()=>{
  const s=fixture();s.session={...s.session,status:"completed",completedAt:s.serverNow,completionReason:"user_finished"};s.attempts=[{id:id(80),itemId:s.items[0].id,durationMs:120000,targetMs:1800000,reflectionStatus:"pending",result:null,approach:"",patternId:null,timeComplexity:"",spaceComplexity:"",confidence:null,mistakes:[],notes:"",completedAt:null,revisionStatus:"pending"}]
  const save=vi.fn().mockResolvedValue(s)
  render(<AttemptDebrief snapshot={s} save={save} busy={false} online canEdit onReviewQuestion={()=>{}}/>)
  fireEvent.click(screen.getByRole("radio",{name:/Solved independently/}))
  fireEvent.click(screen.getByRole("button",{name:/5.*Confidence/}))
  fireEvent.click(screen.getByRole("radio",{name:/4.*Confident/}))
  fireEvent.click(screen.getByRole("button",{name:/8.*Follow-up/}))
  fireEvent.click(screen.getByRole("button",{name:"Save attempt"}))
  await waitFor(()=>expect(save).toHaveBeenCalledWith(expect.objectContaining({kind:"debrief",result:"solved_independently",confidence:4})))
  expect(save.mock.calls.some(([command])=>command.kind==="finish")).toBe(false)
  expect(s.attempts[0].durationMs).toBe(120000)
})
