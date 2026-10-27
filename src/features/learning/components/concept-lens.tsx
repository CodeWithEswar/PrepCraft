"use client"
import { useRef,useState } from "react"
import Link from "next/link"
import { useLocalDraft } from "../hooks/use-local-draft"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { AppIcon } from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs,TabsList,TabsTrigger,TabsContent } from "@/components/ui/tabs"
import { Select,SelectContent,SelectTrigger,SelectValue,SelectItem } from "@/components/ui/select"
import { Accordion,AccordionItem,AccordionTrigger,AccordionContent } from "@/components/ui/accordion"
import { saveLearningStateAction,launchLearningAction } from "../server/mutations"
import { DomainLab } from "../diagrams/domain-labs"
import type { ConceptDetail,LearningActivity,LearningCatalog,LearningState } from "../types/learning.types"
type Workspace=LearningCatalog["workspace"]
export function ActivityLauncher({activity,workspace,preview=false}:{activity:LearningActivity;workspace:Workspace;preview?:boolean}){
 const [mode,setMode]=useState("practice"),[busy,setBusy]=useState(false),[error,setError]=useState(""),request=useRef<string|null>(null),router=useRouter()
 const start=async()=>{setBusy(true);setError("");request.current||=crypto.randomUUID();const r=await launchLearningAction({slug:workspace.slug,activity:activity.id,mode,requestId:request.current});setBusy(false);if(!r.ok){setError(r.error);return}if(r.data.otherActive)router.push(`/w/${workspace.slug}/session/${r.data.sessionId}`);else router.push(`/w/${workspace.slug}/learn/activity/${r.data.sessionId}`)}
 return <section className="pc-learn-activity-launch pc-learn-card">
  <div className="pc-learn-launch-badges">
    <span className="pc-learn-eyebrow-chip">PRACTICE</span>
    <span className="pc-learn-diff-chip" data-diff={activity.difficulty}>{activity.difficulty}</span>
    <span className="pc-learn-time-chip"><AppIcon icon="clock" size={12}/>{Math.ceil(activity.estimated_seconds/60)} min</span>
  </div>
  <h3>{activity.title}</h3>
  <p className="pc-learn-activity-sub">{activity.activity_type.replaceAll("_"," ")} · Interactive assessment</p>
  <label className="pc-learn-mode-select-wrap">
    <span>Practice mode</span>
    <Select value={mode} onValueChange={v=>{setMode(v!);request.current=null}}>
      <SelectTrigger aria-label="Learning activity mode">
        <SelectValue>{mode==="timed"?"Timed drill":"Practice"}</SelectValue>
      </SelectTrigger>
      <SelectContent side="bottom" sideOffset={6} alignItemWithTrigger={false}>
        <SelectItem value="practice">Practice · no deadline</SelectItem>
        <SelectItem value="timed">Timed drill · shared timer policy</SelectItem>
      </SelectContent>
    </Select>
  </label>
  {preview?<Button className="pc-learn-action-primary" render={<Link href="/login"/>}><span>Sign in to practice</span><AppIcon icon="arrow-right" size={17}/></Button>:<Button className="pc-learn-action-primary" disabled={busy||!workspace.canEdit} onClick={start}><span>{busy?"Starting…":mode==="timed"?"Start timed drill":"Start practice"}</span><AppIcon icon="arrow-right" size={17}/></Button>}
  {error&&<p role="alert" className="pc-learn-alert-err">{error}</p>}
  <small className="pc-learn-launch-hint"><AppIcon icon="shield" size={13}/>Answers are evaluated after submission. Evidence goes to Revision and Mastery.</small>
 </section>
}
export function ConceptStateControls({detail,workspace,preview=false,compact=false}:{detail:ConceptDetail;workspace:Workspace;preview?:boolean;compact?:boolean}){
 const [state,setState]=useState<LearningState|null>(detail.state),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),router=useRouter(),cache=useQueryClient(),request=useRef<{hash:string;id:string}|null>(null),key=`pc-learn-note:${workspace.id}:${workspace.userId}:${detail.concept.id}`
 const [draft,setDraft]=useLocalDraft(preview?null:key),note=draft??state?.note??detail.state?.note??""

 const save=async(patch:{note?:string;bookmarked?:boolean;opened?:true},navigate=false)=>{if(preview)return;setBusy(true);setMessage("");const hash=JSON.stringify({version:state?.version??-1,patch});if(request.current?.hash!==hash)request.current={hash,id:crypto.randomUUID()};const result=await saveLearningStateAction({slug:workspace.slug,id:detail.concept.id,version:state?.version??-1,requestId:request.current.id,patch});setBusy(false);if(!result.ok){setMessage(result.error);return}request.current=null;setState(result.data);setMessage("Saved to this workspace.");if(patch.note!==undefined)setDraft(null);cache.invalidateQueries({queryKey:["workspace",workspace.id,workspace.userId,"learn"]});if(navigate)router.push(`/w/${workspace.slug}/learn/concept/${detail.concept.id}`)}
 return <div className="pc-learn-state-controls">
  {!compact&&<>
    <div className="pc-learn-note-header">
      <label htmlFor={`note-${detail.concept.id}`}>Your private concept note</label>
      <small className="pc-learn-char-count">{note.length}/4,000</small>
    </div>
    <Textarea id={`note-${detail.concept.id}`} value={note} maxLength={4000} disabled={preview||!workspace.canEdit} onChange={e=>{setDraft(e.target.value)}} placeholder={preview?"Sign in to save notes to your workspace.":"What made this concept click? Capturing mental models in your own words builds long-term recall."}/>
    <div className="pc-learn-control-row">
      <Button variant="outline" className="pc-learn-save-btn" disabled={preview||busy||!workspace.canEdit} onClick={()=>save({note})}>
        <AppIcon icon="save" size={15}/>Save note
      </Button>
    </div>
  </>}
  <div className="pc-learn-control-row">
    <Button variant="outline" className={`pc-learn-bookmark-btn ${state?.bookmarked ? "is-bookmarked" : ""}`} disabled={preview||busy||!workspace.canEdit} aria-pressed={state?.bookmarked||false} onClick={()=>save({bookmarked:!state?.bookmarked})}>
      <AppIcon icon="bookmark" size={16}/>{state?.bookmarked?"In your locker":"Bookmark"}
    </Button>
    {compact&&(preview?<Button className="pc-learn-action-primary" render={<Link href={`/preview/learn/concept/${detail.concept.id}`}/>}><span>Read full lesson</span><AppIcon icon="arrow-right" size={16}/></Button>:<Button className="pc-learn-action-primary" disabled={busy||!workspace.canEdit} onClick={()=>save({opened:true},true)}><span>Continue learning</span><AppIcon icon="arrow-right" size={16}/></Button>)}
    {!compact&&!preview&&<Button className="pc-learn-action-primary" disabled={busy||!workspace.canEdit} onClick={()=>save({opened:true})}>{state?"Record a revisit":"Start learning"}</Button>}
  </div>
  {message&&<p role="status" className="pc-learn-status-msg">{message}</p>}
 </div>
}
export function ConceptLens({detail,workspace,preview=false}:{detail:ConceptDetail;workspace:Workspace;preview?:boolean}){
 const c=detail.concept,base=preview?"/preview":`/w/${workspace.slug}`
 return <div className="pc-learn-lens">
  <header className="pc-learn-lens-header">
    <div className="pc-learn-lens-eyebrow-row">
      <span className="pc-learn-eyebrow-chip">
        <span className="pc-learn-chip-dot" aria-hidden="true"/>
        {c.language_version||"INTERVIEW FOUNDATIONS"}
      </span>
      <span className="pc-learn-version-tag">Version {c.version}</span>
    </div>
    <h3>{c.name}</h3>
    <p className="pc-learn-lens-sub">Original PrepCraft content · Core concepts & patterns</p>
  </header>
  <Tabs defaultValue="learn">
    <TabsList className="pc-learn-lens-tabs" aria-label="Concept views">
      {["learn","examples","practice","interview","notes"].map(tab=>
        <TabsTrigger key={tab} value={tab}>{tab[0].toUpperCase()+tab.slice(1)}</TabsTrigger>
      )}
    </TabsList>
    <TabsContent value="learn" className="pc-learn-tab-pane">
      <section className="pc-learn-card pc-learn-lens-idea">
        <div className="pc-learn-card-header">
          <span className="pc-learn-card-icon pc-learn-icon-idea" aria-hidden="true"><AppIcon icon="sparkles" size={14}/></span>
          <h4>Core idea</h4>
        </div>
        <p>{c.summary}</p>
      </section>
      <section className="pc-learn-card pc-learn-lens-mental">
        <div className="pc-learn-card-header">
          <span className="pc-learn-card-icon pc-learn-icon-mental" aria-hidden="true"><AppIcon icon="target" size={14}/></span>
          <h4>Mental model</h4>
        </div>
        <p>{c.mental_model}</p>
      </section>
      <section className="pc-learn-card pc-learn-trap">
        <div className="pc-learn-card-header">
          <span className="pc-learn-card-icon pc-learn-icon-trap" aria-hidden="true"><AppIcon icon="alert-circle" size={14}/></span>
          <h4>Misconception trap</h4>
        </div>
        <p>{c.misconception}</p>
      </section>
      <ConceptStateControls compact detail={detail} workspace={workspace} preview={preview}/>
    </TabsContent>
    <TabsContent value="examples" className="pc-learn-tab-pane">
      <section className="pc-learn-card pc-learn-example-card">
        <div className="pc-learn-card-header">
          <span className="pc-learn-card-icon pc-learn-icon-example" aria-hidden="true"><AppIcon icon="code" size={14}/></span>
          <h4>Worked example</h4>
        </div>
        <p>{c.worked_example}</p>
        {c.diagram&&<div className="pc-learn-diagram-wrap"><DomainLab kind={c.diagram}/></div>}
      </section>
    </TabsContent>
    <TabsContent value="practice" className="pc-learn-tab-pane">
      {detail.activities.length?detail.activities.map(a=><ActivityLauncher key={a.id} activity={a} workspace={workspace} preview={preview}/>):<div className="pc-learn-card pc-learn-empty-card"><p>No published activity yet. The lesson remains available.</p></div>}
    </TabsContent>
    <TabsContent value="interview" className="pc-learn-tab-pane">
      <section className="pc-learn-card pc-learn-interview-card">
        <div className="pc-learn-card-header">
          <span className="pc-learn-card-icon pc-learn-icon-interview" aria-hidden="true"><AppIcon icon="hint" size={14}/></span>
          <h4>Explain it clearly</h4>
        </div>
        <p className="pc-learn-prompt-text">{c.interview_prompt}</p>
        <Accordion className="pc-learn-interview-accordion">
          <AccordionItem value="short">
            <AccordionTrigger>30-second explanation</AccordionTrigger>
            <AccordionContent>{c.summary}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="long">
            <AccordionTrigger>Build a two-minute answer</AccordionTrigger>
            <AccordionContent>
              <p>{c.interview_answer}</p>
              <p className="pc-learn-followup"><strong>Follow up with:</strong> {c.worked_example}</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
      <p className="pc-learn-footnote">Practice explaining aloud. This content is a preparation guide; no interviewer simulation or automatic grading is implied.</p>
    </TabsContent>
    <TabsContent value="notes" className="pc-learn-tab-pane">
      <ConceptStateControls detail={detail} workspace={workspace} preview={preview}/>
    </TabsContent>
  </Tabs>
  {detail.relations.length>0&&<section className="pc-learn-bridge">
    <div className="pc-learn-card-header">
      <span className="pc-learn-card-icon pc-learn-icon-bridge" aria-hidden="true"><AppIcon icon="arrow-right" size={14}/></span>
      <h4>Knowledge bridge</h4>
    </div>
    <div className="pc-learn-bridge-list">
      {detail.relations.map(r=><Link key={r.id} href={`${base}/learn/concept/${r.id}`} className="pc-learn-bridge-item"><AppIcon icon="arrow-right" size={14}/><span>{r.name}</span><small>{r.type.replaceAll("_"," ")}</small></Link>)}
    </div>
  </section>}
  <section className="pc-learn-owned-evidence">
    <div className="pc-learn-card-header">
      <span className="pc-learn-card-icon pc-learn-icon-evidence" aria-hidden="true"><AppIcon icon="chart" size={14}/></span>
      <h4>Your evidence</h4>
    </div>
    <p className="pc-learn-evidence-body-text">{detail.evidence?.state==="unavailable"?"Mastery is temporarily unavailable. The lesson remains ready to use.":detail.evidence?.attempts?`Topic mastery: ${detail.evidence.level.replaceAll("_"," ")} · ${detail.evidence.confidence} confidence · ${detail.evidence.attempts} attempts in 90 days.`:"No assessed topic evidence yet. Reading alone does not establish mastery."}</p>
    {detail.revision&&<p className="pc-learn-evidence-recall"><AppIcon icon="clock" size={13}/><span>Next recall: {new Intl.DateTimeFormat("en",{timeZone:"UTC",dateStyle:"medium",timeStyle:"short"}).format(new Date(detail.revision.due_at))} UTC · {detail.revision.interval_days}-day interval. <Link href={`${base}/revision/${detail.revision.id}`}>View schedule</Link></span></p>}
  </section>
  <footer className="pc-learn-lens-evidence">
    <div className="pc-learn-evidence-footer-icon" aria-hidden="true">
      <AppIcon icon="chart" size={18}/>
    </div>
    <div className="pc-learn-evidence-footer-text">
      <strong>Understanding becomes evidence.</strong>
      <p>Reading is recorded separately from assessed practice. <Link href={`${base}/progress`}>View Mastery</Link> · <Link href={`${base}/revision`}>View Revision</Link></p>
    </div>
  </footer>
 </div>
}

