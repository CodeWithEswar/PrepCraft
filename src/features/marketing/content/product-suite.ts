export const productSuite = [
  { id:"practice",label:"Practice",title:"Make every session count.",description:"Give the work a clear intention, then capture more than the answer.",cards:[
    {title:"Intentional practice",description:"Connect the question, the pattern, your approach, and the result.",image:"hero-gallery/01-practice-studio",height:800,tag:"Practice workspace",href:"#practice"},
    {title:"A plan for today",description:"Turn your weekly priorities into a focused, realistic daily session.",image:"visuals/07-weekly-planning-studio",height:900,tag:"Planning",href:"#preparation-path"},
    {title:"Time with purpose",description:"Make room for thinking, implementation, and a useful reflection.",image:"visuals/02-practice-flow-studio",height:750,tag:"Session structure",href:"#practice"},
  ]},
  { id:"patterns",label:"Patterns",title:"Recognize the structure behind the question.",description:"Build the habit of identifying an approach before reaching for the code.",cards:[
    {title:"Pattern thinking",description:"Look for a familiar structure across arrays, trees, and graphs.",image:"hero-gallery/02-patterns-studio",height:800,tag:"Problem solving",href:"#practice"},
    {title:"Fundamentals that connect",description:"Bring language knowledge and CS concepts into the same preparation plan.",image:"visuals/03-pattern-thinking-studio",height:900,tag:"Java · CS fundamentals",href:"#readiness"},
    {title:"Explain the approach",description:"Make the reasoning, constraints, and trade-offs part of the attempt.",image:"visuals/08-project-preparation-studio",height:900,tag:"Reasoning",href:"#projects"},
  ]},
  { id:"mistakes",label:"Mistakes",title:"Keep the lesson. Change the next attempt.",description:"A mistake becomes useful when you understand what caused it.",cards:[
    {title:"A journal of useful mistakes",description:"Capture the cause, the correction, and the clue you want to remember.",image:"hero-gallery/03-mistakes-studio",height:800,tag:"Learning signals",href:"#practice"},
    {title:"See the gap clearly",description:"Separate a concept gap from a logic error or a missed edge case.",image:"visuals/04-mistake-learning-studio",height:900,tag:"Reflection",href:"#practice"},
    {title:"Return with a better question",description:"Give the next attempt a specific intention instead of starting over.",image:"visuals/02-practice-flow-studio",height:750,tag:"Deliberate improvement",href:"#practice"},
  ]},
  { id:"revision",label:"Revision",title:"Bring it back before it fades.",description:"Make revisiting what matters a natural part of moving forward.",cards:[
    {title:"A queue worth returning to",description:"See what needs another look alongside the practice you plan next.",image:"hero-gallery/04-revision-studio",height:800,tag:"Revision",href:"#practice"},
    {title:"Space out the learning",description:"Revisit a lesson over time, rather than relying on one good attempt.",image:"visuals/05-revision-memory-studio",height:800,tag:"Retention",href:"#practice"},
    {title:"Balance the week",description:"Leave space for new questions, fundamentals, and lessons still settling.",image:"visuals/07-weekly-planning-studio",height:900,tag:"Weekly planning",href:"#preparation-path"},
  ]},
  { id:"readiness",label:"Readiness",title:"Build confidence from evidence.",description:"See where your preparation is strong and where your next session belongs.",cards:[
    {title:"Readiness, by dimension",description:"Bring DSA, fundamentals, projects, and interview practice into view.",image:"hero-gallery/05-readiness-studio",height:800,tag:"Preparation evidence",href:"#readiness"},
    {title:"Find the next priority",description:"Read the context behind a number. Keep the next gap visible.",image:"visuals/06-readiness-path-studio",height:800,tag:"Focus",href:"#readiness"},
    {title:"Progress you can explain",description:"Look back at your practice, lessons, and revisits to understand the change.",image:"visuals/01-focus-workspace-studio",height:750,tag:"History",href:"#preparation-path"},
  ]},
  { id:"interviews",label:"Interviews",title:"Connect the work to what comes next.",description:"Prepare for the discussion, the decision, and the opportunity ahead.",cards:[
    {title:"Know your own projects",description:"Practice explaining architecture, failure handling, and design trade-offs.",image:"visuals/08-project-preparation-studio",height:900,tag:"Project discussions",href:"#projects"},
    {title:"Stories with substance",description:"Prepare the decisions, contribution, and learning behind your experience.",image:"visuals/09-application-journey-studio",height:750,tag:"Behavioral preparation",href:"#projects"},
    {title:"Keep the deadline in view",description:"Connect upcoming assessments and interviews to your preparation priorities.",image:"visuals/10-ready-state-studio",height:750,tag:"Applications",href:"#projects"},
  ]},
] as const
