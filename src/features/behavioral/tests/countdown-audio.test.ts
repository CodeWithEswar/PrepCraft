import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useCountdownAudio } from "../hooks/use-countdown-audio"

describe("useCountdownAudio", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it("initializes with sound enabled by default", () => {
    const { result } = renderHook(() =>
      useCountdownAudio({
        active: true,
        display: "01:20",
        remainingMs: 80000,
        targetReached: false,
      })
    )
    expect(result.current.soundEnabled).toBe(true)
  })

  it("toggles sound state and persists in localStorage", () => {
    const { result } = renderHook(() =>
      useCountdownAudio({
        active: true,
        display: "01:20",
        remainingMs: 80000,
        targetReached: false,
      })
    )

    act(() => {
      result.current.toggleSound()
    })
    expect(result.current.soundEnabled).toBe(false)
    expect(localStorage.getItem("pc-bh-sound")).toBe("false")

    act(() => {
      result.current.toggleSound()
    })
    expect(result.current.soundEnabled).toBe(true)
    expect(localStorage.getItem("pc-bh-sound")).toBe("true")
  })

  it("restores disabled sound setting from localStorage", () => {
    localStorage.setItem("pc-bh-sound", "false")
    const { result } = renderHook(() =>
      useCountdownAudio({
        active: true,
        display: "01:20",
        remainingMs: 80000,
        targetReached: false,
      })
    )
    expect(result.current.soundEnabled).toBe(false)
  })
})
