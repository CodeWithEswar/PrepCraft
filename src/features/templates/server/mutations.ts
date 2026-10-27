"use server"

import "server-only"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import {
  applyTemplateSchema,
  upgradeTemplateSchema,
  curriculumOverrideSchema,
  type ApplyTemplateInput,
  type UpgradeTemplateInput,
  type CurriculumOverrideInput,
} from "../schemas/template.schema"

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Server action to apply a preparation template to a workspace.
 * Idempotent: Executed via security-definer PostgreSQL transaction stored procedure.
 */
export async function applyTemplateAction(
  rawInput: ApplyTemplateInput
): Promise<ActionResult<{ appliedVersionNumber: number }>> {
  try {
    const validated = applyTemplateSchema.safeParse(rawInput)
    if (!validated.success) {
      return { success: false, error: validated.error.issues?.[0]?.message || "Invalid input" }
    }

    const { workspaceId, templateId, versionNumber } = validated.data
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Authentication required" }
    }

    // 2. Authorize active membership
    const { data: membership, error: memberError } = await supabase
      .from("workspace_members")
      .select("id, role, status")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()

    if (memberError || !membership) {
      return { success: false, error: "Unauthorized: Active workspace membership required" }
    }

    // 3. Execute transactional application RPC
    const { data: rawResult, error: rpcError } = await supabase.rpc(
      "apply_template_to_workspace",
      {
        p_workspace_id: workspaceId,
        p_template_id: templateId,
        p_version_number: versionNumber ?? undefined,
      }
    )
    const result = rawResult as { version_number?: number } | null

    if (rpcError) {
      console.error("[applyTemplateAction] RPC Error:", rpcError)
      return { success: false, error: rpcError.message || "Failed to apply template" }
    }

    // 4. Fetch workspace slug for path revalidation
    const { data: ws } = await supabase
      .from("workspaces")
      .select("slug")
      .eq("id", workspaceId)
      .maybeSingle()

    if (ws?.slug) {
      revalidatePath(`/w/${ws.slug}`)
      revalidatePath(`/w/${ws.slug}/settings`)
      revalidatePath(`/w/${ws.slug}/templates`)
      revalidatePath(`/w/${ws.slug}/today`)
      revalidatePath(`/w/${ws.slug}/plan`)
    }

    return {
      success: true,
      data: {
        appliedVersionNumber: result?.version_number ?? versionNumber ?? 1,
      },
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred"
    console.error("[applyTemplateAction] Exception:", err)
    return { success: false, error: errorMsg }
  }
}

/**
 * Server action to upgrade a workspace's pinned template to a newer published version.
 * Safeguard: User progress, attempts, and revisions are completely preserved.
 */
export async function upgradeTemplateAction(
  rawInput: UpgradeTemplateInput
): Promise<ActionResult<{ upgradedVersionNumber: number }>> {
  try {
    const validated = upgradeTemplateSchema.safeParse(rawInput)
    if (!validated.success) {
      return { success: false, error: validated.error.issues?.[0]?.message || "Invalid input" }
    }

    const { workspaceId, templateId, newVersionNumber } = validated.data
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Authentication required" }
    }

    // 2. Authorize owner/admin role
    const { data: membership, error: memberError } = await supabase
      .from("workspace_members")
      .select("id, role, status")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()

    if (memberError || !membership || !["owner", "admin"].includes(membership.role)) {
      return { success: false, error: "Unauthorized: Admin or owner privileges required to upgrade template" }
    }

    // 3. Execute transactional application RPC with the new version number
    const { data: rawResult, error: rpcError } = await supabase.rpc(
      "apply_template_to_workspace",
      {
        p_workspace_id: workspaceId,
        p_template_id: templateId,
        p_version_number: newVersionNumber,
      }
    )
    const result = rawResult as { version_number?: number } | null

    if (rpcError) {
      console.error("[upgradeTemplateAction] RPC Error:", rpcError)
      return { success: false, error: rpcError.message || "Failed to upgrade template" }
    }

    // 4. Revalidate cache
    const { data: ws } = await supabase
      .from("workspaces")
      .select("slug")
      .eq("id", workspaceId)
      .maybeSingle()

    if (ws?.slug) {
      revalidatePath(`/w/${ws.slug}`)
      revalidatePath(`/w/${ws.slug}/settings`)
      revalidatePath(`/w/${ws.slug}/templates`)
      revalidatePath(`/w/${ws.slug}/today`)
      revalidatePath(`/w/${ws.slug}/plan`)
    }

    return {
      success: true,
      data: {
        upgradedVersionNumber: result?.version_number ?? newVersionNumber,
      },
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred"
    console.error("[upgradeTemplateAction] Exception:", err)
    return { success: false, error: errorMsg }
  }
}

/**
 * Server action to apply a workspace-level curriculum override.
 * Preserves the canonical template while tailoring priority or inclusion for this workspace.
 */
export async function applyCurriculumOverrideAction(
  rawInput: CurriculumOverrideInput
): Promise<ActionResult> {
  try {
    const validated = curriculumOverrideSchema.safeParse(rawInput)
    if (!validated.success) {
      return { success: false, error: validated.error.issues?.[0]?.message || "Invalid input" }
    }

    const { workspaceId, entityType, entityId, overrideType, value } = validated.data
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Authentication required" }
    }

    // 2. Authorize active membership
    const { data: membership, error: memberError } = await supabase
      .from("workspace_members")
      .select("id, role, status")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()

    if (memberError || !membership) {
      return { success: false, error: "Unauthorized: Active workspace membership required" }
    }

    // 3. Upsert override
    const { error: upsertError } = await supabase
      .from("workspace_curriculum_overrides")
      .upsert(
        {
          workspace_id: workspaceId,
          entity_type: entityType,
          entity_id: entityId,
          override_type: overrideType,
          value: value as Record<string, string | number | boolean>,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "workspace_id,entity_type,entity_id,override_type",
        }
      )

    if (upsertError) {
      return { success: false, error: upsertError.message || "Failed to save override" }
    }

    // 4. Mark curriculum status as 'customized'
    await supabase
      .from("workspace_curricula")
      .update({ status: "customized", updated_at: new Date().toISOString() })
      .eq("workspace_id", workspaceId)

    // 5. Revalidate cache
    const { data: ws } = await supabase
      .from("workspaces")
      .select("slug")
      .eq("id", workspaceId)
      .maybeSingle()

    if (ws?.slug) {
      revalidatePath(`/w/${ws.slug}`)
      revalidatePath(`/w/${ws.slug}/settings`)
    }

    return { success: true }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred"
    return { success: false, error: errorMsg }
  }
}
