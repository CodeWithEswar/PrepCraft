"use client"
import Image from "next/image"
import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { AppIcon } from "@/components/app-icon"
import { useReducedMotionPreference } from "../../motion/use-fine-pointer"

const visuals = [
  {file:"01-practice",label:"Practice with intention",detail:"The approach matters as much as the answer."},
  {file:"02-patterns",label:"Find the pattern",detail:"Recognize the structure. Build the solution."},
  {file:"03-mistakes",label:"Keep the useful lesson",detail:"Understand the cause. Change the next attempt."},
  {file:"04-revision",label:"Make the learning last",detail:"Bring it back before it fades."},
  {file:"05-readiness",label:"See the evidence",detail:"Know where your next session belongs."},
] as const
const subscribe = () => () => {}

export function HeroVisualWorld() {
  const ref=useRef<HTMLDivElement>(null)
  const [active,setActive]=useState(0),[paused,setPaused]=useState(false),[visible,setVisible]=useState(false)
  const reduced=useReducedMotionPreference()
  const enhanced=useSyncExternalStore(subscribe,()=>true,()=>false)
  useEffect(()=>{
    if(!ref.current) return
    let inView=false
    const update=()=>setVisible(inView&&!document.hidden)
    const observer=new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;update()})
    observer.observe(ref.current);document.addEventListener("visibilitychange",update)
    return ()=>{observer.disconnect();document.removeEventListener("visibilitychange",update)}
  },[])
  useEffect(()=>{
    if(paused||reduced||!visible) return
    const timer=window.setTimeout(()=>setActive(current=>(current+1)%visuals.length),7000)
    return ()=>clearTimeout(timer)
  },[active,paused,reduced,visible])
  const move=(direction:number)=>setActive(current=>(current+direction+visuals.length)%visuals.length)
  return <div ref={ref} className="mk-hero-visual-world" data-enhanced={enhanced} data-paused={paused||reduced||!visible} role="region" aria-roledescription="carousel" aria-label="Preparation concepts">
    <div className="pc-hero-artwork" aria-hidden="true"><div className="pc-hero-orbit"/>{visuals.map((item,i)=><motion.div key={item.file} className="pc-hero-slide" data-active={active===i} initial={false} animate={{opacity:active===i?1:0,x:active===i?0:reduced?0:8}} transition={{duration:reduced?0:.42,ease:[.2,0,0,1]}}><Image src={`/brand/landing/hero-gallery/${item.file}-studio.webp`} alt="" width={1000} height={800} sizes="(max-width:767px) 92vw, (max-width:1099px) 50vw, 680px" preload={i===0}/></motion.div>)}</div>
    <div className="pc-hero-art-caption"><div><strong>{visuals[active].label}</strong><span>{visuals[active].detail}</span></div><span className="type-mono">0{active+1}<small> / 05</small></span></div>
    <div className="pc-hero-art-controls"><div className="pc-hero-slide-select" aria-label="Choose a preparation concept">{visuals.map((item,i)=><button key={item.file} type="button" aria-label={`Show ${item.label.toLowerCase()}`} aria-pressed={active===i} onClick={()=>setActive(i)}><span/></button>)}</div><div className="pc-hero-slide-buttons"><Button variant="ghost" size="sm" onClick={()=>setPaused(current=>!current)} disabled={reduced} aria-pressed={paused||reduced}>{reduced?"Motion reduced":paused?"Resume slideshow":"Pause slideshow"}</Button><Button variant="ghost" size="icon" aria-label="Previous preparation concept" onClick={()=>move(-1)}><AppIcon icon="arrow-left" size={18}/></Button><Button variant="ghost" size="icon" aria-label="Next preparation concept" onClick={()=>move(1)}><AppIcon icon="arrow-right" size={18}/></Button></div></div>
  </div>
}
