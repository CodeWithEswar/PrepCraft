import { MarketingHeader } from "@/features/marketing/components/marketing-header"
import { Hero } from "@/features/marketing/components/hero"
import { ProductSuite } from "@/features/marketing/components/product-suite"
import { SubjectTicker, PreparationSpotlight, PreparationPaths, LearningEditorial } from "@/features/marketing/components/platform-sections"
import { AppIcon } from "@/components/app-icon"
import { PracticeSection, ReadinessSection, ProjectsSection } from "@/features/marketing/components/product-sections"
import { PreparationTimeline, Questions, FinalCta, MarketingFooter } from "@/features/marketing/components/closing"

export function MarketingPage() {
  return <>
    <div id="page-top" className="mk-top-sentinel" />
    <a href="#main-content" className="mk-skip-link">Skip to content</a>
    <div className="pc-preview-bar"><div className="container-page"><strong>PrepCraft / Preview</strong><span>A more deliberate way to prepare for what’s next.</span><a href="#questions">Explore what’s planned <AppIcon icon="arrow-right" size={12}/></a></div></div><MarketingHeader />
    <noscript><nav className="container-page mk-no-script" aria-label="Page sections"><span>Interactive previews need JavaScript. Explore the planned workflow:</span><a href="#workflow">Workflow</a><a href="#practice">Practice</a><a href="#readiness">Readiness</a><a href="#questions">Availability</a></nav></noscript>
    <main id="main-content"><Hero /><SubjectTicker /><PreparationSpotlight /><ProductSuite /><PreparationPaths /><LearningEditorial /><div className="pc-practice-band dark"><PracticeSection /></div><ReadinessSection /><ProjectsSection /><PreparationTimeline /><Questions /><FinalCta /></main>
    <MarketingFooter />
  </>
}
