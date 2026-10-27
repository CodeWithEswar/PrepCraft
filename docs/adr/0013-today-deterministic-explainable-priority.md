# 0013: Deterministic, explainable Today recommendations

Status: Accepted

Context: Today must recommend one useful next step with a reproducible reason, while protecting critical obligations and workspace boundaries.

Decision: Use a versioned pure ranking policy with explicit eligibility, protected criticality tiers, normalized signals, bounded diversity penalties, stable tie-breaking and structured explanation codes. Source domains supply evidence; Today does not invent weakness or readiness.

Alternatives: Opaque AI scheduling, UI-local numeric heuristics and database-row ordering were rejected because they obscure explanations and make behavior difficult to test.

Consequences: Recommendations can be reproduced and debugged. Changes to policy need deliberate versioning and boundary tests. Missing evidence remains missing rather than fabricated.
