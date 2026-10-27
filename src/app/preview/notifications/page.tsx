import { connection } from "next/server"
import { NotificationsPage } from "@/features/notifications"
import { notificationPreview } from "@/features/notifications/server"
export const instant=false
export default async function Page(){await connection();return <NotificationsPage initial={notificationPreview()}/>}
