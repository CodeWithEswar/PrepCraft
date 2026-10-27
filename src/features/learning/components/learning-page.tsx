import Link from "next/link"
import { AppIcon } from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import { LearningExplorer } from "./learning-explorer"
import type { LearningCatalog,LearningOverview,ConceptDetail,SubjectId } from "../types/learning.types"
import "../learning.css"
export function LearningPage({catalog,overview,subject="aptitude",preview=false,initialConcept=null,progressError=false}:{catalog:LearningCatalog;overview:LearningOverview;subject?:SubjectId;preview?:boolean;initialConcept?:ConceptDetail|null;progressError?:boolean}){
 const base=preview?"/preview/learn":`/w/${catalog.workspace.slug}/learn`
 return <LearningExplorer catalog={catalog} overview={overview} subject={subject} preview={preview} initialConcept={initialConcept} progressError={progressError}>
 <header className="pc-learn-header"><div className="pc-learn-title"><span className="pc-learn-icon"><AppIcon icon="sparkles" size={28}/></span><div><h1>Learn</h1><p>Build fundamentals for interviews. One learning system. All subjects.</p></div></div><Button variant="outline" render={<Link href={`${base}/guide`}/> }><AppIcon icon="book" size={17}/>Learning guide</Button></header>
 <section className="pc-learn-journey" aria-labelledby="learning-journey-title"><div><span className="pc-learn-eyebrow">THE KNOWLEDGE ATLAS</span><h2 id="learning-journey-title">Your learning journey.</h2><p>Concepts build on each other.<br/>Make the foundations your advantage.</p></div><nav aria-label="Learning subjects" className="pc-learn-landmarks">{catalog.subjects.map((s,i)=><Link key={s.id} href={preview?`${base}?subject=${s.id}`:`${base}/${s.id}`} aria-current={subject===s.id?"page":undefined} style={{"--landmark-offset":`${[28,13,38,16,40][i]}px`} as React.CSSProperties}><span><AppIcon icon={s.icon} size={23}/></span><strong>{s.name}</strong><small>{s.tagline}</small></Link>)}</nav></section>
 </LearningExplorer>
}
