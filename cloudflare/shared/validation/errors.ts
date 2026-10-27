export type InfrastructureCode="invalid_contract"|"unauthorized"|"not_found"|"conflict"|"rate_limited"|"dependency_timeout"|"dependency_unavailable"|"internal_error"
export class RetryableError extends Error{readonly classification="retryable";constructor(readonly code:InfrastructureCode){super(code);this.name="RetryableError"}}
export class TerminalError extends Error{readonly classification="terminal";constructor(readonly code:InfrastructureCode){super(code);this.name="TerminalError"}}
export function fromHttpStatus(status:number){return status===408||status===429||status>=500?new RetryableError(status===429?"rate_limited":"dependency_unavailable"):new TerminalError(status===401||status===403?"unauthorized":status===404?"not_found":status===409?"conflict":"invalid_contract")}
