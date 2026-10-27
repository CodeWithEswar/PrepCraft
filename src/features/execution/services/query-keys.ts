import { queryKeys } from "@/lib/query/keys"
export const executionKeys={session:(workspaceId:string,userId:string,sessionId:string)=>[...queryKeys.personal(workspaceId,userId,"execution"),sessionId] as const,active:(workspaceId:string,userId:string)=>[...queryKeys.personal(workspaceId,userId,"execution"),"active"] as const}
