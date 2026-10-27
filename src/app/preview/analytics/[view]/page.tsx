import { connection } from "next/server"
import { notFound } from "next/navigation"
import { AnalyticsPage,type AnalyticsView } from "@/features/analytics"
import { analyticsRouteSnapshot } from "@/features/analytics/server"
export const instant=false
export default async function Page({params,searchParams}:{params:Promise<{view:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){await connection();const {view}=await params;if(!["dsa","timing","consistency","interviews","topics"].includes(view))notFound();const snapshot=await analyticsRouteSnapshot("preview",view as AnalyticsView,await searchParams,true);return <AnalyticsPage key={view+JSON.stringify(snapshot.filters)} snapshot={snapshot}/>}
