import type { ShellNavGroup } from "./shell.types"

/** Presentation navigation shared by the live shell and its isolated preview. */
export function preparationNavigation(hrefFor: (section:string)=>string):ShellNavGroup[] {
  return [
    {label:"Practice",icon:"code",items:[{label:"DSA",icon:"code",href:hrefFor("practice")},{label:"Learn",icon:"book",href:hrefFor("learn")},{label:"Timed practice",icon:"clock",href:hrefFor("timed-practice")},{label:"Questions",icon:"help",href:hrefFor("questions")}]},
    {label:"Interview",icon:"user",items:[{label:"Mock interviews",icon:"target",href:hrefFor("mocks")},{label:"Behavioral",icon:"flame",href:hrefFor("behavioral")},{label:"Company prep",icon:"building",href:hrefFor("interview")},{label:"Project prep",icon:"folder",href:hrefFor("projects")},{label:"Interview tracker",icon:"calendar",href:hrefFor("interview-tracker")}]},
    {label:"Plan & progress",icon:"chart",items:[{label:"Study planner",icon:"calendar",href:hrefFor("plan")},{label:"Mastery",icon:"chart",href:hrefFor("progress")},{label:"Analytics",icon:"chart",href:hrefFor("analytics")},{label:"Mistake journal",icon:"bookmark",href:hrefFor("mistakes")},{label:"Revision",icon:"clock",href:hrefFor("revision")},{label:"Pattern recognition",icon:"sparkles",href:hrefFor("patterns")}]},
    {label:"Notifications",icon:"bell",items:[{label:"Notifications",icon:"bell",href:hrefFor("notifications")}]},
    {label:"Applications",icon:"building",items:[{label:"Applications",icon:"building",href:hrefFor("applications")}]},
    {label:"Resources",icon:"book",items:[{label:"Resources",icon:"book",href:hrefFor("resources")},{label:"Files",icon:"folder",href:hrefFor("files")},{label:"Readiness",icon:"chart",href:hrefFor("progress/readiness")}]},
  ]
}
