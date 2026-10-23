/**
 * Global and shared application types for PrepCraft
 */

export type ThemeMode = "light" | "dark" | "system"

export interface BaseEntity {
  id: string
  created_at: string
  updated_at?: string
}
