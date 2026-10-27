import { Skeleton } from "@/components/ui/skeleton"
export default function MasteryLoading(){return <div role="status" className="grid gap-4"><span className="sr-only">Loading mastery evidence</span><Skeleton className="h-24 rounded-xl"/><Skeleton className="h-32 rounded-xl"/><Skeleton className="h-80 rounded-xl"/><Skeleton className="h-72 rounded-xl"/></div>}
