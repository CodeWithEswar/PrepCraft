# Preparation Planning

Planning constructs the schedule; Today executes the same `daily_plans` and `daily_tasks` rows. The loop is Plan → Execute → Carry over → Review → Rebalance. `/w/[workspaceSlug]/plan` opens the authorized workspace; Overview, Week, Calendar, Goals, and Review are local views of one weekly aggregate. `/preview/plan` is an honest, unsaved empty preview.

The composition follows the supplied reference: mountain Preparation Horizon, a capacity ribbon, seven day columns on a connected canvas, goals/carryover/events rail, focus heatmap and deterministic narrative. Graphite and Smoked Sienna surfaces share the reduced-blur shell. Desktop shows seven columns, tablet scrolls the day strip, mobile selects one day. Forms and day details use a desktop Sheet and mobile Drawer; controls use the existing shadcn primitives and Hugeicons.

The repository currently has no authoritative Revision, Mastery, Readiness or scheduled Interview domain data. Typed ports expose explicit unavailable/error states. Missing sources never become fake question IDs, weak areas, focus minutes, readiness percentages, or interview events. A real workspace target date can appear in the horizon. The Execution Engine now supplies real active session intervals through the focus port.

Custom preparation tasks can be added, edited, moved, cancelled or carried explicitly. Editing completion, source deadlines and source attempt results is outside this feature. Use the task menu's Move earlier/Move later for keyboard-accessible ordering. Capacity failures preserve the form. Task save operations, proposals and review closure are transactional and version checked.

See [weekly planning](weekly-planning.md), [capacity](../architecture/planning-capacity.md), and [security](../security/planning-workspace-isolation.md).
