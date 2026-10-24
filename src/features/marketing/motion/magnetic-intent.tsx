"use client"
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react"
import { motion, useMotionValue, useSpring, useMotionTemplate } from "motion/react"
import { springs } from "./motion-config"
import { useFinePointer } from "./use-fine-pointer"

export function MagneticIntent({ children }: { children:ReactNode }) {
  const fine = useFinePointer(), keyboard = useRef(false)
  const x = useMotionValue(0), y = useMotionValue(0), trace = useMotionValue(60)
  const sx = useSpring(x,springs.magnetic), sy = useSpring(y,springs.magnetic)
  useEffect(() => { if (!fine) { x.set(0); y.set(0) } },[fine,x,y])
  const cssX = useMotionTemplate`${sx}px`, cssY = useMotionTemplate`${sy}px`, traceX = useMotionTemplate`${trace}px`
  const reset = () => { x.set(0); y.set(0) }
  return <motion.span className="mk-intent" data-motion="magnetic-intent"
    style={{ x:fine ? sx : 0,y:fine ? sy : 0,"--intent-x":cssX,"--intent-y":cssY,"--trace-x":traceX } as CSSProperties}
    onPointerMove={event => {
      if (!fine || event.pointerType !== "mouse" || keyboard.current) return
      const bounds = event.currentTarget.getBoundingClientRect()
      x.set(Math.max(-6,Math.min(6,(event.clientX - bounds.left - bounds.width / 2) * .08)))
      y.set(Math.max(-4,Math.min(4,(event.clientY - bounds.top - bounds.height / 2) * .12)))
      trace.set(event.clientX - bounds.left)
    }} onPointerLeave={reset} onFocusCapture={() => { keyboard.current = true; reset() }} onBlurCapture={() => { keyboard.current = false }}
  >{children}</motion.span>
}
