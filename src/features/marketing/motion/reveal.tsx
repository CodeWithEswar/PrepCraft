"use client"
import type { ReactNode } from "react"
import { motion } from "motion/react"
import { useReducedMotionPreference as useReducedMotion } from "./use-fine-pointer"

/** Content stays visible in server HTML, including when JavaScript is disabled. */
export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduced = useReducedMotion()
  return <motion.div className={className} initial={false} animate={{ opacity: reduced ? 1 : [.9, 1], y: reduced ? 0 : [6, 0] }} transition={{ duration: reduced ? 0 : .42, delay: reduced ? 0 : delay, ease: [.2, 0, 0, 1] }}>{children}</motion.div>
}
