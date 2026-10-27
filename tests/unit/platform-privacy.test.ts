import { expect,it } from "vitest"
import { privateErrorEvent,privateTransaction,safeRoute } from "@/lib/observability/privacy"
it("removes content, identity, request credentials and query strings before Sentry transport",()=>{
 const result=privateErrorEvent({event_id:"abc",request:{url:"https://site/w/private?token=secret",cookies:"secret"},user:{email:"private@example.com"},extra:{answer:"private"},breadcrumbs:[{message:"secret"}],exception:{values:[{type:"Error",value:"private password",stacktrace:{frames:[{filename:"https://site/w/company?secret=yes",function:"safe",lineno:5,vars:{token:"secret"}}]}}]}} as never)
 const value=JSON.stringify(result)
 expect(value).not.toMatch(/secret|password|private@example|cookies|breadcrumbs|answer/)
 expect(value).toContain("Error")
})
it("masks workspace paths and UUIDs and removes transaction spans",()=>{
 expect(safeRoute("https://site/w/amazon/attempt/00000000-0000-4000-8000-000000000001?token=secret")).toBe("/w/:id/attempt/:id")
 const result=privateTransaction({transaction:"/w/amazon/today?token=secret",spans:[{data:{answer:"secret"}}],contexts:{trace:{trace_id:"a".repeat(32),span_id:"b".repeat(16),data:{secret:"yes"}}}} as never)
 expect(JSON.stringify(result)).not.toContain("secret")
 expect(result.spans).toEqual([])
})
