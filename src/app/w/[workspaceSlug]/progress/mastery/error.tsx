"use client"
import { Button } from "@/components/ui/button"
export default function MasteryError({reset}:{reset:()=>void}){return <section role="alert" className="rounded-xl border bg-card p-8 text-card-foreground"><h1 className="text-xl font-semibold">Mastery evidence is temporarily unavailable.</h1><p className="my-4 text-sm text-muted-foreground">Your source attempts and review history are preserved. Try loading the interpretation again.</p><Button onClick={reset}>Try again</Button></section>}
