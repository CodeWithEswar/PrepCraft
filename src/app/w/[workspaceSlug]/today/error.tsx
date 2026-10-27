"use client"
import { Button } from "@/components/ui/button"
export default function TodayError({reset}:{error:Error&{digest?:string};reset:()=>void}){return <section className="pc-today pc-today-focus" role="alert"><h1>Today could not be loaded.</h1><p>Your preparation is safe. Refresh to restore an authorized, up-to-date view of the day.</p><Button onClick={reset}>Try again</Button></section>}
