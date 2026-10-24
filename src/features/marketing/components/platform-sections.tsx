"use client"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { AppIcon } from "@/components/app-icon"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useReducedMotionPreference } from "../motion/use-fine-pointer"
import { StartPreview } from "./start-preview"

const subjects=["DSA","Java","SQL & DBMS","Operating systems","Computer networks","Projects","Behavioral","Timed practice"]
export function SubjectTicker() {
  const ref=useRef<HTMLDivElement>(null)
  const [paused,setPaused]=useState(false),[visible,setVisible]=useState(false)
  const reduced=useReducedMotionPreference()
  useEffect(()=>{
    if(!ref.current) return
    let inView=false
    const update=()=>setVisible(inView&&!document.hidden)
    const observer=new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;update()})
    observer.observe(ref.current);document.addEventListener("visibilitychange",update)
    return ()=>{observer.disconnect();document.removeEventListener("visibilitychange",update)}
  },[])
  return <div ref={ref} className="pc-subject-strip" data-paused={paused||reduced||!visible}><div className="container-page pc-subject-heading"><p>A preparation workspace for the skills that matter.</p><Button variant="ghost" size="sm" onClick={()=>setPaused(value=>!value)} disabled={reduced}>{reduced?"Motion reduced":paused?"Resume topics":"Pause topics"}</Button></div><div className="pc-subject-window"><div className="pc-subject-track">{[0,1].map(copy=><div key={copy} className="pc-subject-sequence" aria-hidden={copy===1}>{subjects.map(subject=><span key={subject}>{subject}<i/></span>)}</div>)}</div></div></div>
}

export function PreparationSpotlight() {
  return <section className="container-page pc-spotlight" aria-labelledby="spotlight-heading"><div><p className="mk-kicker">From scattered effort to a clear next step</p><h2 id="spotlight-heading">Your preparation.<br/><span>Working together.</span></h2><p>Practice, reflection, revision, and readiness.<br/>Connected around the way you actually learn.</p><Button render={<a href="#workflow"/>} nativeButton={false} role="link" variant="outline">Explore the system <AppIcon icon="arrow-right" size={16}/></Button></div><Image src="/brand/landing/hero-gallery/05-readiness-studio.webp" alt="" width={1000} height={800} sizes="(max-width:767px) 70vw, 460px"/></section>
}

const paths=[
  {id:"start",label:"Finding your starting point",heading:"Start with clarity.",accent:"Build a useful foundation.",copy:"You don’t need every resource at once. Choose a focus, try a question, and let the result show you what needs attention.",steps:["Set one realistic weekly priority","Practice and capture your approach","Revisit the lesson while it is fresh"],image:"01-practice-studio",caption:"An intentional first session"},
  {id:"consistency",label:"Building consistency",heading:"Keep the progress.",accent:"Make room to return.",copy:"Balance new work with the questions and concepts worth revisiting. Build a preparation rhythm that fits your actual week.",steps:["Give each session a clear intention","See the patterns in your mistakes","Keep revision alongside new practice"],image:"04-revision-studio",caption:"A rhythm that makes learning last"},
  {id:"interview",label:"Getting interview ready",heading:"Know the evidence.",accent:"Prepare for the conversation.",copy:"Bring your project stories, fundamentals, and upcoming interviews into view. Find the next gap instead of chasing a perfect score.",steps:["Review your preparation by dimension","Practice explaining your decisions","Connect the next deadline to your plan"],image:"05-readiness-studio",caption:"Confidence with context"},
] as const
export function PreparationPaths() {
  return <section className="mk-section pc-preparation-paths" id="preparation-path" aria-labelledby="paths-heading"><div className="container-page"><div className="pc-section-heading"><div><p className="mk-kicker">Built around your next move</p><h2 id="paths-heading">Different starting points.<br/><span>A more deliberate way forward.</span></h2></div><div className="pc-heading-icons" aria-hidden="true"><AppIcon icon="book" size={28}/><AppIcon icon="code" size={28}/><AppIcon icon="folder" size={28}/></div></div><Tabs defaultValue="start" className="pc-path-tabs"><TabsList variant="line" aria-label="Preparation stages">{paths.map(item=><TabsTrigger key={item.id} value={item.id}>{item.label}</TabsTrigger>)}</TabsList>{paths.map(item=><TabsContent key={item.id} value={item.id}><div className="pc-path-banner"><div className="pc-path-copy"><p className="mk-kicker">{item.caption}</p><h3>{item.heading}<br/><span>{item.accent}</span></h3><p>{item.copy}</p><ul>{item.steps.map(step=><li key={step}><AppIcon icon="check-circle" size={18}/>{step}</li>)}</ul><StartPreview label="Find your next step"/></div><Image src={`/brand/landing/hero-gallery/${item.image}.webp`} alt="" width={1000} height={800} sizes="(max-width:767px) 92vw, 550px"/></div></TabsContent>)}</Tabs></div></section>
}

export function LearningEditorial() {
  return <section className="mk-section pc-editorial" aria-labelledby="editorial-heading"><div className="container-page"><p className="mk-kicker">Make the learning visible</p><h2 id="editorial-heading">Better preparation is built<br/>between the attempts.</h2><div className="pc-editorial-grid"><article><AppIcon icon="book" size={26}/><p className="mk-kicker">A little more understanding</p><h3>A solved question should leave<br/><span>more than a checkmark.</span></h3><p>The pattern you recognized. The edge case you missed. The explanation you can now give. Keep the useful parts of every attempt.</p><a href="#practice">Try the reflection preview <AppIcon icon="arrow-right" size={16}/></a></article><article><AppIcon icon="calendar" size={26}/><p className="mk-kicker">A little more direction</p><h3>Let the next session<br/><span>start with a reason.</span></h3><p>Bring the lesson back into the plan, so your history helps you decide where to focus next.</p><a href="#readiness">Explore readiness <AppIcon icon="arrow-right" size={16}/></a></article></div></div></section>
}
