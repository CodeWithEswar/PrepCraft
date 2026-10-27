# 0019: Execution timers derive from authoritative timestamps

Status: Accepted

Persisted PostgreSQL start, pause, resume, end and expiry timestamps define time. Client intervals trigger rendering only. The display calibrates to a server response, advances with a monotonic performance clock and resynchronizes on visibility, connectivity and bounded intervals. Changing a device wall clock cannot change persisted duration. Completed active intervals supply actual session time to Today and Planning without conflating task estimates with focus.

Per-second database writes and decrementing browser counters were rejected. The consequence is explicit recovery/clock calibration and server-side expiry checks on every working-state mutation.
