"use client"
import type { CSSProperties, ReactNode } from "react"
import { motion, useMotionTemplate, useMotionValue } from "motion/react"
import { useFinePointer } from "./use-fine-pointer"
export function FocusLens({ children }: { children:ReactNode }) {
  const fine = useFinePointer(), x = useMotionValue(50), y = useMotionValue(50)
  const cx = useMotionTemplate`${x}%`, cy = useMotionTemplate`${y}%`
  return <motion.div className="mk-focus-lens" data-motion="focus-lens" style={{"--lens-x":cx,"--lens-y":cy} as CSSProperties} onPointerMove={event => { if (!fine) return; const rect = event.currentTarget.getBoundingClientRect(); x.set((event.clientX-rect.left)/rect.width*100); y.set((event.clientY-rect.top)/rect.height*100) }}>{children}<span className="mk-lens-shade" aria-hidden="true" /></motion.div>
}
