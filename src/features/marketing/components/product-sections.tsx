import Image from "next/image"
import { AppIcon } from "@/components/app-icon"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { PracticeDemo } from "./practice-demo"
import { ReadinessConvergence } from "../motion/signature-visuals"
import { FocusLens } from "../motion/focus-lens"

export function PracticeSection() {
  return (
    <section className="mk-section container-page scroll-mt-20 md:scroll-mt-24" id="practice" aria-labelledby="practice-heading">
      <div className="mk-practice-grid">
        <div className="mk-practice-copy-col">
          <p className="mk-kicker">Practice → reflection → retention</p>
          <h2 className="type-heading-2" id="practice-heading">
            Don’t just count <br className="mk-desktop-break" />solved questions. <br className="mk-desktop-break" />
            <span className="mk-muted-heading">Understand what you missed.</span>
          </h2>
          <p className="mk-section-copy">
            Recognizing the pattern and implementing it are different skills. Track both. Turn logic gaps, missed edge cases, and complexity mistakes into a better next attempt.
          </p>
          <div className="mk-pattern-note">
            <div className="mk-pattern-note-media">
              <Image
                src="/brand/landing/visuals/03-pattern-thinking-studio.webp"
                alt="Array, tree, and graph structures connected by a highlighted recognition path"
                width={1200}
                height={900}
                sizes="(max-width: 640px) 110px, 160px"
                className="mk-pattern-note-img"
              />
            </div>
            <div className="mk-pattern-note-body">
              <strong>See the structure. <br className="mk-desktop-break" />Then build the solution.</strong>
              <span>Pattern recognition, made deliberate.</span>
            </div>
          </div>
          <div className="mk-category-list">
            {["Pattern recognition", "Logic", "Edge cases", "Complexity", "Testing", "Concept gaps", "Time management"].map(label => (
              <Badge key={label} variant="outline">{label}</Badge>
            ))}
          </div>
        </div>
        <PracticeDemo />
      </div>
    </section>
  )
}

export function ReadinessSection() {
  return <section className="mk-section mk-readiness-section" id="readiness" aria-labelledby="readiness-heading"><div className="container-page"><div className="pc-centered-heading"><p className="mk-kicker">Progress with context</p><h2 id="readiness-heading" className="type-heading-2">You are more than<br />a readiness score.</h2><p className="mk-section-copy">Confidence comes from evidence. See what you’ve practiced, what you can explain, and what still needs a focused session.</p></div><div className="mk-readiness-grid"><div className="pc-evidence-panel"><p className="mk-kicker">A complete picture</p><h3>Every skill adds to your story.</h3><p className="mk-small-note">From problem solving to explaining your decisions. Bring your preparation into focus.</p><ReadinessConvergence /><p className="pc-evidence-subjects">Java · SQL & DBMS · Operating systems<br />Computer networks · Aptitude · Behavioral</p></div><Card className="mk-readiness-panel"><div className="mk-demo-label"><strong>Readiness, by dimension</strong><Badge variant="outline">Illustrative</Badge></div>{[{ name: "DSA & problem solving", status: "Building consistency", value: 67 }, { name: "Language & CS fundamentals", status: "Revisit SQL joins", value: 48 }, { name: "Projects & trade-offs", status: "Explain the why", value: 72 }, { name: "Behavioral & timed practice", status: "Next focus", value: 35 }].map(item => <div className="mk-readiness-row" key={item.name}><div><strong>{item.name}</strong><span>{item.status}</span></div><Progress value={item.value} aria-label={`${item.name}, illustrative progress`} /></div>)}<p className="mk-demo-disclaimer">Sample signals, not a prediction of interview outcomes.</p></Card></div></div></section>
}

export function ProjectsSection() {
  return <section className="mk-section container-page" id="projects" aria-labelledby="projects-heading"><div className="mk-project-grid"><figure className="mk-project-art"><FocusLens><Image src="/brand/landing/visuals/08-project-preparation-studio.webp" alt="Interconnected architectural layers representing database, security, scaling, and system trade-offs" width={1200} height={900} sizes="(max-width: 767px) 100vw, 45vw" /></FocusLens><figcaption><span className="mk-kicker">Your project. Your decisions.</span><span>Architecture · Database · Security · Scaling</span></figcaption></figure><div><p className="mk-kicker">Beyond the coding round</p><h2 id="projects-heading" className="type-heading-2">Be ready to explain<br />the choices you made.</h2><p className="mk-section-copy">Prepare the story behind your own work. Why this stack? What fails first? What would you change at ten times the traffic?</p><ul className="mk-question-list"><li><AppIcon icon="folder" size={18} /><span><strong>Projects that hold up to questions</strong>Architecture, failure handling, and trade-offs.</span></li><li><AppIcon icon="user" size={18} /><span><strong>Behavioral stories with substance</strong>Your decisions, your contribution, your learning.</span></li><li><AppIcon icon="calendar" size={18} /><span><strong>Preparation that sees the deadline</strong>Connect upcoming assessments and interviews to your priorities.</span></li></ul></div></div></section>
}
