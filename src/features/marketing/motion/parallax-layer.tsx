"use client"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { motion, useScroll, useTransform, useSpring } from "motion/react"
import { useReducedMotionPreference } from "./use-fine-pointer"

export function ParallaxLayer({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [desktop, setDesktop] = useState(false)
  const reduced = useReducedMotionPreference()
  useEffect(() => {
    const media = matchMedia("(min-width: 1100px) and (pointer: fine)")
    const update = () => setDesktop(media.matches)
    update(); media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
  const offset = useTransform(scrollYProgress, [0, 1], [0, -16])
  const y = useSpring(offset, { stiffness: 100, damping: 30 })
  return <motion.div ref={ref} className="mk-parallax" style={{ y: desktop && !reduced ? y : 0 }}>{children}</motion.div>
}
