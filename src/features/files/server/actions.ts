"use server"
import "server-only"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { platformEnv } from "@/lib/env/platform"
import type { Json } from "@/lib/supabase/types"
import { fileCommandSchema,slugSchema,cursorSchema,fileSchema } from "../schema"
import { getPrivateFiles } from "./queries"
export async function loadFiles(slug:string,cursor:unknown=null){return getPrivateFiles(slug,cursorSchema.parse(cursor))}
export async function commandFile(input:unknown){
 const p=z.object({slug:slugSchema,requestId:z.uuid(),command:fileCommandSchema}).parse(input)
 if(!platformEnv.workerOrigin&&p.command.kind!=="delete")throw Error("Private storage has not been configured for this environment.")
 const db=await createClient(),{data,error}=await db.rpc("platform_file_command",{p_slug:p.slug,p_request:p.requestId,p_command:{...p.command,environment:platformEnv.environment==="preview"?"preview":"production"} as Json})
 if(error)throw Error(error.code==="40001"?"This file changed. Refresh your files before retrying.":error.code==="42501"?"You no longer have access to this file.":"The file operation could not be confirmed. Check the file type, quota and workspace status.")
 const result=z.object({file:fileSchema,token:z.string().regex(/^[a-f0-9]{64}$/).optional(),expiresIn:z.number().optional()}).parse(data)
 return {...result,workerOrigin:platformEnv.workerOrigin}
}
