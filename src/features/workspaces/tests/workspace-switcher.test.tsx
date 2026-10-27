import { beforeEach, expect, it, vi } from "vitest"
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WorkspaceSwitcher } from "../components/workspace-switcher"
import type { WorkspaceListItem } from "../types/workspace.types"

const {push}=vi.hoisted(()=>({push:vi.fn()}))
vi.mock("next/navigation",()=>({useRouter:()=>({push}),usePathname:()=>"/w/general/practice"}))
vi.mock("../server/mutations",()=>({switchWorkspaceAction:vi.fn(),createWorkspaceAction:vi.fn()}))
vi.mock("../components/create-workspace-dialog",()=>({CreateWorkspaceDialog:()=>null}))
// Exercise the live switching workflow independently of popup positioning.
vi.mock("../components/workspace-picker",()=>({WorkspacePicker:({onSelectWorkspace,workspaces,error}:{onSelectWorkspace:(workspace:WorkspaceListItem)=>void;workspaces:WorkspaceListItem[];error?:string})=><div><button onClick={()=>onSelectWorkspace(workspaces[1])}>Switch to Amazon</button>{error&&<p role="alert">{error}</p>}</div>}))

const general:WorkspaceListItem={id:"general",name:"General",slug:"general",status:"active",targetCompany:null,targetRole:null,targetDate:null,weeklyMinutes:600,preparationLevel:null,interviewLanguage:null,role:"owner",updatedAt:"2026-10-24"}
const amazon={...general,id:"amazon",slug:"amazon",name:"Amazon"}
beforeEach(()=>{cleanup();push.mockReset()})

it("keeps the current workspace and its cache when switching is denied",async()=>{
  const queryClient=new QueryClient()
  queryClient.setQueryData(["workspaces","general","detail"],{name:"General"})
  render(<QueryClientProvider client={queryClient}><WorkspaceSwitcher currentWorkspace={general} workspaces={[general,amazon]} onSwitchAction={async()=>({success:false,error:"Workspace access is unavailable."})}/></QueryClientProvider>)
  fireEvent.click(screen.getByRole("button",{name:"Switch to Amazon"}))
  expect(await screen.findByRole("alert")).toHaveTextContent("Workspace access is unavailable.")
  expect(push).not.toHaveBeenCalled()
  expect(queryClient.getQueryData(["workspaces","general","detail"])).toEqual({name:"General"})
})

it("clears only the previous workspace cache after a successful switch",async()=>{
  const queryClient=new QueryClient()
  queryClient.setQueryData(["workspaces","general","detail"],{name:"General"})
  queryClient.setQueryData(["workspaces","amazon","detail"],{name:"Amazon"})
  render(<QueryClientProvider client={queryClient}><WorkspaceSwitcher currentWorkspace={general} workspaces={[general,amazon]} onSwitchAction={async()=>({success:true})}/></QueryClientProvider>)
  fireEvent.click(screen.getByRole("button",{name:"Switch to Amazon"}))
  await waitFor(()=>expect(push).toHaveBeenCalledWith("/w/amazon/practice"))
  expect(queryClient.getQueryData(["workspaces","general","detail"])).toBeUndefined()
  expect(queryClient.getQueryData(["workspaces","amazon","detail"])).toEqual({name:"Amazon"})
})
