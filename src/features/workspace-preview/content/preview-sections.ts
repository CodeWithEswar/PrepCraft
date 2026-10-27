export const previewSections=["analytics","mocks","behavioral","learn","practice","fundamentals","aptitude","timed-practice","questions","interview","projects","interview-tracker","plan","progress","mistakes","revision","patterns","applications","resources","settings"] as const
export type PreviewSection=typeof previewSections[number]

export const previewTitles:Record<PreviewSection,{title:string;description:string}>={
  analytics:{title:"Analytics",description:"Understand your evidence. Choose your next move."},
  mocks:{title:"Mock Interviews & OA Simulator",description:"Practice in realistic conditions. Build confidence. Turn insights into focused improvement."},
  behavioral:{title:"Behavioral preparation",description:"Real experiences. Clearer stories. Stronger conversations."},
  learn:{title:"Learn",description:"Build fundamentals for interviews. One learning system. All subjects. Real progress."},
  practice:{title:"Question practice",description:"Think it through. Build the solution. Keep the lesson."},
  fundamentals:{title:"CS fundamentals",description:"Build the foundations behind every good engineering decision."},
  aptitude:{title:"Aptitude",description:"A little clarity. A little speed. A lot of deliberate practice."},
  "timed-practice":{title:"Timed practice",description:"Make room for focus, one question at a time."},
  questions:{title:"Your question library",description:"Find the right question for your next focused session."},
  interview:{title:"Interview preparation",description:"Know your stories. Explain your decisions. Be ready for the conversation."},
  projects:{title:"Project preparation",description:"Your project. Your decisions. Your story to tell."},
  "interview-tracker":{title:"Interview tracker",description:"Keep the next opportunity and the preparation connected."},
  plan:{title:"Study planner",description:"Plan. Track. Stay consistent."},
  progress:{title:"Your progress",description:"Evidence you can learn from, one session at a time."},
  mistakes:{title:"Mistake journal",description:"Turn mistakes into understanding."},
  revision:{title:"Revision",description:"Bring it back before it fades."},
  patterns:{title:"Pattern recognition",description:"Identify patterns faster. Solve smarter."},
  applications:{title:"Application tracker",description:"Track your journey. Stay prepared."},
  resources:{title:"Your preparation library",description:"Keep the useful things close. Come back with a clearer question."},
  settings:{title:"Make this space yours",description:"A workspace that feels right for the way you prepare."},
}
