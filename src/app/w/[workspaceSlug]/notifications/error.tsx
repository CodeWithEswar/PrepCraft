"use client"
import { Button } from "@/components/ui/button"
export default function Error({reset}:{reset:()=>void}){return <section role="alert" className="pc-not-empty pc-not-theme"><h1>Notifications are temporarily unavailable.</h1><p>Your saved reminders and inbox state have not changed.</p><Button onClick={reset}>Retry inbox</Button></section>}
