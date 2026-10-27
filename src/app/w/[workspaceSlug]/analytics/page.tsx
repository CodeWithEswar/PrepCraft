import { connection } from "next/server"
import { AnalyticsPage } from "@/features/analytics"
import { analyticsRouteSnapshot } from "@/features/analytics/server"
export const instant=false
export default async function Page({params,searchParams}:{params:Promise<{workspaceSlug:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){await connection();const {workspaceSlug}=await params,snapshot=await analyticsRouteSnapshot(workspaceSlug,"overview",await searchParams);return <AnalyticsPage key={JSON.stringify(snapshot.filters)} snapshot={snapshot}/>}
