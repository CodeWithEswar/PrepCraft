import { InterviewFold } from "./interview-fold"
import { SqlLab } from "../diagrams/sql-lab"
import { JavaExercise } from "./java-exercise"
import type { LearningConcept } from "../types/learning.types"
import { DomainLab } from "../diagrams/domain-labs"
/** Safe text nodes only: canonical content never injects HTML or executes code. */
export function ConceptReading({concept:c}:{concept:LearningConcept}){return <article className="pc-learn-reading"><span className="pc-learn-eyebrow">CORE IDEA</span><p className="pc-learn-lead">{c.summary}</p><h2>Mental model</h2><p>{c.mental_model}</p><h2>Worked example</h2><div className="pc-learn-example"><p>{c.worked_example}</p></div>{c.diagram&&<DomainLab kind={c.diagram}/>}<section className="pc-learn-trap"><h2>Misconception trap</h2><p>{c.misconception}</p></section><h2>Interview lens</h2><p>{c.interview_prompt}</p><InterviewFold answer={c.interview_answer}/>{c.topic_id==="learn-sql-dbms-joins"&&<SqlLab/>}{c.topic_id==="learn-java-collections-framework"&&<JavaExercise/>}<footer>Original PrepCraft explanation · Version {c.version}{c.language_version?` · ${c.language_version}`:""}<br/><a href={c.source_reference} target="_blank" rel="noreferrer">Technical reference</a> · Checked {c.reviewed_at}<small>{c.reviewer}</small></footer></article>}
