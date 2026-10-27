# Story Forge

Stories are reusable records, separate from prompts and company frameworks. Fields are bounded in Zod and PostgreSQL. The title limit is 160, summary 500, situation 6000, task 4000, action 10000, result 6000, reflection/private notes 4000, context 300 and period 100 characters.

Only explicit Save writes. A local draft can be restored after refresh or a failed request. Optimistic versions reject stale writes. Keyboard Ctrl/Cmd+S invokes the same validated mutation. Save before changing competency mappings or starting practice. Duplicate creates a new draft with copied facts/mappings and no inherited practice or revision evidence. Retire/restore preserves history and coordinates with Revision; pending sessions/reflections block retirement.

Practice pins a story version and a snapshot that excludes private notes. Editing the current story does not rewrite historical practice. Starting a new Revision rehearsal snapshots current facts, preserving the shared recall identity.
