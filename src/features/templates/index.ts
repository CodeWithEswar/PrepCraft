/**
 * PrepCraft Preparation Template & Curriculum Engine — Public API
 * Phase 08
 */

export * from "./types/template.types"
export * from "./schemas/template.schema"

export { rankTemplatesForTarget } from "./services/recommendation-service"
export type { RecommendationTargetContext } from "./services/recommendation-service"

export { resolveEffectiveCurriculum } from "./services/curriculum-resolver"
export type { ResolveCurriculumParams, WorkspaceOverrideRecord } from "./services/curriculum-resolver"

export { computeCurriculumDiff } from "./services/template-diff-service"
export type { VersionCurriculumSnapshot } from "./services/template-diff-service"

export { validateTemplateIntegrity, assertVersionIsMutable } from "./services/template-validation-service"
export type { ValidationResult } from "./services/template-validation-service"

export { templateQueryKeys } from "./services/template-query-keys"

// Components
export { PriorityBadge, TemplateTypeBadge, VersionBadge } from "./components/template-badge"
export { TemplateFit } from "./components/template-fit"
export { CurriculumLens } from "./components/template-lens"
export { TemplateDiff } from "./components/template-diff"
export { TemplateUpdateBanner } from "./components/template-update-banner"
export { ApplyTemplateDialog } from "./components/apply-template-dialog"
export { TemplateCard } from "./components/template-card"
export { TemplateDetailView } from "./components/template-detail"
export { TemplateBrowser } from "./components/template-browser"
export { CurrentTemplateCard } from "./components/current-template-card"
