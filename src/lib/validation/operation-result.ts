/** Serializable public result. Never include raw exceptions, SQL or credentials. */
export type OperationErrorCode =
  | "validation" | "unauthenticated" | "forbidden" | "not_found"
  | "conflict" | "rate_limited" | "unavailable" | "unexpected"

export type OperationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: OperationErrorCode; message: string; correlationId: string; fieldErrors?: Record<string, string[]> } }
