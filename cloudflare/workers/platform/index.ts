import type { Queue,MessageBatch,R2Bucket,RateLimit } from "@cloudflare/workers-types"
import { z } from "zod"
import { jobSchema,outboxSchema,claimSchema,type PlatformJob } from "./contracts"
import { checksum,validMime,readFileBody,FileError } from "./files"
import { fromHttpStatus,RetryableError,TerminalError } from "../../shared/validation/errors"
import { createWorkerLogger } from "../../shared/observability/structured-logger"
import { withSentry } from "@sentry/cloudflare"
import { workerMonitoring,type WorkerMonitoringEnv } from "../../shared/observability/sentry"
export interface PlatformEnv extends WorkerMonitoringEnv {ENVIRONMENT:"local"|"production"|"preview";APP_ORIGIN:string;SUPABASE_URL:string;SUPABASE_SERVICE_ROLE_KEY:string;FILES:R2Bucket;FILE_LIMIT:RateLimit;PLATFORM_JOBS:Queue<PlatformJob>}
const log=createWorkerLogger({worker:"prepcraft-platform"})
export async function rpc(e:PlatformEnv,command:Record<string,unknown>,send:typeof fetch=fetch):Promise<unknown>{
 // Local bindings cannot accidentally access the linked production database.
 const local=e.ENVIRONMENT==="local"
 if(local?!/^http:\/\/(127\.0\.0\.1|localhost):54321$/.test(e.SUPABASE_URL):!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(e.SUPABASE_URL))throw new TerminalError("invalid_contract")
 let response:Response;try{response=await send(e.SUPABASE_URL+"/rest/v1/rpc/platform_worker",{method:"POST",headers:{apikey:e.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${e.SUPABASE_SERVICE_ROLE_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({p_command:{...command,environment:local?"preview":e.ENVIRONMENT}}),signal:AbortSignal.timeout(20000)})}catch{throw new RetryableError("dependency_timeout")}
 if(!response.ok)throw fromHttpStatus(response.status);return response.json()
}
function response(body:unknown,status:number,origin?:string,requestId?:string){return Response.json(body,{status,headers:{"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer",...(origin?{"Access-Control-Allow-Origin":origin,Vary:"Origin"}:{}),...(requestId?{"X-Request-Id":requestId}:{})}})}
export async function transfer(request:Request,e:PlatformEnv){
 const requestId=crypto.randomUUID(),url=new URL(request.url),origin=request.headers.get("Origin")
 if(url.pathname==="/health"&&request.method==="GET")return response({service:"prepcraft-platform",version:1},200)
 if(origin!==e.APP_ORIGIN)return response({error:"Origin not allowed"},403)
 if(request.method==="OPTIONS")return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Methods":"PUT, GET, OPTIONS","Access-Control-Allow-Headers":"Authorization, Content-Type","Access-Control-Max-Age":"600",Vary:"Origin","Cache-Control":"no-store"}})
 const purpose=url.pathname==="/files/upload"&&request.method==="PUT"?"upload":url.pathname==="/files/download"&&request.method==="GET"?"download":null
 if(!purpose||url.search)return response({error:"Not found"},404,origin,requestId)
 const token=request.headers.get("Authorization")?.match(/^Bearer ([a-f0-9]{64})$/)?.[1]
 if(!token)return response({error:"Access grant required"},401,origin,requestId)
 // Distributed per-location limiter is an abuse guard; the database also applies account quotas.
 const limiterKey=await checksum(new TextEncoder().encode(request.headers.get("CF-Connecting-IP")||"local"))
 if(!(await e.FILE_LIMIT.limit({key:limiterKey})).success)return response({error:"Please wait before retrying"},429,origin,requestId)
 let claim:z.infer<typeof claimSchema>|undefined
 try{
  claim=claimSchema.parse(await rpc(e,{kind:"file.claim",token,purpose}))
  if(claim.state==="done")return response({status:"READY"},200,origin,requestId)
  if(claim.state!=="claimed")return response({error:claim.state==="busy"?"Transfer already in progress":"Grant expired or access changed"},claim.state==="busy"?409:403,origin,requestId)
  const {file}=claim,expectedBucket=e.ENVIRONMENT==="production"?"prepcraft-private-files":"prepcraft-preview-files"
  if(file.bucket!==expectedBucket)throw new TerminalError("unauthorized")
  if(purpose==="upload"){
   if(request.headers.get("Content-Type")?.split(";")[0]!==file.mime)throw new FileError("mime_invalid")
   const bytes=await readFileBody(request,file.bytes)
   if(!validMime(bytes,file.mime))throw new FileError("mime_invalid")
   if(await checksum(bytes)!==file.checksum)throw new FileError("checksum_mismatch")
   const uploaded=await e.FILES.put(file.key,bytes,{onlyIf:{etagDoesNotMatch:"*"},httpMetadata:{contentType:file.mime},customMetadata:{fileId:file.id,checksum:file.checksum}})
   const stored=uploaded||await e.FILES.head(file.key)
   if(!stored||stored.size!==file.bytes||stored.customMetadata?.fileId!==file.id||stored.customMetadata?.checksum!==file.checksum)throw new TerminalError("conflict")
   const saved=z.object({state:z.string()}).parse(await rpc(e,{kind:"file.finish",operationId:claim.operationId,leaseToken:claim.leaseToken,status:"ready",checksum:file.checksum,bytes:stored.size,etag:stored.etag}))
   if(saved.state!=="ready")return response({error:"Access changed. The upload was not finalized."},409,origin,requestId)
   return response({status:"READY",id:file.id},200,origin,requestId)
  }
  const stored=await e.FILES.get(file.key)
  if(!stored||stored.size!==file.bytes||stored.customMetadata?.fileId!==file.id||stored.customMetadata?.checksum!==file.checksum)return response({error:"File unavailable. Request a new download."},404,origin,requestId)
  return new Response(stored.body as unknown as BodyInit,{headers:{"Content-Type":file.mime,"Content-Disposition":`attachment; filename="download"; filename*=UTF-8''${encodeURIComponent(file.name).replace(/['()*]/g,c=>"%"+c.charCodeAt(0).toString(16))}`,"Content-Length":String(stored.size),"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","Access-Control-Allow-Origin":origin,"X-Request-Id":requestId,Vary:"Origin"}})
 }catch(error){
  const code=error instanceof FileError?error.code:error instanceof TerminalError||error instanceof RetryableError?error.code:"dependency_unavailable"
  if(purpose==="upload"&&claim?.state==="claimed")try{await rpc(e,{kind:"file.finish",operationId:claim.operationId,leaseToken:claim.leaseToken,status:"failed",code})}catch{/* Pending state is recoverable by expiry reconciliation. */}
  log.warn("file_transfer_failed",{operation:purpose,requestId,errorCategory:code,outcome:error instanceof FileError||error instanceof TerminalError?"terminal_failure":"retryable_failure"})
  return response({error:error instanceof FileError?"The file did not pass verification. Check its type and size.":"Transfer could not be confirmed. Refresh your files before retrying."},error instanceof FileError?422:503,origin,requestId)
 }
}
export async function dispatch(e:PlatformEnv){
 const jobs=outboxSchema.parse(await rpc(e,{kind:"dispatch"}))
 for(const j of jobs){await e.PLATFORM_JOBS.send({version:1,type:"platform.job",eventId:j.eventId,occurredAt:new Date(j.occurredAt).toISOString(),workspaceId:j.workspaceId,userId:j.userId,correlationId:j.correlationId,causationId:j.causationId,payload:{id:j.id,kind:j.kind}});await rpc(e,{kind:"job.published",id:j.id,leaseToken:j.leaseToken})}
 const files=z.array(z.object({id:z.uuid(),key:z.string(),bytes:z.number(),checksum:z.string()})).max(25).parse(await rpc(e,{kind:"reconcile.claim"}))
 for(const f of files){const head=await e.FILES.head(f.key);if(!head||head.size!==f.bytes||head.customMetadata?.fileId!==f.id||head.customMetadata?.checksum!==f.checksum)await rpc(e,{kind:"reconcile.missing",id:f.id})}
 const {cursor}=z.object({cursor:z.string().nullable()}).parse(await rpc(e,{kind:"orphan.cursor"})),page=await e.FILES.list({limit:5,...(cursor?{cursor}:{})})
 for(const object of page.objects)await rpc(e,{kind:"orphan.observe",key:object.key,bytes:object.size})
 await rpc(e,{kind:"orphan.checkpoint",cursor:page.truncated?page.cursor:null})
 log.info("dispatch_completed",{operation:"dispatch",count:jobs.length,outcome:"success"})
}
export async function consume(batch:MessageBatch<unknown>,e:PlatformEnv){for(const message of batch.messages){const parsed=jobSchema.safeParse(message.body);if(!parsed.success){log.warn("invalid_queue_envelope",{operation:"consume",outcome:"terminal_failure",errorCategory:"invalid_contract"});message.ack();continue}const j=parsed.data;try{
 if(batch.queue.endsWith("-dlq")){await rpc(e,{kind:"job.failed",id:j.payload.id});message.ack();continue}
 const job=z.object({state:z.string(),id:z.uuid().optional(),leaseToken:z.uuid().optional(),key:z.string().optional(),bucket:z.string().optional()}).parse(await rpc(e,{kind:"job.claim",id:j.payload.id,eventId:j.eventId,jobKind:j.payload.kind}))
 if(job.state==="claimed"){
  if(!job.key||!job.id||!job.leaseToken||job.bucket!==(e.ENVIRONMENT==="production"?"prepcraft-private-files":"prepcraft-preview-files"))throw new TerminalError("invalid_contract")
  await e.FILES.delete(job.key);await rpc(e,{kind:"job.finished",id:job.id,leaseToken:job.leaseToken})
 }
 message.ack()
 log.info("job_processed",{operation:"consume",eventId:j.eventId,correlationId:j.correlationId,outcome:"success"})
 }catch(error){log.warn("job_retry",{operation:"consume",eventId:j.eventId,errorCategory:error instanceof TerminalError||error instanceof RetryableError?error.code:"dependency_unavailable",outcome:error instanceof TerminalError?"terminal_failure":"retryable_failure"});if(error instanceof TerminalError){await rpc(e,{kind:"job.failed",id:j.payload.id});message.ack()}else message.retry({delaySeconds:Math.min(900,30*2**message.attempts)})}}}
const worker={fetch:transfer,queue:consume,async scheduled(_event:unknown,e:PlatformEnv){await dispatch(e)}}
export default withSentry((e:PlatformEnv)=>workerMonitoring(e),worker)
