import "server-only"
import type { MockHomeData,MockReview,MockSession } from "../types/mock.types"
import { resolveWorkspace } from "@/features/workspaces/server"
async function unavailable(slug:string):Promise<never>{const context=await resolveWorkspace(slug);if(!context?.permissions.canView)throw Error("Mock interview access unavailable.");throw Error("Live mock recording is not connected. Use Practice for saved sessions, or explore the isolated mock preview.")}
export async function getMockHomeData(slug:string):Promise<MockHomeData>{return unavailable(slug)}
export async function getMockSession(slug:string,_sessionId:string):Promise<MockSession>{return unavailable(slug)}
export async function getMockReview(slug:string,_sessionId:string):Promise<MockReview>{return unavailable(slug)}
