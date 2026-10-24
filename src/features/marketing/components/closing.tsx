import Image from "next/image"
import { PrepCraftLogo, PrepCraftWordmark } from "@/components/brand"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
import { landingContent } from "../content/landing-content"
import { StartPreview } from "./start-preview"

export function PreparationTimeline() {
  return <section className="mk-timeline container-page" aria-label="An illustrative preparation journey"><div className="pc-centered-heading"><p className="mk-kicker">Your effort leaves a trail</p><h2 className="type-heading-2">A history you can learn from.</h2></div><ol>{["First session", "25 questions", "First timed attempt", "Application sent", "Interview ahead", "Ready for next"].map((label, i) => <li key={label}><span aria-hidden="true" className={i === 5 ? "mk-timeline-last" : ""}>{String(i + 1).padStart(2, "0")}</span><small>{label}</small></li>)}</ol><p className="mk-demo-disclaimer">An example journey. Yours will have its own pace.</p></section>
}
export function Questions() {
  return <section className="mk-section container-page pc-faq-layout" id="questions" aria-labelledby="questions-heading"><div className="pc-centered-heading"><p className="mk-kicker">Before you begin</p><h2 id="questions-heading" className="type-heading-2">Frequently asked questions.</h2><p className="mk-section-copy">A little clarity before your next step.</p></div><Accordion className="mk-faq">{landingContent.questions.map(item => <AccordionItem key={item.question}><AccordionTrigger>{item.question}</AccordionTrigger><AccordionContent>{item.answer}</AccordionContent></AccordionItem>)}</Accordion></section>
}
export function FinalCta() {
  return <section id="start" className="mk-final-section"><div className="container-page mk-final"><div><p className="mk-kicker">Craft your way to ready.</p><h2 className="type-heading-2">Your preparation should<br />tell you what comes next.</h2><p>Bring the practice, the lessons, and the next opportunity<br className="mk-desktop-break" /> into one focused workspace.</p><StartPreview large /><small>Explore the early product preview.</small></div><Image src="/brand/landing/visuals/10-ready-state-studio.webp" alt="An open mineral threshold and a clear path representing calm readiness" width={1200} height={750} sizes="(max-width: 767px) 100vw, 40vw" /></div></section>
}
export function MarketingFooter() {
  return <footer className="mk-footer container-page"><div className="mk-footer-top"><div><a href="#page-top" aria-label="PrepCraft home"><PrepCraftLogo size={40} decorative /></a><p>A little more clarity.<br />A more deliberate way to prepare.</p></div><nav aria-label="Product links"><strong>Product</strong><a href="#practice">Practice & reflection</a><a href="#workflow">Planning & revision</a><a href="#readiness">Readiness</a><a href="#projects">Projects & applications</a></nav><nav aria-label="Resource links"><strong>Explore</strong><a href="#workflow">How it works</a><a href="#questions">Questions & availability</a><a href="#start">Product preview</a></nav><div className="mk-footer-note"><span className="mk-status-dot" />Thoughtfully in progress.<p>Built for software-engineering candidates.<br />Designed for the work that gets you ready.</p></div></div><Separator /><div className="mk-footer-bottom"><span>© 2026 PrepCraft</span><span>Plan. Practice. Revise. Keep going.</span></div><div className="mk-footer-wordmark" aria-hidden="true"><PrepCraftWordmark size={180} appearance="monochrome" decorative /></div></footer>
}
