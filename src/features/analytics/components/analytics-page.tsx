"use client"
import { useEffect,useState,useTransition,useSyncExternalStore } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AppIcon } from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import { Command,CommandInput,CommandList,CommandEmpty,CommandGroup,CommandItem } from "@/components/ui/command"
import { ChartOverlay,ChartSkeleton } from "@/components/charts"
import { emitAnalyticsEvent } from "@/lib/observability/analytics-events"
import { analyticsHref } from "../services/analytics-policy"
import type { AnalyticsSnapshot,AnalyticsFilters,AnalyticsView } from "../types/analytics.types"
import { AnalyticsFiltersDialog,rangeOptions } from "./analytics-filters"
import { AnalyticsSelect } from "./analytics-select"
import { AnalyticsEvidenceDrawer } from "./evidence-drawer"
import { ConstraintFinder,EvidenceProfile,PreparationCalendar } from "./analytics-widgets"
import "../analytics.css"
const loading=()=> <ChartSkeleton/>
const Overview=dynamic(()=>import("./views/overview"),{loading})
const Dsa=dynamic(()=>import("./views/dsa"),{loading})
const Timing=dynamic(()=>import("./views/timing"),{loading})
const Consistency=dynamic(()=>import("./views/consistency"),{loading})
const Interviews=dynamic(()=>import("./views/interviews"),{loading})
const Topics=dynamic(()=>import("./views/topics"),{loading})
export const analyticsViews:{id:AnalyticsView;label:string}[]=[{id:"overview",label:"Overview"},{id:"dsa",label:"DSA"},{id:"timing",label:"Timing"},{id:"consistency",label:"Consistency"},{id:"interviews",label:"Interviews"},{id:"topics",label:"Topics"}]
type Metric="all"|"timing"|"independent"|"assisted"|"objective"|"topic"
const subscribeHydration=()=>()=>{}
export default function AnalyticsPage({snapshot:s}:{snapshot:AnalyticsSnapshot}){
 const hydrated=useSyncExternalStore(subscribeHydration,()=>true,()=>false),router=useRouter(),[pending,startTransition]=useTransition(),[filters,setFilters]=useState(false),[search,setSearch]=useState(false),[metric,setMetric]=useState<Metric|null>(null)
 const apply=(next:AnalyticsFilters,view=s.view)=>{emitAnalyticsEvent("analytics.filter.changed",{view});startTransition(()=>router.push(analyticsHref(s.context.workspace.slug,view,next,s.preview)))}
 useEffect(()=>{emitAnalyticsEvent("analytics.viewed",{view:s.view,pointCount:s.core?.points.length||0})},[s.view,s.core?.points.length])
 useEffect(()=>{const handler=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();e.stopImmediatePropagation();setSearch(v=>!v)}};window.addEventListener("keydown",handler,true);return()=>window.removeEventListener("keydown",handler,true)},[])
 const onTopic=(topic:string)=>apply({...s.filters,topic},"topics"),props={snapshot:s,onEvidence:(metric:Metric="all")=>setMetric(metric),onRetry:()=>router.refresh(),onTopic}
 const View={overview:Overview,dsa:Dsa,timing:Timing,consistency:Consistency,interviews:Interviews,topics:Topics}[s.view]
 const active=Object.entries(s.filters).filter(([k,v])=>!["range","compare","granularity","cohort","from","to"].includes(k)&&v!=="all").length
 return <div className="pc-analytics" data-ready={hydrated} aria-busy={pending} onClickCapture={e=>{if((e.target as HTMLElement).closest('a[href*="/practice"],a[href*="/revision"],a[href*="/plan?"]'))emitAnalyticsEvent("analytics.action.clicked",{view:s.view})}}>
  <header className="pc-an-page-header"><div><p className="pc-an-breadcrumb"><AppIcon icon="chart" size={15}/>Analytics<AppIcon icon="chevron-right" size={12}/>{analyticsViews.find(v=>v.id===s.view)?.label}</p><h1>Analytics</h1><p>Understand your evidence. Choose your next move.</p></div><div className="pc-an-header-tools"><Button variant="outline" className="pc-an-search" onClick={()=>setSearch(true)}><AppIcon icon="search" size={17}/><span>Search topics and insights…</span><kbd>⌘ K</kbd></Button><AnalyticsSelect label="Analytics date range" value={s.filters.range} items={rangeOptions} onChange={range=>{if(range==="custom"){setFilters(true);return}apply({...s.filters,range:range as AnalyticsFilters["range"]})}}/></div></header>
  <div className="pc-an-context"><span><AppIcon icon="building" size={13}/>{s.context.workspace.name}</span><span>{s.context.from} – {s.context.to}</span><span>{s.context.workspace.timezone} · {s.context.granularity} buckets</span>{s.preview&&<strong>Illustrative preview · no personal records</strong>}</div>
  <div className="pc-an-nav-row"><nav className="pc-an-tabs" aria-label="Analytics views">{analyticsViews.map(v=><Link key={v.id} href={analyticsHref(s.context.workspace.slug,v.id,s.filters,s.preview)} aria-current={v.id===s.view?"page":undefined}>{v.label}</Link>)}</nav><Button variant="outline" className="pc-an-filter-button" onClick={()=>setFilters(true)}><AppIcon icon="filter" size={16}/>Filters{active>0&&<span>{active}</span>}</Button></div>
  {s.filterWarning&&<p className="pc-an-notice" role="alert">{s.filterWarning}</p>}
  {s.context.partial&&<p className="pc-an-notice">This range includes a partial local day. Previous-period improvement claims are disabled.</p>}
  {Object.values(s.sources).includes("error")&&<div className="pc-an-notice" role="alert">Some source evidence is unavailable. Available charts remain visible.<Button variant="ghost" onClick={()=>router.refresh()}>Retry sources</Button></div>}
  {(s.core?.truncated||s.activity?.truncated)&&<p className="pc-an-notice">This range exceeds a source row limit. Results are partial; narrow the date range. Comparison claims are disabled.</p>}
  <div className="pc-an-layout"><div role="region" className="pc-an-main" aria-label={`${analyticsViews.find(v=>v.id===s.view)?.label} analytics`}><View {...props}/></div><aside className="pc-an-rail" aria-label="Analytics decisions and source evidence"><EvidenceProfile snapshot={s}/><PreparationCalendar key={`${s.context.from}:${s.context.to}`} snapshot={s} compact/><ConstraintFinder snapshot={s}/><section className="pc-an-panel pc-an-policy"><h2>Evidence before conclusions.</h2><p>Self-reported coding outcomes and evaluated objective answers stay separate. Small samples remain visible.</p><p>{s.context.policyVersion}<br/>{s.context.timingPolicyVersion}</p><p>Calculated {new Intl.DateTimeFormat("en-GB",{timeZone:s.context.workspace.timezone,dateStyle:"medium",timeStyle:"short"}).format(new Date(s.generatedAt))}</p></section></aside></div>
  <AnalyticsFiltersDialog key={filters?"open":"closed"} snapshot={s} open={filters} onClose={()=>setFilters(false)} onApply={apply}/>
  {metric&&<AnalyticsEvidenceDrawer key={metric+JSON.stringify(s.filters)} snapshot={s} metric={metric} onClose={()=>setMetric(null)}/>}
  <ChartOverlay open={search} onOpenChange={setSearch} title="Search Analytics" description="Jump to a view or filter by a canonical topic. Search does not read private answers or story text."><Command><CommandInput placeholder="Search topics or views…"/><CommandList><CommandEmpty>No matching topic or view.</CommandEmpty><CommandGroup heading="Views">{analyticsViews.map(v=><CommandItem key={v.id} onSelect={()=>{setSearch(false);apply(s.filters,v.id)}}>{v.label}</CommandItem>)}</CommandGroup><CommandGroup heading="Canonical topics">{s.catalog.topics.map(t=><CommandItem key={t.id} value={`${t.name} ${t.id}`} onSelect={()=>{setSearch(false);onTopic(t.id)}}>{t.name}</CommandItem>)}</CommandGroup></CommandList></Command></ChartOverlay>
 </div>
}
