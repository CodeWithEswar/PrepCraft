import type { ExecutionMode,ExecutionPolicy,ExecutionSession } from "../types/execution.types"
export const EXECUTION_POLICY_VERSION="execution-policy-v1"
const common={version:EXECUTION_POLICY_VERSION,thresholds:{attention:600,closing:60}}
const policies:Record<ExecutionMode,ExecutionPolicy>={
  practice:{...common,mode:"practice",direction:"up",pause:"allowed",hints:"allowed",hintLimit:30,autoFinish:false,multipleQuestions:true,communication:false},
  interview:{...common,mode:"interview",direction:"down",pause:"forbidden",hints:"limited",hintLimit:2,autoFinish:true,multipleQuestions:false,communication:true},
  oa:{...common,mode:"oa",direction:"down",pause:"forbidden",hints:"forbidden",hintLimit:0,autoFinish:true,multipleQuestions:true,communication:false},
}
export function executionPolicy(mode:ExecutionMode,version=EXECUTION_POLICY_VERSION):ExecutionPolicy {if(version==="behavioral-policy-v1"){if(mode!=="practice")throw new Error("Behavioral practice requires its relaxed Execution lifecycle.");return {...policies.practice,version,direction:"down",hintLimit:2,multipleQuestions:false}}if(version!==EXECUTION_POLICY_VERSION)throw new Error("This session policy needs a compatible reader.");return policies[mode]}
export function policyFor(session:Pick<ExecutionSession,"mode"|"policyVersion">&Partial<Pick<ExecutionSession,"targetSeconds">>){const policy=executionPolicy(session.mode,session.policyVersion);return session.policyVersion==="behavioral-policy-v1"?{...policy,direction:session.targetSeconds==null?"up" as const:"down" as const}:policy}
export const INTERVIEW_PHASES=["understand","clarify","approach","implement","test","review"] as const
export const COMMUNICATION_ITEMS=[{id:"assumptions",label:"Clarified assumptions"},{id:"approach",label:"Explained the approach before coding"},{id:"complexity",label:"Discussed time and space complexity"},{id:"edge_cases",label:"Tested edge cases"},{id:"tradeoffs",label:"Communicated trade-offs"}] as const
