import { queryKeys } from "@/lib/query/keys"
export const todayKeys={snapshot:(workspaceId:string,dayKey:string)=>queryKeys.today(workspaceId,dayKey),week:(workspaceId:string,weekKey:string)=>[...queryKeys.workspace(workspaceId),"week",weekKey] as const}
