import { AppIcon } from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import { landingContent } from "../content/landing-content"
import { Reveal } from "../motion/reveal"
import { HeroVisualWorld } from "./hero/hero-visual-world"
import { StartPreview } from "./start-preview"
import { PrecisionReveal } from "../motion/precision-reveal"

export function Hero() {
  const copy = landingContent.hero
  return <section className="mk-hero mk-hero-platform" id="product" aria-labelledby="hero-heading"><div className="container-page pc-hero-layout">
    <div className="mk-hero-copy"><Reveal><p className="mk-eyebrow"><span />{copy.eyebrow}</p><h1 id="hero-heading" className="type-display"><PrecisionReveal lines={copy.lines} /></h1></Reveal>
      <Reveal delay={.06}><p className="mk-hero-description">{copy.description}</p><div className="mk-hero-buttons"><StartPreview large /><Button render={<a href="#workflow" />} nativeButton={false} role="link" variant="outline" size="lg"><AppIcon icon="book" size={18} />{copy.secondary}</Button></div><p className="mk-preview-note"><span className="mk-status-dot" />Early product preview <span>·</span> Built for deliberate preparation</p></Reveal>
    </div>
    <HeroVisualWorld />
  </div><div className="container-page pc-discovery"><strong><AppIcon icon="search" size={18}/>Find your next step</strong><nav aria-label="Find a preparation tool">{[{label:"Practice deliberately",href:"#suite-practice",icon:"code"},{label:"Learn from mistakes",href:"#suite-mistakes",icon:"book"},{label:"Make it stick",href:"#suite-revision",icon:"clock"},{label:"See your readiness",href:"#readiness",icon:"check-circle"}].map(item=><a key={item.href} href={item.href}><AppIcon icon={item.icon as "code"|"book"|"clock"|"check-circle"} size={16}/>{item.label}<AppIcon icon="arrow-right" size={14}/></a>)}</nav></div></section>
}
