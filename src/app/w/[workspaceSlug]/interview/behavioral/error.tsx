"use client"
import { Button } from "@/components/ui/button"
export default function BehavioralError({retry}:{retry:()=>void}){return <section className="rounded-xl border bg-card p-8 text-card-foreground" role="alert"><h1 className="text-xl font-semibold">Your story portfolio could not be loaded.</h1><p className="my-4 text-sm text-muted-foreground">Saved stories and practice evidence are preserved. Retry to reconnect.</p><Button onClick={retry}>Retry portfolio</Button></section>}
