"use client"
import { Button } from "@/components/ui/button"
export default function Error({retry}:{retry:()=>void}){return <section role="alert"><h1>Analytics is temporarily unavailable.</h1><p>Your source records are unchanged. Try loading your workspace evidence again.</p><Button onClick={retry}>Retry Analytics</Button></section>}
