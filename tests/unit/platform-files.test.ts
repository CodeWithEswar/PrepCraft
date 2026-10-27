// @vitest-environment node
import { afterEach,expect,it,vi } from "vitest"
import { checksum,validMime,readFileBody } from "../../cloudflare/workers/platform/files"
import { transfer,rpc,type PlatformEnv } from "../../cloudflare/workers/platform"
import { jobSchema } from "../../cloudflare/workers/platform/contracts"
vi.mock("@sentry/cloudflare",()=>({withSentry:(_options:unknown,handler:unknown)=>handler}))
const uuid="00000000-0000-4000-8000-000000000001",origin="https://prepcraft.vercel.app"
afterEach(()=>vi.unstubAllGlobals())
it("checks actual file signatures and bounds UTF-8 text",async()=>{
 expect(validMime(new TextEncoder().encode("%PDF-1.7"),"application/pdf")).toBe(true)
 expect(validMime(new TextEncoder().encode("<html>fake PDF"),"application/pdf")).toBe(false)
 expect(validMime(Uint8Array.of(255,0,1),"text/plain")).toBe(false)
 expect(validMime(new TextEncoder().encode("Hello world"),"image/png")).toBe(false)
 expect(validMime(new TextEncoder().encode("Hello world"),"text/plain")).toBe(true)
 await expect(readFileBody(new Request("https://example.com",{method:"PUT",body:"12345"}),4)).rejects.toThrow("size_mismatch")
 await expect(readFileBody(new Request("https://example.com",{method:"PUT",body:"123",headers:{"Content-Length":"100"}}),3)).rejects.toThrow("size_mismatch")
 expect(await checksum(new TextEncoder().encode("abc"))).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad")
})
function env(){return {ENVIRONMENT:"production",APP_ORIGIN:origin,SUPABASE_URL:"https://test.supabase.co",SUPABASE_SERVICE_ROLE_KEY:"secret",FILES:{put:vi.fn(),get:vi.fn(),head:vi.fn()},FILE_LIMIT:{limit:vi.fn().mockResolvedValue({success:true})}} as unknown as PlatformEnv}
it("rejects hostile origins, query tokens and unauthenticated downloads before database access",async()=>{
 const send=vi.fn();vi.stubGlobal("fetch",send)
 const e=env()
 expect((await transfer(new Request("https://worker/files/download",{headers:{Origin:"https://evil.test"}}),e)).status).toBe(403)
 expect((await transfer(new Request("https://worker/files/download?token=private",{headers:{Origin:origin}}),e)).status).toBe(404)
 expect((await transfer(new Request("https://worker/files/download",{headers:{Origin:origin}}),e)).status).toBe(401)
 expect(send).not.toHaveBeenCalled()
})
it("keeps local workers away from the production database",async()=>{await expect(rpc({...env(),ENVIRONMENT:"local"},{kind:"dispatch"},vi.fn())).rejects.toThrow("invalid_contract")})
it("stores verified bytes conditionally and finalizes only after R2 confirms",async()=>{
 const bytes=new TextEncoder().encode("%PDF-1.7\nTest"),hash=await checksum(bytes),e=env(),commands:Record<string,unknown>[]=[]
 vi.stubGlobal("fetch",vi.fn(async(_url,init:RequestInit)=>{const {p_command:c}=JSON.parse(String(init.body));commands.push(c);return Response.json(c.kind==="file.claim"?{state:"claimed",operationId:uuid,leaseToken:uuid,file:{id:uuid,bucket:"prepcraft-private-files",key:"workspaces/opaque/files/opaque/source",name:"test.pdf",mime:"application/pdf",bytes:bytes.length,checksum:hash}}:{state:"ready"})}))
 vi.mocked(e.FILES.put).mockResolvedValue({size:bytes.length,etag:"test",customMetadata:{fileId:uuid,checksum:hash}} as never)
 const result=await transfer(new Request("https://worker/files/upload",{method:"PUT",headers:{Origin:origin,Authorization:"Bearer "+"a".repeat(64),"Content-Type":"application/pdf"},body:bytes}),e)
 expect(result.status).toBe(200);expect(result.headers.get("Cache-Control")).toContain("no-store")
 expect(e.FILES.put).toHaveBeenCalledWith(expect.any(String),bytes,expect.objectContaining({onlyIf:{etagDoesNotMatch:"*"}}))
 expect(commands.map(c=>c.kind)).toEqual(["file.claim","file.finish"])
 expect(commands[1].checksum).toBe(hash)
})
it("rejects extra private content in queue envelopes",()=>{expect(jobSchema.safeParse({version:1,type:"platform.job",eventId:uuid,workspaceId:uuid,userId:uuid,correlationId:uuid,causationId:null,occurredAt:new Date().toISOString(),payload:{id:uuid,kind:"file.delete"},answer:"private"}).success).toBe(false)})
