"use client"
import { useCallback, useEffect, useRef, useState } from "react"

class CountdownSynthesizer {
  private ctx: AudioContext | null = null

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  resume() {
    this.getContext()
  }

  playTick(pitch = 840) {
    try {
      const ctx = this.getContext()
      if (!ctx || ctx.state !== "running") return
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(pitch, ctx.currentTime)
      gain.gain.setValueAtTime(0.045, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.045)
    } catch {
      // Audio errors in restricted contexts ignored safely
    }
  }

  playWarning(pitch = 1046.5) {
    try {
      const ctx = this.getContext()
      if (!ctx || ctx.state !== "running") return
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(pitch, ctx.currentTime)
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.095)
    } catch {
      // Ignored safely
    }
  }

  playTargetReached() {
    try {
      const ctx = this.getContext()
      if (!ctx || ctx.state !== "running") return
      const notes = [523.25, 659.25, 783.99, 1046.5]
      const start = ctx.currentTime
      notes.forEach((freq, i) => {
        const osc = ctx!.createOscillator()
        const gain = ctx!.createGain()
        osc.type = "triangle"
        const time = start + i * 0.11
        osc.frequency.setValueAtTime(freq, time)
        gain.gain.setValueAtTime(0.12, time)
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.45)
        osc.connect(gain)
        gain.connect(ctx!.destination)
        osc.start(time)
        osc.stop(time + 0.46)
      })
    } catch {
      // Ignored safely
    }
  }
}

const synth = new CountdownSynthesizer()

export function useCountdownAudio({
  active,
  display,
  remainingMs,
  targetReached,
}: {
  active: boolean
  display: string
  remainingMs: number | null
  targetReached: boolean
}) {
  const [soundEnabled, setSoundEnabled] = useState(true)
  const prevDisplayRef = useRef(display)
  const prevTargetReachedRef = useRef(targetReached)
  const hasInteractedRef = useRef(false)

  // Initialize from localStorage safely
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pc-bh-sound")
      if (saved === "false") {
        // A single post-hydration update restores the persisted preference without an SSR mismatch.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSoundEnabled(false)
      }
    } catch {
      // Ignore storage access errors
    }
  }, [])

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev
      try {
        localStorage.setItem("pc-bh-sound", String(next))
      } catch {
        // Ignore storage access errors
      }
      if (next) {
        synth.resume()
        synth.playTick(1000)
      }
      return next
    })
  }, [])

  // Auto-resume audio on any user interaction
  useEffect(() => {
    const handleGesture = () => {
      if (!hasInteractedRef.current) {
        hasInteractedRef.current = true
        synth.resume()
      }
    }
    window.addEventListener("pointerdown", handleGesture, { passive: true })
    window.addEventListener("keydown", handleGesture, { passive: true })
    return () => {
      window.removeEventListener("pointerdown", handleGesture)
      window.removeEventListener("keydown", handleGesture)
    }
  }, [])

  // Handle countdown sound triggers
  useEffect(() => {
    if (!active || !soundEnabled) {
      prevDisplayRef.current = display
      prevTargetReachedRef.current = targetReached
      return
    }

    // Check if target was just reached
    if (targetReached && !prevTargetReachedRef.current) {
      synth.playTargetReached()
      prevTargetReachedRef.current = targetReached
      prevDisplayRef.current = display
      return
    }
    prevTargetReachedRef.current = targetReached

    // Only tick when the second display changes
    if (display === prevDisplayRef.current) return
    prevDisplayRef.current = display

    // Determine sound type based on remaining time
    if (remainingMs !== null) {
      const sec = Math.round(remainingMs / 1000)
      if (sec > 0 && sec <= 5) {
        synth.playWarning()
      } else if (sec > 0) {
        synth.playTick()
      }
    } else {
      synth.playTick()
    }
  }, [active, display, remainingMs, targetReached, soundEnabled])

  return { soundEnabled, toggleSound }
}
