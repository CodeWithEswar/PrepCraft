// @vitest-environment node
import { expect, it } from "vitest"
import { z } from "zod"
import { createQueueEnvelopeSchema } from "./queue-envelope"

const schema=createQueueEnvelopeSchema("test.event",z.strictObject({recordId:z.uuid()}))
const id="e1eac009-e21f-4c92-98bb-08cb0a6c6ca1"
const message={version:1,type:"test.event",eventId:id,workspaceId:id,correlationId:id,occurredAt:"2026-10-24T00:00:00Z",idempotencyKey:`test:${id}`,payload:{recordId:id}}
it("validates the envelope and consumer-specific payload without changing duplicate identity",()=>{
  expect(schema.parse(message)).toEqual(schema.parse(message))
  for(const change of [{version:2},{workspaceId:""},{type:"other.event"},{occurredAt:"tomorrow"},{payload:{recordId:id,token:"secret"}},{idempotencyKey:""},{extra:true}]) expect(schema.safeParse({...message,...change}).success).toBe(false)
})
