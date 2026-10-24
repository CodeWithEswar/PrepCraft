"use client"
import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { motion } from "motion/react"
import { useReducedMotionPreference as useReducedMotion } from "../motion/use-fine-pointer"
import { AppIcon } from "@/components/app-icon"
import { Badge } from "@/components/ui/badge"
import { landingContent } from "../content/landing-content"
import { KnowledgeWeave, RevisionEcho } from "../motion/signature-visuals"

export function PreparationStory() {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const reduced = useReducedMotion()
  useEffect(() => {
    const stages = ref.current?.querySelectorAll<HTMLElement>("[data-story-step]")
    if (!stages) return
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.storyStep))
    }, { rootMargin: "-30% 0px -40% 0px", threshold: 0 })
    stages.forEach(stage => observer.observe(stage))
    return () => observer.disconnect()
  }, [])
  const current = landingContent.stages[active]
  return <section className="mk-section mk-story-section" id="workflow" aria-labelledby="workflow-heading">
    <div className="container-page"><div className="mk-story-intro"><div className="mk-section-heading"><p className="mk-kicker">One preparation loop</p><h2 id="workflow-heading" className="type-heading-2">The work connects.<br /><span className="mk-muted-heading">So should your workspace.</span></h2><p>From the first practice session to the next interview.<br className="mk-desktop-break" /> Keep the context that makes progress possible.</p></div><Image className="mk-story-overview" src="/brand/landing/visuals/01-focus-workspace.webp" alt="Connected focus, planning, and progress structures forming one preparation workspace" width={1200} height={750} sizes="(max-width:767px) 100vw, 380px" /></div>
      <div className="mk-story" ref={ref}><div className="mk-story-narrative">{landingContent.stages.map((stage, index) => <article key={stage.label} data-story-step={index} className={`mk-story-step ${index === active ? "mk-story-active" : ""}`}><span className="mk-step-index type-mono">0{index + 1}</span><div><p className="mk-kicker">{stage.label}</p><h3>{stage.title}</h3><p>{stage.copy}</p><span className="mk-stage-detail">{stage.detail}</span></div><Image className="mk-story-mobile-art" src={`/brand/landing/visuals/${stage.image}.webp`} alt={stage.alt} width={1200} height={stage.height} sizes="(max-width: 767px) 100vw, 1px" /></article>)}</div>
        <div className="mk-story-sticky"><div className="mk-story-frame"><div className="mk-demo-label"><span className="mk-status-dot" />Illustrative workflow<Badge variant="secondary">0{active + 1} / 06</Badge></div><div className="mk-story-spatial"><Image className="mk-story-common-core" src="/brand/landing/hero/hero-preparation-core.webp" alt="" width={1200} height={1000} sizes="(max-width:767px) 1px, 45vw" /><KnowledgeWeave stage={active} /><motion.div key={current.image} initial={false} animate={{ opacity: reduced ? 1 : [.8, 1], scale: reduced ? 1 : [.98,1] }} transition={{ duration: reduced ? 0 : .22 }}><Image src={`/brand/landing/visuals/${current.image}.webp`} alt={current.alt} width={1200} height={current.height} sizes="(max-width: 767px) 1px, 45vw" /></motion.div></div><div className="mk-story-summary"><AppIcon icon={active === 0 ? "calendar" : active === 3 ? "clock" : active === 5 ? "folder" : "book"} size={20} /><span><strong>{current.title}</strong><small>{current.detail}</small></span></div>{active === 3 && <RevisionEcho />}</div><div className="mk-story-dots" aria-hidden="true">{landingContent.stages.map((stage, i) => <span key={stage.label} className={i === active ? "is-active" : ""} />)}</div></div>
      </div>
    </div>
  </section>
}
