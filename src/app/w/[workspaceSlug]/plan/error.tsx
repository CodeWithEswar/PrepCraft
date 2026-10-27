"use client"
import { Button } from "@/components/ui/button"
export default function PlanningError({reset}:{reset:()=>void}){return <section className="pc-plan-card pc-planning-loading" role="alert"><h1>Planning could not be loaded.</h1><p>Your saved work is preserved. Try loading the latest plan again.</p><Button onClick={reset}>Try again</Button></section>}
