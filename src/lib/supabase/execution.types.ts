import type { Tables } from "./types"
export type ExecutionSessionRow=Tables<"execution_sessions">
export type ExecutionItemRow=Tables<"execution_session_items">
export type ExecutionAttemptRow=Tables<"question_attempts">
export type ExecutionEventRow=Tables<"execution_events">
export type ExecutionFocusRow=Tables<"execution_focus_intervals">
export type ExecutionHintRow=Tables<"execution_item_hints">
export type ExecutionHintUseRow=Tables<"execution_hint_uses">
export type AttemptOutboxRow=Tables<"attempt_outbox_events">
