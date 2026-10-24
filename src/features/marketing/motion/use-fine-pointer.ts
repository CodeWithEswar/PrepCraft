"use client"
import { useSyncExternalStore } from "react"
const query = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)"
const subscribe = (notify:()=>void) => { const media = matchMedia(query); media.addEventListener("change",notify); return () => media.removeEventListener("change",notify) }
export function useFinePointer() { return useSyncExternalStore(subscribe, () => matchMedia(query).matches, () => false) }

const reducedQuery = "(prefers-reduced-motion: reduce)"
const subscribeReduced = (notify:()=>void) => { const media = matchMedia(reducedQuery); media.addEventListener("change",notify); return () => media.removeEventListener("change",notify) }
export function useReducedMotionPreference() { return useSyncExternalStore(subscribeReduced, () => matchMedia(reducedQuery).matches, () => false) }
