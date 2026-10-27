# Analytics policies v1

Policy identifiers are `analytics-policy-v1` and `timing-analytics-v1`. Any eligibility, denominator, comparison or threshold change requires a new policy and fixture update.

| Measurement | Eligibility / minimum |
| --- | --- |
| Coding solve timing | committed successful reported result, >=30s, non-invalid terminal session |
| Objective timing | submitted server evaluation, positive duration |
| Behavioral timing | meaningful successful self-retelling, >=15s |
| Median / mean / paired variance | 3 eligible timings/pairs |
| P25 / P75 corridor | 8 timings per bucket |
| P90 | 20 timings |
| Outcome or objective rate | 5 eligible/evaluated attempts |
| Objective calibration | 10 evaluated confidence pairs overall; 5 per bucket |

Percentiles use PostgreSQL `percentile_cont`, preserving valid long observations. Actual recorded hints/cues override independent self-reports. Solve time and all-attempt time spent have distinct denominators.

Default windows end on the last complete workspace-local day. This month on its first day is explicitly partial. Weeks start Monday. Comparisons require equal calendar-day periods, at least five eligible attempts/three timings in both periods, homogeneous difficulty/mode/session kind, no partial day and no source cap. They describe recorded changes without causal or hiring claims.

Budgets: 366 selected days, 20,000 normalized source rows plus a lookahead, 100 scatter points, 30 history rows, 60 topic groups/relationship edges, 40 D3 nodes and 80 projected Mastery areas. Counts of known records can be zero; unavailable measurements stay null. Current due queues and Mastery states are labeled as current, never historical reconstructions.
