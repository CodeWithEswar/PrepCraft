"use client"
import { Button } from "@/components/ui/button"
export default function RevisionError({reset}:{reset:()=>void}){return <section className="rounded-xl border bg-card p-8 text-card-foreground" role="alert"><h1 className="text-xl font-semibold">Revision is temporarily unavailable.</h1><p className="my-4 text-sm text-muted-foreground">Your review evidence is preserved. Try loading the queue again.</p><Button onClick={reset}>Try again</Button></section>}
