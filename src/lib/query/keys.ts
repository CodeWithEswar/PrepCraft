/** Scoped prefixes are stable across modules; personal domains always include the user. */
export const queryKeys={
 workspace:(workspaceId:string)=>["workspaces",workspaceId] as const,
 today:(workspaceId:string,day?:string)=>day?["workspaces",workspaceId,"today",day] as const:["workspaces",workspaceId,"today"] as const,
 planning:(workspaceId:string)=>["workspaces",workspaceId,"planning"] as const,
 personal:(workspaceId:string,userId:string,domain:string)=>["workspaces",workspaceId,domain,userId] as const,
 notifications:(workspaceId:string,userId:string)=>["workspaces",workspaceId,"notifications",userId] as const,
 files:(workspaceId:string,userId:string)=>["workspaces",workspaceId,"files",userId] as const,
 readiness:(workspaceId:string,userId:string)=>["workspaces",workspaceId,"readiness",userId] as const,
}
