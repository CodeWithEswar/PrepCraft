# Timestamp-authoritative timer

PostgreSQL stores start, current pause, accumulated pause milliseconds, completion, countdown expiry and policy version. Elapsed is `effectiveEnd - startedAt - accumulatedPause`; effectiveEnd is completed/paused/server time, capped at a countdown deadline. Remaining clamps at zero. Practice targets do not auto-finish.

The display samples server time from a resolve/mutation response and advances it with a monotonic performance sample. Half round-trip time provides a bounded display calibration. Device wall-clock changes cannot alter persisted duration or the display's monotonic progression. A shared external clock store notifies the React timer once per second; it is a render trigger, not a counter or database writer. Initial hydration says Restoring rather than flashing a new zero timer.

Server state resynchronizes periodically, when visibility returns and after reconnect. BroadcastChannel coordinates same-user/workspace tabs without sending code or notes. A missed browser tick never needs catching up: timestamps derive the value again. Every mutation verifies actual server expiry regardless of the displayed value.

Active intervals close on pause, item switch and finish; resume opens a new interval. One active session per user/workspace prevents overlapping normal execution intervals. Today and Planning use a scoped database projection capped at expiry, validate/union intervals and split them at workspace-local midnight. Weekly close captures actual minutes in its immutable review. These are recorded session minutes, not proof of continuous user attention.

The timer has tabular numerals, a readable accessible label and `aria-live=off`. Only semantic attention/closing/expiry changes are announced. Reduced motion removes temporal-edge transitions and chamber entry animation. Shortcut help documents safe confirmation, pause and question navigation behavior.
