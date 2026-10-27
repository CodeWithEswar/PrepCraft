"use client"
import { Button } from "@/components/ui/button"
export default function LearningError({reset}:{reset:()=>void}){return <section className="glass rounded-xl p-6" role="alert"><h2 className="text-xl font-semibold">Learning content is unavailable.</h2><p className="my-3 text-sm text-muted-foreground">The curriculum or session could not be loaded. Saved attempts and workspace notes are preserved.</p><Button onClick={reset}>Retry learning content</Button></section>}
