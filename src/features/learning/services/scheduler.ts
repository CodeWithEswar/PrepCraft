export interface ProcessInput{id:string;arrival:number;burst:number}
export interface ScheduleSlice{id:string;start:number;end:number}
export type Algorithm="FCFS"|"SJF"|"SRTF"|"Round Robin"
/** Bounded, integer-time classroom simulation. No wall-clock or server execution. */
export function schedule(processes:ProcessInput[],algorithm:Algorithm,quantum=2){
 if(!processes.length||processes.length>8||new Set(processes.map(p=>p.id)).size!==processes.length||processes.some(p=>!Number.isInteger(p.arrival)||p.arrival<0||p.arrival>100||!Number.isInteger(p.burst)||p.burst<1||p.burst>50)||!Number.isInteger(quantum)||quantum<1||quantum>20)throw new Error("Invalid scheduling fixture")
 const jobs=processes.map((p,i)=>({...p,left:p.burst,index:i})),slices:ScheduleSlice[]=[],queue:number[]=[],seen=new Set<number>();let now=0,running:number|null=null,used=0
 const append=(id:string)=>{const last=slices.at(-1);if(last?.id===id&&last.end===now)last.end++;else slices.push({id,start:now,end:now+1})}
 while(jobs.some(p=>p.left)){
  for(const p of jobs.toSorted((a,b)=>a.arrival-b.arrival||a.index-b.index))if(p.arrival<=now&&!seen.has(p.index)){seen.add(p.index);queue.push(p.index)}
  const ready=jobs.filter(p=>p.arrival<=now&&p.left>0)
  if(algorithm==="Round Robin"){
   if(running!==null&&(jobs[running].left===0||used===quantum)){if(jobs[running].left>0)queue.push(running);running=null;used=0}
   if(running===null)running=queue.shift()??null
  }else if(algorithm==="SRTF"||running===null||jobs[running].left===0){const sorted=ready.toSorted((a,b)=>algorithm==="FCFS"?a.arrival-b.arrival||a.index-b.index:(algorithm==="SRTF"?a.left-b.left:a.burst-b.burst)||a.arrival-b.arrival||a.index-b.index);running=sorted[0]?.index??null}
  if(running===null){append("Idle");now++;continue}append(jobs[running].id);jobs[running].left--;now++;used++
  if(now>1000)throw new Error("Scheduling bound exceeded")
 }
 return {slices,metrics:processes.map(p=>{const completion=slices.filter(s=>s.id===p.id).at(-1)!.end;return {...p,completion,turnaround:completion-p.arrival,waiting:completion-p.arrival-p.burst}})}
}
export function pageFaults(pages:number[],frames:number,policy:"FIFO"|"LRU"){
 if(frames<1||frames>8||pages.length>50)throw new Error("Invalid page fixture");const memory:number[]=[],recent=new Map<number,number>();let faults=0,next=0
 return pages.map((page,i)=>{const hit=memory.includes(page);if(!hit){faults++;if(memory.length<frames)memory.push(page);else{const replace=policy==="FIFO"?next:memory.reduce((best,p,j)=>(recent.get(p)??-1)<(recent.get(memory[best])??-1)?j:best,0);memory[replace]=page;if(policy==="FIFO")next=(next+1)%frames}}recent.set(page,i);return {page,hit,memory:[...memory],faults}})
}
