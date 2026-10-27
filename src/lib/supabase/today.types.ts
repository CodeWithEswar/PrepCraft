import type { Tables } from "./types"
export type DailyPlanRow=Tables<"daily_plans">
export type DailyTaskRow=Tables<"daily_tasks">
export type TodayTable<Row>={Row:Row;Insert:Partial<Row>;Update:Partial<Row>;Relationships:[]}
