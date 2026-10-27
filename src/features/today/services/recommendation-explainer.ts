import type { ReasonCode } from "../types/today.types"
export const REASON_COPY:Record<ReasonCode,{label:string;detail:string}>={
  IN_PROGRESS:{label:"Already in progress",detail:"You started this task. Finishing it keeps the day focused."},
  REVISION_DUE:{label:"Revision due",detail:"The Revision domain reports this item due or overdue."},
  OVERDUE:{label:"Overdue",detail:"This task's recorded deadline has passed."},
  WEAK_TOPIC:{label:"Needs reinforcement",detail:"Source-domain evidence identifies this area as needing reinforcement."},
  TARGET_CRITICAL:{label:"Core to your target",detail:"Your effective curriculum gives this area high target alignment."},
  INTERVIEW_SOON:{label:"Interview approaching",detail:"This task supports a recorded interview deadline within seven days."},
  OA_SOON:{label:"Assessment approaching",detail:"This task supports a recorded assessment deadline within seven days."},
  WEEKLY_TARGET_BEHIND:{label:"Weekly commitment",detail:"Recorded focus time is below the elapsed share of this week's commitment."},
  RECENT_MISTAKES:{label:"Recent mistakes",detail:"The source domain reports recent mistakes relevant to this task."},
  SCHEDULED_TODAY:{label:"Scheduled for today",detail:"This unfinished task is part of your current preparation plan."},
  OPTIONAL:{label:"Optional preparation",detail:"This task is optional and does not prevent your required day from being complete."},
  DOMAIN_VARIETY:{label:"Preparation variety",detail:"Other important preparation areas have been considered alongside recent work."},
}
