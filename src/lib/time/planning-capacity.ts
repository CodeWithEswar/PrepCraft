export interface CapacityRule {minutes:number;rest:boolean;start:string|null;end:string|null}
/** A date exception wins over a recurring weekday, then active daily plans or the workspace's configured study days. */
export function resolveDayCapacity(
  day: string,
  context: { studyDays: string[]; defaultDailyMinutes: number },
  rules: (CapacityRule & { weekday: number })[],
  overrides: (CapacityRule & { day: string })[],
  planStatus?: "active" | "rest" | null
) {
  const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay()
  const override = overrides.find(rule => rule.day === day)
  const recurring = rules.find(rule => rule.weekday === weekday)
  const rule = override || recurring
  const capacitySource = override
    ? ("override" as const)
    : recurring
      ? ("recurring" as const)
      : planStatus === "active"
        ? ("workspace" as const)
        : context.studyDays.length
          ? ("workspace" as const)
          : ("unset" as const)
  const rest = planStatus === "rest"
    ? true
    : planStatus === "active"
      ? (rule ? rule.rest : false)
      : rule
        ? rule.rest
        : context.studyDays.length > 0 && !context.studyDays.some(value => value.toLowerCase() === weekdays[weekday])
  const capacity = rest
    ? 0
    : rule
      ? rule.minutes
      : planStatus === "active"
        ? (context.defaultDailyMinutes || 120)
        : context.defaultDailyMinutes
  return {
    capacity,
    rest,
    capacitySource,
    availableStart: rule?.start || null,
    availableEnd: rule?.end || null
  }
}
