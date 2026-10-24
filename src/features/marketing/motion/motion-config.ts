export const motionTiming = { fast:.12, standard:.22, slow:.42, assembly:.65 } as const
export const springs = {
  magnetic: { stiffness:260, damping:25, mass:.45 },
  soft: { stiffness:100, damping:30, mass:.8 },
  layout: { stiffness:180, damping:26, mass:.6 },
} as const
