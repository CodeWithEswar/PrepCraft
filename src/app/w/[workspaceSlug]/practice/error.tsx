"use client"
import { Button } from "@/components/ui/button"
export default function PracticeError({reset}:{reset:()=>void}){return <section className="pc-execution-setup" role="alert"><h1>Practice could not be loaded.</h1><p>Your saved sessions remain unchanged.</p><Button onClick={reset}>Try again</Button></section>}
