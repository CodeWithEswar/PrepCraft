/** External sandbox implementations must enforce these limits, never run inside Next.js. */
export const JAVA_LIMITS={cpuMs:2000,wallMs:5000,memoryMb:128,processes:16,outputBytes:32000,network:false,filesystem:"disposable"} as const
export type RunnerResult={status:"accepted"|"wrong_answer"|"compile_error"|"runtime_error"|"timeout"|"output_limit";executionId:string;durationMs:number}|{status:"unavailable";reason:string}
export interface JavaRunnerPort{run(input:{code:string;languageVersion:string;fixtureId:string;requestId:string}):Promise<RunnerResult>}
export const unavailableJavaRunner:JavaRunnerPort={async run(){return {status:"unavailable",reason:"A sandboxed Java runner is not configured. Concept checks and lessons remain available."}}}
