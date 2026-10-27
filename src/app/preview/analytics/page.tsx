import { connection } from "next/server"
import { AnalyticsPage } from "@/features/analytics"
import { analyticsRouteSnapshot } from "@/features/analytics/server"
export const instant=false
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){await connection();const snapshot=await analyticsRouteSnapshot("preview","overview",await searchParams,true);return <AnalyticsPage key={JSON.stringify(snapshot.filters)} snapshot={snapshot}/>}
