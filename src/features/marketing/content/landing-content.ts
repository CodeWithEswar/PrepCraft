export const landingContent = {
  navigation: [
    { label: "Product", href: "#product" }, { label: "Workflow", href: "#workflow" },
    { label: "Practice", href: "#practice" }, { label: "Progress", href: "#readiness" },
    { label: "Interviews", href: "#projects" }, { label: "FAQ", href: "#questions" },
  ],
  hero: {
    eyebrow: "Preparation, organized.",
    lines: ["Know what to practice.", "Know what to fix.", "Know when you’re ready."],
    description: "Your practice, mistakes, revision, and interview preparation. Connected in one focused workspace, so every session has a next step.",
    primary: "Start preparing", secondary: "Explore the workflow",
  },
  stages: [
    { label: "Plan", title: "Give today a clear intention.", copy: "Turn a weekly goal into a realistic daily plan. Make room for practice, revision, and the fundamentals you need next.", detail: "Weekly goal → daily plan → focused session", image: "07-weekly-planning", height: 900, alt: "Modular weekly time blocks with a highlighted focus window" },
    { label: "Practice", title: "Make every attempt useful.", copy: "Record the pattern you recognized, your approach, and the outcome. A solution is only part of the story.", detail: "Question → pattern guess → attempt → review", image: "02-practice-flow", height: 750, alt: "Connected geometric stages representing question, thought, code, and evaluation" },
    { label: "Learn", title: "Keep the lesson, not just the result.", copy: "Was it the pattern, an edge case, or the complexity? Capture the reason while it is fresh, then connect it to your next attempt.", detail: "Mistake → understanding → correction", image: "04-mistake-learning", height: 900, alt: "Misaligned structural elements resolving into an ordered corrected form" },
    { label: "Revise", title: "Bring it back before it fades.", copy: "Plan the next revisit alongside new practice. See what is due, what is coming, and what still needs a second look.", detail: "Due today · revisit in 3 days · check in 7 days", image: "05-revision-memory", height: 800, alt: "Repeating arcs and spaced nodes representing deliberate revision intervals" },
    { label: "Measure", title: "Readiness needs evidence.", copy: "Review your preparation across DSA, language, CS fundamentals, projects, behavioral questions, and timed practice. Find the gap behind the number.", detail: "Preparation history → evidence → next priority", image: "06-readiness-path", height: 800, alt: "A structured path passing through successive readiness milestones" },
    { label: "Prepare", title: "Connect the work to what’s ahead.", copy: "An assessment in eight days changes what matters this week. Bring applications and interview stages into view, then choose how to adjust your plan.", detail: "Saved → applied → assessment → interview → offer", image: "09-application-journey", height: 750, alt: "A measured six-stage pathway connecting application milestones" },
  ],
  questions: [
    { question: "Can I use PrepCraft today?", answer: "This is an early product preview. You can explore the sample workflow on this page, including a local practice reflection. Accounts, saved workspaces, and live tracking are planned for later phases." },
    { question: "Is this another question bank?", answer: "The focus is what happens around an attempt: planning, pattern recognition, reflecting on mistakes, revision, and readiness. The intended workspace connects those steps with projects and applications." },
    { question: "Does the preview run my code?", answer: "No. The code shown here is illustrative. Code execution, authentication, and application screens have not been implemented in this phase." },
    { question: "What preparation does the workspace cover?", answer: "The planned scope includes DSA, Java, SQL and DBMS, operating systems, computer networks, aptitude, project discussions, behavioral preparation, timed study sessions, and application tracking." },
  ],
} as const
