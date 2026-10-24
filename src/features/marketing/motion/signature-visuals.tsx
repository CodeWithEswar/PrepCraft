"use client"
import { useRef } from "react"
import { motion, useInView, useScroll, useTransform } from "motion/react"
import { motionTiming } from "./motion-config"
import { useFinePointer, useReducedMotionPreference as useReducedMotion } from "./use-fine-pointer"

const weavePaths = [
  "M18 42C100 42 125 190 200 190S300 54 382 54",
  "M18 96C110 96 122 42 205 84S285 202 382 202",
  "M18 158C95 158 137 224 206 160S292 82 382 110",
  "M18 218C112 218 135 118 200 118S290 166 382 160",
]
export function KnowledgeWeave({ stage }: { stage:number }) {
  const reduced = useReducedMotion()
  return <svg className="mk-knowledge-weave" viewBox="0 0 400 250" aria-hidden="true" data-motion="knowledge-weave">
    {weavePaths.map((d,i) => <g key={d}><path d={d} fill="none" stroke="currentColor" strokeOpacity=".12" /><motion.path d={d} fill="none" stroke="currentColor" strokeWidth={i === 2 ? 1.5 : 1} initial={false} animate={{ pathLength:reduced ? 1 : Math.max(0,Math.min(1,(stage + 1 - i) * .5)),opacity:i === 2 ? .6 : .3 }} transition={{duration:reduced ? 0 : motionTiming.slow}} /></g>)}
    <circle cx="200" cy="118" r="3" fill="currentColor" opacity=".7" />
  </svg>
}

export function RevisionEcho() {
  const ref = useRef<SVGSVGElement>(null), visible = useInView(ref,{ once:true }), reduced = useReducedMotion()
  return <svg ref={ref} className="mk-revision-echo" viewBox="0 0 340 100" role="img" aria-label="A learning event propagates through future review layers and returns to reinforce memory" data-motion="revision-echo">
    <path d="M28 53C100 12 235 88 310 45" fill="none" stroke="currentColor" strokeOpacity=".18" />
    {[0,1,2,3].map(i => <motion.g key={i} className="mk-echo-layer" initial={false} animate={visible && !reduced ? {opacity:[.25,.85,.55],y:[-3,0,0]} : {opacity:.55,y:0}} transition={{ duration:motionTiming.slow,delay:reduced ? 0 : i * motionTiming.fast }}><path d="M0 0L42 -13L67 3L25 16Z" transform={`translate(${42 + i * 66} ${38 + i * 8})`} fill="var(--surface-elevated)" stroke="currentColor" strokeWidth="1" /><path d={`M${65 + i*66} ${40+i*8}L${42+i*66} ${53+i*8}`} stroke="currentColor" opacity=".4" /></motion.g>)}
    <motion.rect x="20" y="47" width="11" height="11" rx="2" fill="currentColor" initial={false} animate={visible && !reduced ? {opacity:[.35,.35,1],scale:[.9,.9,1]} : {opacity:1,scale:1}} transition={{duration:.8}} />
  </svg>
}

const dimensions = [
  { label: "DSA", dx: -16, dy: -10 },
  { label: "Java", dx: 0, dy: -14 },
  { label: "CS fundamentals", dx: 16, dy: -10 },
  { label: "Projects", dx: -14, dy: 12 },
  { label: "Behavioral", dx: 0, dy: 14 },
  { label: "Timed practice", dx: 14, dy: 12 },
]
function EvidencePlane({ item, progress, settled }: { item: typeof dimensions[number]; progress: ReturnType<typeof useScroll>["scrollYProgress"]; settled: boolean }) {
  const x = useTransform(progress, [0, 1], [item.dx, 0])
  const y = useTransform(progress, [0, 1], [item.dy, 0])
  const opacity = useTransform(progress, [0, 1], [0.65, 1])
  return (
    <motion.li
      className={item.label === "Timed practice" ? "mk-evidence-plane mk-evidence-unresolved" : "mk-evidence-plane"}
      style={{
        x: settled ? 0 : x,
        y: settled ? 0 : y,
        opacity: settled ? 1 : opacity,
      }}
    >
      <span>{item.label}</span>
    </motion.li>
  )
}
export function ReadinessConvergence() {
  const ref = useRef<HTMLDivElement>(null), reduced = useReducedMotion(), fine = useFinePointer()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end center"] })
  return (
    <div ref={ref} className="mk-readiness-convergence" data-motion="readiness-convergence">
      <ul aria-label="Preparation evidence converging toward readiness">
        {dimensions.map(item => (
          <EvidencePlane key={item.label} item={item} progress={scrollYProgress} settled={Boolean(reduced) || !fine} />
        ))}
      </ul>
      <p>Bring the evidence together. Keep the next gap visible.</p>
    </div>
  )
}
