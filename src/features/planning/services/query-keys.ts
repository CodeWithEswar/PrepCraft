import { queryKeys } from "@/lib/query/keys"
export const planningKeys={all:queryKeys.planning,week:(workspaceId:string,week:string)=>[...queryKeys.planning(workspaceId),week] as const}
