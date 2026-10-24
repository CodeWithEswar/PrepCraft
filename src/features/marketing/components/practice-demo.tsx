"use client"
import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AppIcon } from "@/components/app-icon"
import { RevisionEcho } from "../motion/signature-visuals"

export function PracticeDemo() {
  const [reviewed, setReviewed] = useState(false)
  return <div className="mk-practice-demo"><div className="mk-demo-label"><span>Practice reflection</span><Badge variant="outline">Interactive sample</Badge></div><Tabs defaultValue="attempt"><TabsList aria-label="Practice reflection"><TabsTrigger value="attempt">Attempt</TabsTrigger><TabsTrigger value="reflection">Reflection</TabsTrigger><TabsTrigger value="revision">Revision</TabsTrigger></TabsList>
    <TabsContent value="attempt"><div className="mk-attempt-title"><div><p className="mk-kicker">Arrays / two pointers</p><h3>Two Sum II</h3></div><Badge variant="secondary">Medium</Badge></div><div className="mk-attempt-meta"><span><AppIcon icon="clock" size={14} />24 min</span><span>Pattern recognized</span></div><pre className="mk-code" tabIndex={0} role="region" aria-label="Illustrative Two Sum code sample"><code>{`while (left < right) {\n  const sum = numbers[left] + numbers[right];\n  if (sum === target) return [left + 1, right + 1];\n  sum < target ? left++ : right--;\n}`}</code></pre><p className="mk-demo-disclaimer">Illustrative snippet · code execution is not available in this preview.</p></TabsContent>
    <TabsContent value="reflection"><div className="mk-attempt-title"><h3>The pattern was right.<br />The boundary wasn’t.</h3></div><Badge variant="outline">Edge cases</Badge><p className="mk-reflection-copy">I returned zero-based indices. The problem asks for one-based positions. Next time: read the output contract before coding.</p><Button variant={reviewed ? "secondary" : "outline"} onClick={() => setReviewed(!reviewed)}><AppIcon icon="check" size={16} />{reviewed ? "Lesson reviewed" : "Mark lesson reviewed"}</Button><p className="mk-demo-disclaimer" aria-live="polite">{reviewed ? "Sample lesson marked as reviewed for this visit." : "Sample reflection · no account or saved record."}</p></TabsContent>
    <TabsContent value="revision"><div className="mk-attempt-title"><h3>Solved once ≠ remembered.</h3></div><RevisionEcho /><ol className="mk-revision-schedule"><li><strong>Today</strong><span>Recheck the output contract</span></li><li><strong>In 3 days</strong><span>Solve without the earlier approach</span></li><li><strong>In 7 days</strong><span>Try a timed variation</span></li></ol><p className="mk-demo-disclaimer">Example intervals, not an automatically assigned schedule.</p></TabsContent>
  </Tabs></div>
}
