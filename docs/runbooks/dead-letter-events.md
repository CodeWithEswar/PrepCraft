# Dead-letter recovery

Inspect the job by exact ID and confirm its source still exists, its environment matches and its side effect is safe to repeat. Record the root cause before replay.

As the service identity call platform_replay(p_id, p_request, p_reason). Reasons are dependency_recovered, configuration_fixed or operator_reviewed. This retains event identity and creates an audit. Confirm the next Cron publishes it and its terminal state becomes done/suppressed; retries can still fail. Never replay a whole tenant blindly.
