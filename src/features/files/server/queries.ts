import "server-only"
import { createClient } from "@/lib/supabase/server"
import { filesSchema,slugSchema,cursorSchema } from "../schema"
export async function getPrivateFiles(slug:string,cursor:unknown=null){slugSchema.parse(slug);const db=await createClient(),{data,error}=await db.rpc("platform_files",{p_slug:slug,p_cursor:cursorSchema.parse(cursor)});if(error)throw Error("Your files could not be loaded. Please retry.");return filesSchema.parse(data)}
