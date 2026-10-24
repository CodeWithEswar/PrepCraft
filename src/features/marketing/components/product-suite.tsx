"use client"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { AppIcon } from "@/components/app-icon"
import { productSuite } from "../content/product-suite"
import { StartPreview } from "./start-preview"
import { useReducedMotionPreference } from "../motion/use-fine-pointer"

function ProductPanel({item,index}: {item:typeof productSuite[number];index:number}) {
  const track = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotionPreference()
  const move = (direction:number) => {
    if(!track.current) return
    track.current.scrollBy({left:direction*(track.current.clientWidth*.85),behavior:reduced?"instant":"smooth"})
  }
  return <section id={`suite-${item.id}`} className="pc-suite-panel" data-suite-index={index} aria-labelledby={`suite-title-${item.id}`} style={{"--panel-index":index} as React.CSSProperties}>
    <div className="pc-suite-panel-heading"><div><p className="mk-kicker"><span>0{index+1}</span> / {item.label}</p><h3 id={`suite-title-${item.id}`}>{item.title}</h3><p>{item.description}</p></div><div className="pc-suite-arrows"><Button variant="outline" size="icon" aria-label={`Previous ${item.label.toLowerCase()} tools`} onClick={()=>move(-1)}><AppIcon icon="arrow-left" size={18}/></Button><Button variant="outline" size="icon" aria-label={`Next ${item.label.toLowerCase()} tools`} onClick={()=>move(1)}><AppIcon icon="arrow-right" size={18}/></Button></div></div>
    <div className="pc-suite-cards" ref={track} tabIndex={0} aria-label={`${item.label} tools`}>
      {item.cards.map(card=><article key={card.title} className="pc-product-card"><div className="pc-product-art"><span>{card.tag}</span><Image src={`/brand/landing/${card.image}.webp`} alt="" width={card.image.startsWith("hero-gallery")?1000:1200} height={card.height} sizes="(max-width:767px) 80vw, (max-width:1099px) 320px, 360px"/></div><div className="pc-product-copy"><h4>{card.title}</h4><p>{card.description}</p><a href={card.href}>Explore the preview <AppIcon icon="arrow-right" size={16}/></a></div></article>)}
    </div>
  </section>
}

export function ProductSuite() {
  const ref = useRef<HTMLDivElement>(null)
  const [active,setActive] = useState(0)
  useEffect(()=>{
    const panels=ref.current?.querySelectorAll<HTMLElement>("[data-suite-index]")
    if(!panels) return
    const visible=new Set<number>()
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries) {
        const index=Number((entry.target as HTMLElement).dataset.suiteIndex)
        if(entry.isIntersecting) visible.add(index); else visible.delete(index)
      }
      if(visible.size) setActive(Math.max(...visible))
    },{rootMargin:"-150px 0px -25% 0px",threshold:0.3})
    panels.forEach(panel=>observer.observe(panel))
    return ()=>observer.disconnect()
  },[])
  return <section ref={ref} className="pc-suite" id="workflow" aria-labelledby="suite-heading"><div className="container-page pc-suite-intro"><p className="mk-kicker">One workspace. The whole preparation journey.</p><h2 id="suite-heading">The connected <span>preparation system</span><br/>you’ve been looking for.</h2><p>Less switching between tools. More understanding of what comes next.</p></div>
    <nav className="pc-suite-navigation" aria-label="Preparation tools"><div className="container-page pc-suite-nav-inner"><div className="pc-suite-nav-links">{productSuite.map((item,i)=><a key={item.id} href={`#suite-${item.id}`} aria-current={active===i?"step":undefined}>{item.label}<span/></a>)}</div><StartPreview label="Explore PrepCraft"/></div></nav>
    <div className="container-page pc-suite-panels">{productSuite.map((item,index)=><ProductPanel key={item.id} item={item} index={index}/>)}</div><p className="container-page pc-suite-disclaimer">A look at the planned workspace. The interactive examples below use sample content.</p>
  </section>
}
