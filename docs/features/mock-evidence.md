# Mock Evidence & Ledger Specification

## 1. Provenance System
Every piece of feedback, facet status, or primary finding must display its provenance:
```ts
type EvidenceProvenance =
  | "observed"
  | "self_reported"
  | "rule_derived"
  | "automated_analysis"
  | "external_evaluator";
```

## 2. Confidence Levels
```ts
type EvidenceConfidence = "insufficient" | "limited" | "moderate" | "strong";
```
A strong-sounding weakness claim is strictly forbidden if supported by only one isolated observation.

## 3. Privacy & Sanitization
Session events (`mock_session_events`) log operational metadata only (e.g., `code.run`, `answer.saved`, `question.flagged`, `hint.revealed`). Full source code, private reflections, and personal project notes are never dumped into general activity or telemetry logs.
