import "server-only"
import { createClient } from "@/lib/supabase/server"
import { resolveWorkspace } from "@/features/workspaces/server"
import { logEvent } from "@/lib/observability/logger.server"
import type { Json } from "@/lib/supabase/types"
import { DEFAULT_FILTERS,type RevisionSnapshot,type RevisionFilters,type RevisionCursor,type RevisionDetail } from "../types/revision.types"
import { queueSchema } from "../schemas/revision.schema"
export async function getRevisionQueue(slug:string,filters:RevisionFilters=DEFAULT_FILTERS,cursor:RevisionCursor|null=null):Promise<RevisionSnapshot>{
 const input=queueSchema.parse({slug,filters,cursor}),context=await resolveWorkspace(slug)
 if(!context?.permissions.canView)throw new Error("Revision access unavailable")
 const db=await createClient(),start=performance.now()
 const {data,error}=await db.rpc("revision_queue",{p_slug:slug,p_filters:input.filters as unknown as Json,p_cursor:input.cursor as unknown as Json})
 if(error||!data){logEvent("error","revision.queue.failed",{code:error?.code||"empty"});throw new Error("The revision queue could not be loaded.")}
 const raw=data as unknown as RevisionSnapshot
 if(raw.workspace.id!==context.workspace.id||raw.workspace.userId!==context.membership.userId)throw new Error("Revision scope mismatch")
 const last=raw.items[39]
 logEvent("info","revision.queue.loaded",{durationMs:performance.now()-start})
 return {...raw,items:raw.items.slice(0,40),nextCursor:raw.items.length>40&&last?{asOf:new Date(raw.asOf).toISOString(),rank:Number(last.rank||0),due:last.due_at,id:last.id}:null}
}
export async function getRevisionDetail(slug:string,id:string,before?:{at:string;id:string}):Promise<RevisionDetail>{
 if(!/^[0-9a-f-]{36}$/i.test(id)||before&&(!Number.isFinite(Date.parse(before.at))||!/^[0-9a-f-]{36}$/i.test(before.id)))throw new Error("Revision unavailable")
 const context=await resolveWorkspace(slug);if(!context?.permissions.canView)throw new Error("Revision access unavailable")
 const db=await createClient(),{data,error}=await db.rpc("revision_detail",{p_slug:slug,p_item:id,p_before:before?.at,p_before_id:before?.id})
 if(error||!data)throw new Error("Revision detail could not be loaded.")
 const detail=data as unknown as RevisionDetail
 if(detail.item.workspace_id!==context.workspace.id||detail.item.user_id!==context.membership.userId)throw new Error("Revision scope mismatch")
 return detail
}
