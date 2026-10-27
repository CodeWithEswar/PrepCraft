"use server"
import "server-only"
import { z } from "zod"
import { behavioralPreview,behavioralPreviewDetail } from "./preview"
import { filtersSchema } from "../schemas/behavioral.schema"
export async function previewBehavioralDetailAction(id:string){if(!z.uuid().safeParse(id).success)return null;return behavioralPreviewDetail(id)}
export async function previewBehavioralHomeAction(frameworkId:string,input:unknown){const filters=filtersSchema.parse(input),home=behavioralPreview(undefined,frameworkId),now=Date.parse(home.context.asOf);return {...home,stories:home.stories.filter(s=>(!filters.search||`${s.title} ${s.summary} ${s.mappings.map(m=>m.name).join(' ')}`.toLowerCase().includes(filters.search.toLowerCase()))&&(filters.status==='all'||filters.status==='active'&&s.status!=='retired'||s.status===filters.status)&&(!filters.principle||s.mappings.some(m=>m.id===filters.principle))&&(!filters.type||s.story_type===filters.type)&&(!filters.confidence||s.confidence===Number(filters.confidence))&&(filters.practice==='all'||filters.practice==='never'&&!s.last_practiced_at||filters.practice==='recent'&&s.last_practiced_at&&now-Date.parse(s.last_practiced_at)<=21*86400000||filters.practice==='stale'&&s.last_practiced_at&&now-Date.parse(s.last_practiced_at)>21*86400000))}}
