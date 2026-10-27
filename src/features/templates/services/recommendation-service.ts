/**
 * Deterministic Template Recommendation Engine
 * 
 * Rules:
 * - Deterministic, explainable ranking. No AI hallucination or black-box weights.
 * - Exact company + role -> Company + role family -> Role-specific -> General role family -> General SWE.
 * - Always provides a clear human-readable reason.
 */

import type {
  PreparationTemplate,
  TemplateVersion,
  TemplateRecommendation,
} from "../types/template.types"

export interface RecommendationTargetContext {
  companyId?: string | null
  companyName?: string | null
  roleId?: string | null
  roleName?: string | null
  roleFamily?: string | null
}

function normalizeStr(str: string): string {
  return str.toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim()
}

function normalizeSlug(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "")
}

export function rankTemplatesForTarget(
  templates: { template: PreparationTemplate; version: TemplateVersion }[],
  target: RecommendationTargetContext
): TemplateRecommendation[] {
  const recommendations: TemplateRecommendation[] = []

  const targetCompany = normalizeStr(target.companyName || target.companyId || "")
  const targetCompanySlug = normalizeSlug(target.companyName || target.companyId || "")
  const targetRole = normalizeStr(target.roleName || target.roleId || "")
  const targetRoleSlug = normalizeSlug(target.roleName || target.roleId || "")
  const targetFamily = normalizeStr(target.roleFamily || "")

  for (const { template, version } of templates) {
    let score = 0
    let reason = ""
    let companyMatch = false
    let roleMatch = false
    let roleFamilyMatch = false
    let isFallback = false

    const tmplCompany = normalizeStr(template.companyId || "")
    const tmplCompanySlug = normalizeSlug(template.companyId || "")
    const tmplRole = normalizeStr(template.roleId || "")
    const tmplRoleSlug = normalizeSlug(template.roleId || "")
    const tmplName = normalizeStr(template.name)
    const tmplSlug = normalizeSlug(template.slug)
    const tmplFamily = normalizeStr(template.roleFamilyId || "")

    // 1. Company Match Check
    if (
      targetCompany &&
      (tmplCompany === targetCompany ||
        (tmplCompanySlug && targetCompanySlug && (tmplCompanySlug === targetCompanySlug || tmplSlug.includes(targetCompanySlug))))
    ) {
      companyMatch = true
    }

    // 2. Role Match Check
    if (
      targetRole &&
      (tmplRole === targetRole ||
        (tmplRoleSlug && targetRoleSlug && (tmplRoleSlug === targetRoleSlug || tmplSlug.includes(targetRoleSlug) || tmplName.includes(targetRole))))
    ) {
      roleMatch = true
    }

    // 3. Role Family Check
    if (targetFamily && (tmplFamily === targetFamily || tmplFamily.includes(targetFamily))) {
      roleFamilyMatch = true
    }

    // Scoring Rules
    if (companyMatch && roleMatch) {
      score = 100
      reason = `Exact match for your target at ${target.companyName || 'your target company'} (${target.roleName || 'Software Engineer'}).`
    } else if (companyMatch) {
      score = 85
      reason = `Curated specifically for technical interview tracks at ${target.companyName || 'your target company'}.`
    } else if (roleMatch) {
      score = 75
      reason = `Directly aligned with core competencies and expectations for ${target.roleName || 'this role'}.`
    } else if (roleFamilyMatch) {
      score = 60
      reason = `Designed for ${target.roleFamily || 'Software Engineering'} roles with comprehensive track coverage.`
    } else if (template.slug === 'general-swe' || template.templateType === 'general') {
      score = 40
      reason = "Comprehensive foundational curriculum covering DSA, CS fundamentals, and interview execution."
      isFallback = true
    } else {
      score = 20
      reason = "Alternative curriculum that may suit adjacent technical roles."
    }

    recommendations.push({
      template,
      version,
      score,
      reason,
      isStrongMatch: score >= 75,
      matchFactors: {
        companyMatch,
        roleMatch,
        roleFamilyMatch,
        isFallback,
      },
    })
  }

  // Deterministic sorting: Score desc, then template name asc
  return recommendations.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score
    }
    return a.template.name.localeCompare(b.template.name)
  })
}
