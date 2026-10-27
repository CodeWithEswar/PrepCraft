"use client"
import { Button } from "@/components/ui/button"
export default function ExecutionError({reset}:{reset:()=>void}){return <main className="pc-execution-denied" role="alert"><h1>This session could not be restored.</h1><p>Your recorded work has not been changed. Refresh to verify the latest state.</p><Button onClick={reset}>Try again</Button></main>}
