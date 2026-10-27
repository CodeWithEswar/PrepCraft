import { expect,it } from "vitest"
import { verifyBackendIsolation } from "@/lib/env/backend-isolation"
it("requires a separate backend for preview even when local live access is explicitly enabled",()=>{expect(()=>verifyBackendIsolation("https://tkfqomwymkgcnjakppon.supabase.co","preview",true)).toThrow("separate Supabase");expect(()=>verifyBackendIsolation("http://127.0.0.1:54321","local")).not.toThrow()})
it("requires intentional local access and permits the canonical production project in production",()=>{const url="https://tkfqomwymkgcnjakppon.supabase.co";expect(()=>verifyBackendIsolation(url,"local")).toThrow("ALLOW_LIVE_BACKEND");expect(()=>verifyBackendIsolation(url,"local",true)).not.toThrow();expect(()=>verifyBackendIsolation(url,"production")).not.toThrow()})
