# Learning evidence lifecycle

learning_launch scope-checks workspace and curriculum exclusions, selects a published activity version and delegates to private.create_execution. The binding pins that content version. Launch retries reuse Execution request id/hash safety. Another active session returns recovery rather than creating a second timer.

Practice can pause; Timed Drill uses OA deadline semantics for one question. learning_session resolves authoritative expiry before returning state. Unsent answers and scratchpad are scoped local drafts; no save is claimed before a confirmed response.

learning_submit checks ownership, version, bounded typed answer and user confidence; evaluates against private keys; freezes timing through Execution; commits its debrief and synchronous outbox/Revision. An evaluator guard prevents generic Execution debriefs from bypassing correctness. Expired sessions discard late answer values and record failed recall after the user supplies confidence. Submit retries with identical payload are idempotent; changed payload conflicts.

Repeated practice of one canonical activity links the existing Revision identity. Before its due date, success holds the schedule and failure may bring it closer; the immutable attempt/history is kept with EARLY_PRACTICE_NO_ADVANCE. Mastery excludes these exposed early repeats from both independent-solving and spaced-retention calculations. Due reviews follow the existing interval ladder. Verified learning checks may be shorter than 30 seconds and are accepted by Mastery through their committed binding, without inventing duration. Unverified short generic attempts retain the existing exclusion. Topic evidence remains the shared Mastery policy, not a new concept completion score.

Optional mistake categories are explicitly self-reported using Execution’s controlled taxonomy. Incorrect answers do not automatically diagnose a concept gap. The future Mistake Journal can consume the existing committed event.
