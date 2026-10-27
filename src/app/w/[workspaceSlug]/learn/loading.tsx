import { Skeleton } from "@/components/ui/skeleton"
export default function Loading(){return <div role="status" aria-label="Loading learning content" className="grid gap-4"><Skeleton className="h-24 w-full rounded-xl"/><Skeleton className="h-64 w-full rounded-xl"/><Skeleton className="h-80 w-full rounded-xl"/><span className="sr-only">Loading curriculum and learning evidence…</span></div>}
