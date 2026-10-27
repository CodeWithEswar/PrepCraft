import { connection } from "next/server"
import { NotificationsPage } from "@/features/notifications"
import { getNotificationBootstrap } from "@/features/notifications/server"
export const instant=false
export default async function Page({params}:{params:Promise<{workspaceSlug:string}>}){await connection();const {workspaceSlug}=await params;return <NotificationsPage initial={await getNotificationBootstrap(workspaceSlug)}/>}
