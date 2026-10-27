# Practice mode

Practice counts upward from the persisted start. An optional target is advisory: reaching it changes factual timing context without failing or stopping the attempt. Pause/resume are server mutations; changing tabs does not pause. Refresh restores the same start/pause state and accumulated pause duration.

Supplied structured hints can be revealed in order. Each reveal stores level, time, item and elapsed timing evidence. Stronger hints require an explicit reveal confirmation. A result cannot be committed as independent after a hint was recorded, or as a small hint after stronger guidance was revealed.

The editor, written answer and private scratchpad save independently from final reflection. Manual Save draft is available alongside a typing debounce; no timer state is written every second. Local unsaved drafts are scoped by user/workspace/session/item, expire after seven days, and are removed after confirmed save/discard. Conflicting server drafts require an explicit keep-local or use-server decision. Drafts never bypass session expiry.

Finishing flushes the current working draft before capturing the server end time. Switching questions and pausing also flush the draft first. An offline or conflicted save cannot be silently called successful. Completed working state remains reviewable; final debrief notes do not automatically absorb scratch text.
