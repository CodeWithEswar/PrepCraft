export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      attempt_outbox_events: {
        Row: {
          attempt_id: string
          created_at: string
          event_type: string
          id: string
          payload: Json
          policy_version: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          attempt_id: string
          created_at?: string
          event_type?: string
          id?: string
          payload: Json
          policy_version?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          attempt_id?: string
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          policy_version?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempt_outbox_events_attempt_id_workspace_id_user_id_fkey"
            columns: ["attempt_id", "workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "question_attempts"
            referencedColumns: ["id", "workspace_id", "user_id"]
          },
        ]
      }
      behavioral_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          request_hash: string
          request_id: string
          response: Json
          story_id: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          request_hash: string
          request_id: string
          response?: Json
          story_id?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          request_hash?: string
          request_id?: string
          response?: Json
          story_id?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "behavioral_events_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "star_stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavioral_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      behavioral_frameworks: {
        Row: {
          description: string
          id: string
          name: string
          source_reference: string | null
          source_type: string
          status: string
          user_id: string | null
          version: number
          workspace_id: string | null
        }
        Insert: {
          description?: string
          id: string
          name: string
          source_reference?: string | null
          source_type: string
          status?: string
          user_id?: string | null
          version: number
          workspace_id?: string | null
        }
        Update: {
          description?: string
          id?: string
          name?: string
          source_reference?: string | null
          source_type?: string
          status?: string
          user_id?: string | null
          version?: number
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "behavioral_frameworks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      behavioral_practice_bindings: {
        Row: {
          action_specificity: number | null
          clarity: number | null
          committed: boolean
          confidence: number | null
          cue_level: number
          item_id: string
          principle_ids: string[]
          prompt_id: string | null
          reflection: string
          request_hash: string | null
          result_specificity: number | null
          retold: boolean | null
          session_id: string
          story_id: string
          story_snapshot: Json
          story_version: number
          user_id: string
          workspace_id: string
        }
        Insert: {
          action_specificity?: number | null
          clarity?: number | null
          committed?: boolean
          confidence?: number | null
          cue_level?: number
          item_id: string
          principle_ids?: string[]
          prompt_id?: string | null
          reflection?: string
          request_hash?: string | null
          result_specificity?: number | null
          retold?: boolean | null
          session_id: string
          story_id: string
          story_snapshot: Json
          story_version: number
          user_id: string
          workspace_id: string
        }
        Update: {
          action_specificity?: number | null
          clarity?: number | null
          committed?: boolean
          confidence?: number | null
          cue_level?: number
          item_id?: string
          principle_ids?: string[]
          prompt_id?: string | null
          reflection?: string
          request_hash?: string | null
          result_specificity?: number | null
          retold?: boolean | null
          session_id?: string
          story_id?: string
          story_snapshot?: Json
          story_version?: number
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "behavioral_practice_bindings_item_id_session_id_workspace__fkey"
            columns: ["item_id", "session_id", "workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "execution_session_items"
            referencedColumns: ["id", "session_id", "workspace_id", "user_id"]
          },
          {
            foreignKeyName: "behavioral_practice_bindings_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "behavioral_prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavioral_practice_bindings_story_id_workspace_id_user_id_fkey"
            columns: ["story_id", "workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "star_stories"
            referencedColumns: ["id", "workspace_id", "user_id"]
          },
        ]
      }
      behavioral_principles: {
        Row: {
          common_mistake: string
          description: string
          framework_id: string
          framework_version: number
          guidance: string
          id: string
          name: string
          priority: string
          sort_order: number
        }
        Insert: {
          common_mistake: string
          description: string
          framework_id: string
          framework_version: number
          guidance: string
          id: string
          name: string
          priority?: string
          sort_order: number
        }
        Update: {
          common_mistake?: string
          description?: string
          framework_id?: string
          framework_version?: number
          guidance?: string
          id?: string
          name?: string
          priority?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "behavioral_principles_framework_id_framework_version_fkey"
            columns: ["framework_id", "framework_version"]
            isOneToOne: false
            referencedRelation: "behavioral_frameworks"
            referencedColumns: ["id", "version"]
          },
        ]
      }
      behavioral_prompt_principles: {
        Row: {
          principle_id: string
          prompt_id: string
        }
        Insert: {
          principle_id: string
          prompt_id: string
        }
        Update: {
          principle_id?: string
          prompt_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "behavioral_prompt_principles_principle_id_fkey"
            columns: ["principle_id"]
            isOneToOne: false
            referencedRelation: "behavioral_principles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavioral_prompt_principles_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "behavioral_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      behavioral_prompts: {
        Row: {
          category: string
          difficulty: string
          follow_ups: Json
          framework_id: string
          framework_version: number
          id: string
          prompt: string
          status: string
          version: number
        }
        Insert: {
          category: string
          difficulty?: string
          follow_ups?: Json
          framework_id: string
          framework_version: number
          id: string
          prompt: string
          status?: string
          version?: number
        }
        Update: {
          category?: string
          difficulty?: string
          follow_ups?: Json
          framework_id?: string
          framework_version?: number
          id?: string
          prompt?: string
          status?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "behavioral_prompts_framework_id_framework_version_fkey"
            columns: ["framework_id", "framework_version"]
            isOneToOne: false
            referencedRelation: "behavioral_frameworks"
            referencedColumns: ["id", "version"]
          },
        ]
      }
      companies: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          slug: string
          tier: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          slug: string
          tier?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
          tier?: string
        }
        Relationships: []
      }
      daily_plans: {
        Row: {
          context_version: string
          created_at: string
          id: string
          lifecycle: string
          plan_date: string
          planned_minutes: number
          policy_version: string
          status: string
          timezone: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          context_version: string
          created_at?: string
          id?: string
          lifecycle?: string
          plan_date: string
          planned_minutes?: number
          policy_version?: string
          status?: string
          timezone: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          context_version?: string
          created_at?: string
          id?: string
          lifecycle?: string
          plan_date?: string
          planned_minutes?: number
          policy_version?: string
          status?: string
          timezone?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_plans_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_tasks: {
        Row: {
          carryover_count: number
          carryover_from_task_id: string | null
          completed_at: string | null
          created_at: string
          daily_plan_id: string
          due_at: string | null
          estimated_minutes: number
          generation_key: string | null
          id: string
          notes: string
          required: boolean
          scheduled_end: string | null
          scheduled_start: string | null
          sort_order: number
          source_id: string | null
          source_type: string
          started_at: string | null
          status: string
          target_count: number | null
          target_unit: string | null
          task_type: string
          title: string
          topic_id: string | null
          track_id: string | null
          updated_at: string
          version: number
          workspace_id: string
        }
        Insert: {
          carryover_count?: number
          carryover_from_task_id?: string | null
          completed_at?: string | null
          created_at?: string
          daily_plan_id: string
          due_at?: string | null
          estimated_minutes: number
          generation_key?: string | null
          id?: string
          notes?: string
          required?: boolean
          scheduled_end?: string | null
          scheduled_start?: string | null
          sort_order?: number
          source_id?: string | null
          source_type: string
          started_at?: string | null
          status?: string
          target_count?: number | null
          target_unit?: string | null
          task_type: string
          title: string
          topic_id?: string | null
          track_id?: string | null
          updated_at?: string
          version?: number
          workspace_id: string
        }
        Update: {
          carryover_count?: number
          carryover_from_task_id?: string | null
          completed_at?: string | null
          created_at?: string
          daily_plan_id?: string
          due_at?: string | null
          estimated_minutes?: number
          generation_key?: string | null
          id?: string
          notes?: string
          required?: boolean
          scheduled_end?: string | null
          scheduled_start?: string | null
          sort_order?: number
          source_id?: string | null
          source_type?: string
          started_at?: string | null
          status?: string
          target_count?: number | null
          target_unit?: string | null
          task_type?: string
          title?: string
          topic_id?: string | null
          track_id?: string | null
          updated_at?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_tasks_daily_plan_id_workspace_id_fkey"
            columns: ["daily_plan_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "daily_plans"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "daily_tasks_lineage_workspace_fk"
            columns: ["carryover_from_task_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "daily_tasks"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "daily_tasks_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_tasks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_events: {
        Row: {
          created_at: string
          elapsed_ms: number
          event_type: string
          hint_level: number | null
          id: string
          item_id: string | null
          phase: string | null
          request_hash: string
          request_id: string
          session_id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          elapsed_ms?: number
          event_type: string
          hint_level?: number | null
          id?: string
          item_id?: string | null
          phase?: string | null
          request_hash: string
          request_id: string
          session_id: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          elapsed_ms?: number
          event_type?: string
          hint_level?: number | null
          id?: string
          item_id?: string | null
          phase?: string | null
          request_hash?: string
          request_id?: string
          session_id?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "execution_events_item_scope"
            columns: ["item_id", "session_id", "workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "execution_session_items"
            referencedColumns: ["id", "session_id", "workspace_id", "user_id"]
          },
          {
            foreignKeyName: "execution_events_session_id_workspace_id_user_id_fkey"
            columns: ["session_id", "workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "execution_sessions"
            referencedColumns: ["id", "workspace_id", "user_id"]
          },
        ]
      }
      execution_focus_intervals: {
        Row: {
          ended_at: string | null
          id: string
          item_id: string
          session_id: string
          started_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          ended_at?: string | null
          id?: string
          item_id: string
          session_id: string
          started_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          ended_at?: string | null
          id?: string
          item_id?: string
          session_id?: string
          started_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "execution_focus_intervals_item_id_session_id_workspace_id__fkey"
            columns: ["item_id", "session_id", "workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "execution_session_items"
            referencedColumns: ["id", "session_id", "workspace_id", "user_id"]
          },
        ]
      }
      execution_hint_uses: {
        Row: {
          elapsed_ms: number
          id: string
          item_id: string
          level: number
          revealed_at: string
          session_id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          elapsed_ms: number
          id?: string
          item_id: string
          level: number
          revealed_at?: string
          session_id: string
          user_id: string
          workspace_id: string
        }
        Update: {
          elapsed_ms?: number
          id?: string
          item_id?: string
          level?: number
          revealed_at?: string
          session_id?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "execution_hint_uses_item_id_level_fkey"
            columns: ["item_id", "level"]
            isOneToOne: true
            referencedRelation: "execution_item_hints"
            referencedColumns: ["item_id", "level"]
          },
          {
            foreignKeyName: "execution_hint_uses_item_id_session_id_workspace_id_user_i_fkey"
            columns: ["item_id", "session_id", "workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "execution_session_items"
            referencedColumns: ["id", "session_id", "workspace_id", "user_id"]
          },
        ]
      }
      execution_item_hints: {
        Row: {
          body: string
          item_id: string
          level: number
          session_id: string
          title: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          body: string
          item_id: string
          level: number
          session_id: string
          title: string
          user_id: string
          workspace_id: string
        }
        Update: {
          body?: string
          item_id?: string
          level?: number
          session_id?: string
          title?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "execution_item_hints_item_id_session_id_workspace_id_user__fkey"
            columns: ["item_id", "session_id", "workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "execution_session_items"
            referencedColumns: ["id", "session_id", "workspace_id", "user_id"]
          },
        ]
      }
      execution_session_items: {
        Row: {
          answer: string
          answered_at: string | null
          body: string
          code: string
          constraints_text: string
          difficulty: string
          examples: Json
          first_viewed_at: string | null
          flagged: boolean
          hints_available: number
          id: string
          language: string
          last_viewed_at: string | null
          position: number
          scratchpad: string
          session_id: string
          status: string
          title: string
          topic: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          answer?: string
          answered_at?: string | null
          body?: string
          code?: string
          constraints_text?: string
          difficulty?: string
          examples?: Json
          first_viewed_at?: string | null
          flagged?: boolean
          hints_available?: number
          id?: string
          language?: string
          last_viewed_at?: string | null
          position: number
          scratchpad?: string
          session_id: string
          status?: string
          title: string
          topic?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          answer?: string
          answered_at?: string | null
          body?: string
          code?: string
          constraints_text?: string
          difficulty?: string
          examples?: Json
          first_viewed_at?: string | null
          flagged?: boolean
          hints_available?: number
          id?: string
          language?: string
          last_viewed_at?: string | null
          position?: number
          scratchpad?: string
          session_id?: string
          status?: string
          title?: string
          topic?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "execution_session_items_session_id_workspace_id_user_id_fkey"
            columns: ["session_id", "workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "execution_sessions"
            referencedColumns: ["id", "workspace_id", "user_id"]
          },
        ]
      }
      execution_sessions: {
        Row: {
          accumulated_pause_ms: number
          checklist: string[]
          completed_at: string | null
          completion_reason: string | null
          created_at: string
          current_item_id: string | null
          expires_at: string | null
          id: string
          launch_hash: string
          launch_request_id: string
          mode: string
          pause_count: number
          paused_at: string | null
          phase: string
          policy_version: string
          source_type: string
          started_at: string
          status: string
          target_duration_seconds: number | null
          task_id: string | null
          task_type: string
          updated_at: string
          user_id: string
          version: number
          workspace_id: string
        }
        Insert: {
          accumulated_pause_ms?: number
          checklist?: string[]
          completed_at?: string | null
          completion_reason?: string | null
          created_at?: string
          current_item_id?: string | null
          expires_at?: string | null
          id?: string
          launch_hash: string
          launch_request_id: string
          mode: string
          pause_count?: number
          paused_at?: string | null
          phase?: string
          policy_version?: string
          source_type: string
          started_at?: string
          status?: string
          target_duration_seconds?: number | null
          task_id?: string | null
          task_type?: string
          updated_at?: string
          user_id: string
          version?: number
          workspace_id: string
        }
        Update: {
          accumulated_pause_ms?: number
          checklist?: string[]
          completed_at?: string | null
          completion_reason?: string | null
          created_at?: string
          current_item_id?: string | null
          expires_at?: string | null
          id?: string
          launch_hash?: string
          launch_request_id?: string
          mode?: string
          pause_count?: number
          paused_at?: string | null
          phase?: string
          policy_version?: string
          source_type?: string
          started_at?: string
          status?: string
          target_duration_seconds?: number | null
          task_id?: string | null
          task_type?: string
          updated_at?: string
          user_id?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "execution_current_item_owned"
            columns: ["current_item_id", "id", "workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "execution_session_items"
            referencedColumns: ["id", "session_id", "workspace_id", "user_id"]
          },
          {
            foreignKeyName: "execution_sessions_task_id_workspace_id_fkey"
            columns: ["task_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "daily_tasks"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "execution_sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_topic_attributions: {
        Row: {
          created_at: string
          item_id: string
          session_id: string
          topic_id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          item_id: string
          session_id: string
          topic_id: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          item_id?: string
          session_id?: string
          topic_id?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "execution_topic_attributions_item_id_session_id_workspace__fkey"
            columns: ["item_id", "session_id", "workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "execution_session_items"
            referencedColumns: ["id", "session_id", "workspace_id", "user_id"]
          },
          {
            foreignKeyName: "execution_topic_attributions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          bucket: string
          category: string
          checksum: string
          created_at: string
          deleted_at: string | null
          display_name: string
          environment: string
          etag: string | null
          failure_code: string | null
          id: string
          last_checked_at: string
          mime_type: string
          object_key: string
          original_filename: string
          owner_user_id: string
          size_bytes: number
          status: string
          updated_at: string
          version: number
          workspace_id: string
        }
        Insert: {
          bucket: string
          category: string
          checksum: string
          created_at?: string
          deleted_at?: string | null
          display_name: string
          environment: string
          etag?: string | null
          failure_code?: string | null
          id?: string
          last_checked_at?: string
          mime_type: string
          object_key: string
          original_filename: string
          owner_user_id: string
          size_bytes: number
          status?: string
          updated_at?: string
          version?: number
          workspace_id: string
        }
        Update: {
          bucket?: string
          category?: string
          checksum?: string
          created_at?: string
          deleted_at?: string | null
          display_name?: string
          environment?: string
          etag?: string | null
          failure_code?: string | null
          id?: string
          last_checked_at?: string
          mime_type?: string
          object_key?: string
          original_filename?: string
          owner_user_id?: string
          size_bytes?: number
          status?: string
          updated_at?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_activities: {
        Row: {
          activity_type: string
          concept_id: string
          concept_version: number
          difficulty: string
          estimated_seconds: number | null
          id: string
          options: Json
          prompt: string
          status: string
          title: string
          version: number
        }
        Insert: {
          activity_type: string
          concept_id: string
          concept_version: number
          difficulty: string
          estimated_seconds?: number | null
          id: string
          options?: Json
          prompt: string
          status: string
          title: string
          version: number
        }
        Update: {
          activity_type?: string
          concept_id?: string
          concept_version?: number
          difficulty?: string
          estimated_seconds?: number | null
          id?: string
          options?: Json
          prompt?: string
          status?: string
          title?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "learning_activities_concept_id_concept_version_fkey"
            columns: ["concept_id", "concept_version"]
            isOneToOne: false
            referencedRelation: "learning_concepts"
            referencedColumns: ["id", "version"]
          },
        ]
      }
      learning_concept_relations: {
        Row: {
          from_id: string
          from_version: number
          relation_type: string
          to_id: string
          to_version: number
        }
        Insert: {
          from_id: string
          from_version: number
          relation_type: string
          to_id: string
          to_version: number
        }
        Update: {
          from_id?: string
          from_version?: number
          relation_type?: string
          to_id?: string
          to_version?: number
        }
        Relationships: [
          {
            foreignKeyName: "learning_concept_relations_from_id_from_version_fkey"
            columns: ["from_id", "from_version"]
            isOneToOne: false
            referencedRelation: "learning_concepts"
            referencedColumns: ["id", "version"]
          },
          {
            foreignKeyName: "learning_concept_relations_to_id_to_version_fkey"
            columns: ["to_id", "to_version"]
            isOneToOne: false
            referencedRelation: "learning_concepts"
            referencedColumns: ["id", "version"]
          },
        ]
      }
      learning_concepts: {
        Row: {
          author: string
          diagram: string | null
          id: string
          interview_answer: string
          interview_prompt: string
          language_version: string | null
          mental_model: string
          misconception: string
          name: string
          reviewed_at: string | null
          reviewer: string
          sort_order: number
          source_reference: string
          source_type: string
          status: string
          summary: string
          topic_id: string
          version: number
          worked_example: string
        }
        Insert: {
          author: string
          diagram?: string | null
          id: string
          interview_answer?: string
          interview_prompt?: string
          language_version?: string | null
          mental_model?: string
          misconception?: string
          name: string
          reviewed_at?: string | null
          reviewer: string
          sort_order: number
          source_reference: string
          source_type?: string
          status: string
          summary?: string
          topic_id: string
          version: number
          worked_example?: string
        }
        Update: {
          author?: string
          diagram?: string | null
          id?: string
          interview_answer?: string
          interview_prompt?: string
          language_version?: string | null
          mental_model?: string
          misconception?: string
          name?: string
          reviewed_at?: string | null
          reviewer?: string
          sort_order?: number
          source_reference?: string
          source_type?: string
          status?: string
          summary?: string
          topic_id?: string
          version?: number
          worked_example?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_concepts_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_execution_bindings: {
        Row: {
          activity_id: string
          activity_version: number
          answer: Json | null
          confidence: number | null
          correct: boolean | null
          item_id: string
          session_id: string
          submit_hash: string | null
          submitted_at: string | null
          timed_out: boolean
          user_id: string
          workspace_id: string
        }
        Insert: {
          activity_id: string
          activity_version: number
          answer?: Json | null
          confidence?: number | null
          correct?: boolean | null
          item_id: string
          session_id: string
          submit_hash?: string | null
          submitted_at?: string | null
          timed_out?: boolean
          user_id: string
          workspace_id: string
        }
        Update: {
          activity_id?: string
          activity_version?: number
          answer?: Json | null
          confidence?: number | null
          correct?: boolean | null
          item_id?: string
          session_id?: string
          submit_hash?: string | null
          submitted_at?: string | null
          timed_out?: boolean
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_execution_bindings_activity_id_activity_version_fkey"
            columns: ["activity_id", "activity_version"]
            isOneToOne: false
            referencedRelation: "learning_activities"
            referencedColumns: ["id", "version"]
          },
          {
            foreignKeyName: "learning_execution_bindings_item_id_session_id_workspace_i_fkey"
            columns: ["item_id", "session_id", "workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "execution_session_items"
            referencedColumns: ["id", "session_id", "workspace_id", "user_id"]
          },
        ]
      }
      learning_subjects: {
        Row: {
          icon: string
          id: string
          name: string
          sort_order: number
          tagline: string
          track_id: string
        }
        Insert: {
          icon: string
          id: string
          name: string
          sort_order: number
          tagline: string
          track_id: string
        }
        Update: {
          icon?: string
          id?: string
          name?: string
          sort_order?: number
          tagline?: string
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_subjects_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_topic_catalog: {
        Row: {
          sort_order: number
          subject_id: string
          topic_id: string
        }
        Insert: {
          sort_order: number
          subject_id: string
          topic_id: string
        }
        Update: {
          sort_order?: number
          subject_id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_topic_catalog_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "learning_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_topic_catalog_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: true
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_blueprints: {
        Row: {
          created_at: string
          description: string
          difficulty: string
          duration_minutes: number
          id: string
          mode: string
          name: string
          policy_snapshot: Json
          sections_config: Json
          source_type: string
          status: string
          user_id: string | null
          version: number
          why_recommended: Json
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string
          difficulty?: string
          duration_minutes: number
          id: string
          mode: string
          name: string
          policy_snapshot?: Json
          sections_config?: Json
          source_type: string
          status?: string
          user_id?: string | null
          version?: number
          why_recommended?: Json
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          difficulty?: string
          duration_minutes?: number
          id?: string
          mode?: string
          name?: string
          policy_snapshot?: Json
          sections_config?: Json
          source_type?: string
          status?: string
          user_id?: string | null
          version?: number
          why_recommended?: Json
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mock_blueprints_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_reviews: {
        Row: {
          created_at: string
          evaluation_policy_version: string
          id: string
          mock_session_id: string
          review_snapshot: Json
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          evaluation_policy_version?: string
          id?: string
          mock_session_id: string
          review_snapshot: Json
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          evaluation_policy_version?: string
          id?: string
          mock_session_id?: string
          review_snapshot?: Json
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mock_reviews_mock_session_id_workspace_id_user_id_fkey"
            columns: ["mock_session_id", "workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "mock_sessions"
            referencedColumns: ["id", "workspace_id", "user_id"]
          },
          {
            foreignKeyName: "mock_reviews_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_session_events: {
        Row: {
          event_at: string
          event_type: string
          id: string
          item_id: string | null
          mock_session_id: string
          safe_metadata: Json
          section_id: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          event_at?: string
          event_type: string
          id?: string
          item_id?: string | null
          mock_session_id: string
          safe_metadata?: Json
          section_id?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          event_at?: string
          event_type?: string
          id?: string
          item_id?: string | null
          mock_session_id?: string
          safe_metadata?: Json
          section_id?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mock_session_events_mock_session_id_workspace_id_user_id_fkey"
            columns: ["mock_session_id", "workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "mock_sessions"
            referencedColumns: ["id", "workspace_id", "user_id"]
          },
          {
            foreignKeyName: "mock_session_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_session_items: {
        Row: {
          completed_at: string | null
          difficulty_snapshot: string
          execution_item_id: string | null
          first_viewed_at: string | null
          flagged_at: string | null
          id: string
          mock_session_id: string
          section_id: string
          sort_order: number
          source_id: string
          source_type: string
          status: string
          target_duration_seconds: number | null
          title: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          difficulty_snapshot?: string
          execution_item_id?: string | null
          first_viewed_at?: string | null
          flagged_at?: string | null
          id?: string
          mock_session_id: string
          section_id: string
          sort_order: number
          source_id: string
          source_type: string
          status?: string
          target_duration_seconds?: number | null
          title: string
          user_id: string
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          difficulty_snapshot?: string
          execution_item_id?: string | null
          first_viewed_at?: string | null
          flagged_at?: string | null
          id?: string
          mock_session_id?: string
          section_id?: string
          sort_order?: number
          source_id?: string
          source_type?: string
          status?: string
          target_duration_seconds?: number | null
          title?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mock_session_items_execution_item_id_fkey"
            columns: ["execution_item_id"]
            isOneToOne: false
            referencedRelation: "execution_session_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_session_items_mock_session_id_workspace_id_user_id_fkey"
            columns: ["mock_session_id", "workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "mock_sessions"
            referencedColumns: ["id", "workspace_id", "user_id"]
          },
          {
            foreignKeyName: "mock_session_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "mock_session_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_session_sections: {
        Row: {
          id: string
          mock_session_id: string
          policy_snapshot: Json
          section_type: string
          sort_order: number
          target_duration_seconds: number | null
          title: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          id?: string
          mock_session_id: string
          policy_snapshot?: Json
          section_type: string
          sort_order: number
          target_duration_seconds?: number | null
          title: string
          user_id: string
          workspace_id: string
        }
        Update: {
          id?: string
          mock_session_id?: string
          policy_snapshot?: Json
          section_type?: string
          sort_order?: number
          target_duration_seconds?: number | null
          title?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mock_session_sections_mock_session_id_workspace_id_user_id_fkey"
            columns: ["mock_session_id", "workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "mock_sessions"
            referencedColumns: ["id", "workspace_id", "user_id"]
          },
        ]
      }
      mock_sessions: {
        Row: {
          blueprint_id: string | null
          blueprint_version: number
          completed_at: string | null
          created_at: string
          evaluation_policy_version: string
          execution_session_id: string
          expires_at: string | null
          id: string
          mode: string
          policy_snapshot: Json
          selection_policy_version: string
          started_at: string
          status: string
          submitted_at: string | null
          target_company_id: string | null
          target_role_id: string | null
          title: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          blueprint_id?: string | null
          blueprint_version?: number
          completed_at?: string | null
          created_at?: string
          evaluation_policy_version?: string
          execution_session_id: string
          expires_at?: string | null
          id?: string
          mode: string
          policy_snapshot?: Json
          selection_policy_version?: string
          started_at?: string
          status?: string
          submitted_at?: string | null
          target_company_id?: string | null
          target_role_id?: string | null
          title: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          blueprint_id?: string | null
          blueprint_version?: number
          completed_at?: string | null
          created_at?: string
          evaluation_policy_version?: string
          execution_session_id?: string
          expires_at?: string | null
          id?: string
          mode?: string
          policy_snapshot?: Json
          selection_policy_version?: string
          started_at?: string
          status?: string
          submitted_at?: string | null
          target_company_id?: string | null
          target_role_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mock_sessions_execution_session_id_workspace_id_user_id_fkey"
            columns: ["execution_session_id", "workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "execution_sessions"
            referencedColumns: ["id", "workspace_id", "user_id"]
          },
          {
            foreignKeyName: "mock_sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_actions: {
        Row: {
          created_at: string
          event_type: string
          id: number
          notification_id: string | null
          reminder_id: string | null
          request_hash: string
          request_id: string
          response: Json
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: never
          notification_id?: string | null
          reminder_id?: string | null
          request_hash: string
          request_id: string
          response?: Json
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: never
          notification_id?: string | null
          reminder_id?: string | null
          request_hash?: string
          request_id?: string
          response?: Json
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_actions_notification_id_workspace_id_user_id_fkey"
            columns: ["notification_id", "workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id", "workspace_id", "user_id"]
          },
          {
            foreignKeyName: "notification_actions_reminder_id_workspace_id_user_id_fkey"
            columns: ["reminder_id", "workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "reminders"
            referencedColumns: ["id", "workspace_id", "user_id"]
          },
          {
            foreignKeyName: "notification_actions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_deliveries: {
        Row: {
          attempt_count: number
          channel: string
          created_at: string
          delivered_at: string | null
          failed_at: string | null
          failure_code: string | null
          first_attempt_at: string | null
          id: string
          idempotency_key: string
          last_attempt_at: string | null
          lease_token: string | null
          lease_until: string | null
          notification_id: string
          provider: string
          provider_message_id: string | null
          provider_status: string | null
          render_snapshot: Json | null
          scheduled_for: string
          status: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          attempt_count?: number
          channel: string
          created_at?: string
          delivered_at?: string | null
          failed_at?: string | null
          failure_code?: string | null
          first_attempt_at?: string | null
          id?: string
          idempotency_key: string
          last_attempt_at?: string | null
          lease_token?: string | null
          lease_until?: string | null
          notification_id: string
          provider: string
          provider_message_id?: string | null
          provider_status?: string | null
          render_snapshot?: Json | null
          scheduled_for: string
          status?: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          attempt_count?: number
          channel?: string
          created_at?: string
          delivered_at?: string | null
          failed_at?: string | null
          failure_code?: string | null
          first_attempt_at?: string | null
          id?: string
          idempotency_key?: string
          last_attempt_at?: string | null
          lease_token?: string | null
          lease_until?: string | null
          notification_id?: string
          provider?: string
          provider_message_id?: string | null
          provider_status?: string | null
          render_snapshot?: Json | null
          scheduled_for?: string
          status?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_notification_id_workspace_id_user__fkey"
            columns: ["notification_id", "workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id", "workspace_id", "user_id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_enabled: boolean
          event_family: string
          id: string
          in_app_enabled: boolean
          push_enabled: boolean
          push_privacy: string
          quiet_enabled: boolean
          quiet_end: string
          quiet_start: string
          timezone: string
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean
          event_family: string
          id?: string
          in_app_enabled?: boolean
          push_enabled?: boolean
          push_privacy?: string
          quiet_enabled?: boolean
          quiet_end?: string
          quiet_start?: string
          timezone?: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          email_enabled?: boolean
          event_family?: string
          id?: string
          in_app_enabled?: boolean
          push_enabled?: boolean
          push_privacy?: string
          quiet_enabled?: boolean
          quiet_end?: string
          quiet_start?: string
          timezone?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_type: string
          archived_at: string | null
          available_at: string
          body: string
          category: string
          context: Json
          created_at: string
          dedupe_key: string
          event_type: string
          expires_at: string | null
          id: string
          priority: string
          read_at: string | null
          reason: string
          reminder_id: string | null
          report_id: string | null
          resolution_code: string | null
          resolved_at: string | null
          saved_at: string | null
          scheduled_for: string
          snoozed_until: string | null
          source_checked_at: string
          source_id: string | null
          source_type: string
          state: string
          template_version: string
          title: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          action_type: string
          archived_at?: string | null
          available_at: string
          body?: string
          category: string
          context?: Json
          created_at?: string
          dedupe_key: string
          event_type: string
          expires_at?: string | null
          id?: string
          priority?: string
          read_at?: string | null
          reason: string
          reminder_id?: string | null
          report_id?: string | null
          resolution_code?: string | null
          resolved_at?: string | null
          saved_at?: string | null
          scheduled_for: string
          snoozed_until?: string | null
          source_checked_at?: string
          source_id?: string | null
          source_type: string
          state?: string
          template_version?: string
          title: string
          user_id: string
          workspace_id: string
        }
        Update: {
          action_type?: string
          archived_at?: string | null
          available_at?: string
          body?: string
          category?: string
          context?: Json
          created_at?: string
          dedupe_key?: string
          event_type?: string
          expires_at?: string | null
          id?: string
          priority?: string
          read_at?: string | null
          reason?: string
          reminder_id?: string | null
          report_id?: string | null
          resolution_code?: string | null
          resolved_at?: string | null
          saved_at?: string | null
          scheduled_for?: string
          snoozed_until?: string | null
          source_checked_at?: string
          source_id?: string | null
          source_type?: string
          state?: string
          template_version?: string
          title?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "reminders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_report_id_workspace_id_user_id_fkey"
            columns: ["report_id", "workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "weekly_reports"
            referencedColumns: ["id", "workspace_id", "user_id"]
          },
          {
            foreignKeyName: "notifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_drafts: {
        Row: {
          created_at: string
          custom_company_name: string | null
          default_daily_minutes: number | null
          has_target_date: boolean
          preferred_coding_language: string | null
          selected_template_id: string | null
          study_days: string[] | null
          target_company_id: string | null
          target_company_name: string | null
          target_date: string | null
          target_role_family: string | null
          target_role_name: string | null
          updated_at: string
          user_id: string
          weekly_target_minutes: number | null
          workspace_name: string | null
        }
        Insert: {
          created_at?: string
          custom_company_name?: string | null
          default_daily_minutes?: number | null
          has_target_date?: boolean
          preferred_coding_language?: string | null
          selected_template_id?: string | null
          study_days?: string[] | null
          target_company_id?: string | null
          target_company_name?: string | null
          target_date?: string | null
          target_role_family?: string | null
          target_role_name?: string | null
          updated_at?: string
          user_id: string
          weekly_target_minutes?: number | null
          workspace_name?: string | null
        }
        Update: {
          created_at?: string
          custom_company_name?: string | null
          default_daily_minutes?: number | null
          has_target_date?: boolean
          preferred_coding_language?: string | null
          selected_template_id?: string | null
          study_days?: string[] | null
          target_company_id?: string | null
          target_company_name?: string | null
          target_date?: string | null
          target_role_family?: string | null
          target_role_name?: string | null
          updated_at?: string
          user_id?: string
          weekly_target_minutes?: number | null
          workspace_name?: string | null
        }
        Relationships: []
      }
      patterns: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          typical_difficulty: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: string
          is_active?: boolean
          name: string
          slug: string
          typical_difficulty?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          typical_difficulty?: string
          updated_at?: string
        }
        Relationships: []
      }
      planning_activity_events: {
        Row: {
          actor_id: string
          changes: Json
          created_at: string
          event_type: string
          id: string
          policy_version: string
          request_hash: string
          request_id: string
          week_start: string
          workspace_id: string
        }
        Insert: {
          actor_id: string
          changes?: Json
          created_at?: string
          event_type: string
          id?: string
          policy_version?: string
          request_hash: string
          request_id: string
          week_start: string
          workspace_id: string
        }
        Update: {
          actor_id?: string
          changes?: Json
          created_at?: string
          event_type?: string
          id?: string
          policy_version?: string
          request_hash?: string
          request_id?: string
          week_start?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_activity_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_availability: {
        Row: {
          end_time: string | null
          minutes: number
          rest: boolean
          start_time: string | null
          weekday: number
          workspace_id: string
        }
        Insert: {
          end_time?: string | null
          minutes: number
          rest?: boolean
          start_time?: string | null
          weekday: number
          workspace_id: string
        }
        Update: {
          end_time?: string | null
          minutes?: number
          rest?: boolean
          start_time?: string | null
          weekday?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_availability_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_availability_overrides: {
        Row: {
          end_time: string | null
          minutes: number
          plan_date: string
          rest: boolean
          start_time: string | null
          workspace_id: string
        }
        Insert: {
          end_time?: string | null
          minutes: number
          plan_date: string
          rest?: boolean
          start_time?: string | null
          workspace_id: string
        }
        Update: {
          end_time?: string | null
          minutes?: number
          plan_date?: string
          rest?: boolean
          start_time?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_availability_overrides_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_state: {
        Row: {
          revision: number
          workspace_id: string
        }
        Insert: {
          revision?: number
          workspace_id: string
        }
        Update: {
          revision?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_state_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_audit: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json
          request_id: string
          target_id: string | null
          workspace_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          request_id: string
          target_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          request_id?: string
          target_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_audit_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      preparation_template_versions: {
        Row: {
          change_summary: string | null
          created_at: string
          deprecated_at: string | null
          id: string
          published_at: string | null
          reviewed_at: string | null
          status: string
          template_id: string
          updated_at: string
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          created_at?: string
          deprecated_at?: string | null
          id?: string
          published_at?: string | null
          reviewed_at?: string | null
          status?: string
          template_id: string
          updated_at?: string
          version_number: number
        }
        Update: {
          change_summary?: string | null
          created_at?: string
          deprecated_at?: string | null
          id?: string
          published_at?: string | null
          reviewed_at?: string | null
          status?: string
          template_id?: string
          updated_at?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "preparation_template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "preparation_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      preparation_templates: {
        Row: {
          company_id: string | null
          created_at: string
          current_published_version_id: string | null
          description: string
          focus_areas: string[]
          id: string
          last_reviewed_at: string
          name: string
          role_family: string
          role_id: string | null
          short_name: string | null
          slug: string
          status: string
          target_company: string | null
          template_type: string
          tracks: Json
          updated_at: string
          version: number
          visibility: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          current_published_version_id?: string | null
          description: string
          focus_areas?: string[]
          id: string
          last_reviewed_at?: string
          name: string
          role_family: string
          role_id?: string | null
          short_name?: string | null
          slug: string
          status?: string
          target_company?: string | null
          template_type?: string
          tracks?: Json
          updated_at?: string
          version?: number
          visibility?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          current_published_version_id?: string | null
          description?: string
          focus_areas?: string[]
          id?: string
          last_reviewed_at?: string
          name?: string
          role_family?: string
          role_id?: string | null
          short_name?: string | null
          slug?: string
          status?: string
          target_company?: string | null
          template_type?: string
          tracks?: Json
          updated_at?: string
          version?: number
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_prep_templates_current_version"
            columns: ["current_published_version_id"]
            isOneToOne: false
            referencedRelation: "preparation_template_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preparation_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preparation_templates_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          college_name: string | null
          created_at: string
          display_name: string | null
          graduation_year: number | null
          id: string
          last_active_workspace_id: string | null
          onboarding_completed_at: string | null
          onboarding_state: string
          preferred_coding_language: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          college_name?: string | null
          created_at?: string
          display_name?: string | null
          graduation_year?: number | null
          id: string
          last_active_workspace_id?: string | null
          onboarding_completed_at?: string | null
          onboarding_state?: string
          preferred_coding_language?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          college_name?: string | null
          created_at?: string
          display_name?: string | null
          graduation_year?: number | null
          id?: string
          last_active_workspace_id?: string | null
          onboarding_completed_at?: string | null
          onboarding_state?: string
          preferred_coding_language?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_last_active_workspace"
            columns: ["last_active_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          created_at: string
          device_name: string
          endpoint_hash: string
          id: string
          last_used_at: string | null
          provider: string
          revoked_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_name: string
          endpoint_hash: string
          id?: string
          last_used_at?: string | null
          provider: string
          revoked_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_name?: string
          endpoint_hash?: string
          id?: string
          last_used_at?: string | null
          provider?: string
          revoked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      question_attempts: {
        Row: {
          approach: string
          completed_at: string | null
          confidence: number | null
          created_at: string
          duration_ms: number
          id: string
          item_id: string
          mistakes: string[]
          notes: string
          pattern_id: string | null
          reflection_status: string
          result: string | null
          session_id: string
          space_complexity: string
          target_duration_ms: number | null
          time_complexity: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          approach?: string
          completed_at?: string | null
          confidence?: number | null
          created_at?: string
          duration_ms: number
          id?: string
          item_id: string
          mistakes?: string[]
          notes?: string
          pattern_id?: string | null
          reflection_status?: string
          result?: string | null
          session_id: string
          space_complexity?: string
          target_duration_ms?: number | null
          time_complexity?: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          approach?: string
          completed_at?: string | null
          confidence?: number | null
          created_at?: string
          duration_ms?: number
          id?: string
          item_id?: string
          mistakes?: string[]
          notes?: string
          pattern_id?: string | null
          reflection_status?: string
          result?: string | null
          session_id?: string
          space_complexity?: string
          target_duration_ms?: number | null
          time_complexity?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_attempts_item_id_session_id_workspace_id_user_id_fkey"
            columns: ["item_id", "session_id", "workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "execution_session_items"
            referencedColumns: ["id", "session_id", "workspace_id", "user_id"]
          },
          {
            foreignKeyName: "question_attempts_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "patterns"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_occurrences: {
        Row: {
          created_at: string
          id: string
          notification_id: string | null
          occurrence_key: string
          processed_at: string
          reason_code: string | null
          reminder_id: string
          report_id: string | null
          scheduled_for: string
          status: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notification_id?: string | null
          occurrence_key: string
          processed_at?: string
          reason_code?: string | null
          reminder_id: string
          report_id?: string | null
          scheduled_for: string
          status: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notification_id?: string | null
          occurrence_key?: string
          processed_at?: string
          reason_code?: string | null
          reminder_id?: string
          report_id?: string | null
          scheduled_for?: string
          status?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_occurrences_notification_id_workspace_id_user_id_fkey"
            columns: ["notification_id", "workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id", "workspace_id", "user_id"]
          },
          {
            foreignKeyName: "reminder_occurrences_reminder_id_workspace_id_user_id_fkey"
            columns: ["reminder_id", "workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "reminders"
            referencedColumns: ["id", "workspace_id", "user_id"]
          },
          {
            foreignKeyName: "reminder_occurrences_report_id_workspace_id_user_id_fkey"
            columns: ["report_id", "workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "weekly_reports"
            referencedColumns: ["id", "workspace_id", "user_id"]
          },
        ]
      }
      reminder_schedules: {
        Row: {
          absolute_at: string | null
          anchor_at: string | null
          created_at: string
          days_of_week: number[] | null
          id: string
          last_occurrence_key: string | null
          last_run_at: string | null
          local_date: string | null
          local_time: string | null
          next_run_at: string | null
          offset_minutes: number | null
          reminder_id: string
          schedule_type: string
          timezone: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          absolute_at?: string | null
          anchor_at?: string | null
          created_at?: string
          days_of_week?: number[] | null
          id?: string
          last_occurrence_key?: string | null
          last_run_at?: string | null
          local_date?: string | null
          local_time?: string | null
          next_run_at?: string | null
          offset_minutes?: number | null
          reminder_id: string
          schedule_type: string
          timezone: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          absolute_at?: string | null
          anchor_at?: string | null
          created_at?: string
          days_of_week?: number[] | null
          id?: string
          last_occurrence_key?: string | null
          last_run_at?: string | null
          local_date?: string | null
          local_time?: string | null
          next_run_at?: string | null
          offset_minutes?: number | null
          reminder_id?: string
          schedule_type?: string
          timezone?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_schedules_reminder_id_workspace_id_user_id_fkey"
            columns: ["reminder_id", "workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "reminders"
            referencedColumns: ["id", "workspace_id", "user_id"]
          },
        ]
      }
      reminders: {
        Row: {
          archived_at: string | null
          body: string
          channels: string[]
          created_at: string
          enabled: boolean
          id: string
          priority: string
          respect_quiet_hours: boolean
          source_id: string | null
          source_type: string
          title: string
          type: string
          updated_at: string
          user_id: string
          version: number
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          body?: string
          channels?: string[]
          created_at?: string
          enabled?: boolean
          id?: string
          priority?: string
          respect_quiet_hours?: boolean
          source_id?: string | null
          source_type?: string
          title: string
          type: string
          updated_at?: string
          user_id: string
          version?: number
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          body?: string
          channels?: string[]
          created_at?: string
          enabled?: boolean
          id?: string
          priority?: string
          respect_quiet_hours?: boolean
          source_id?: string | null
          source_type?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      revision_attempts: {
        Row: {
          confidence: number | null
          created_at: string
          duration_ms: number
          hint_level: number
          id: string
          next_due_at: string
          next_interval_days: number
          outcome: string
          policy_version: string
          previous_due_at: string | null
          previous_interval_days: number | null
          reviewed_at: string
          revision_item_id: string
          schedule_reason: string
          source_attempt_id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          duration_ms: number
          hint_level: number
          id?: string
          next_due_at: string
          next_interval_days: number
          outcome: string
          policy_version: string
          previous_due_at?: string | null
          previous_interval_days?: number | null
          reviewed_at: string
          revision_item_id: string
          schedule_reason: string
          source_attempt_id: string
          user_id: string
          workspace_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          duration_ms?: number
          hint_level?: number
          id?: string
          next_due_at?: string
          next_interval_days?: number
          outcome?: string
          policy_version?: string
          previous_due_at?: string | null
          previous_interval_days?: number | null
          reviewed_at?: string
          revision_item_id?: string
          schedule_reason?: string
          source_attempt_id?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revision_attempts_revision_item_id_workspace_id_user_id_fkey"
            columns: ["revision_item_id", "workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "revision_items"
            referencedColumns: ["id", "workspace_id", "user_id"]
          },
          {
            foreignKeyName: "revision_attempts_source_attempt_id_workspace_id_user_id_fkey"
            columns: ["source_attempt_id", "workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "question_attempts"
            referencedColumns: ["id", "workspace_id", "user_id"]
          },
        ]
      }
      revision_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          request_hash: string
          request_id: string
          revision_item_id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          request_hash: string
          request_id: string
          revision_item_id: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          request_hash?: string
          request_id?: string
          revision_item_id?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revision_events_revision_item_id_workspace_id_user_id_fkey"
            columns: ["revision_item_id", "workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "revision_items"
            referencedColumns: ["id", "workspace_id", "user_id"]
          },
        ]
      }
      revision_execution_links: {
        Row: {
          item_id: string
          revision_item_id: string
          session_id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          item_id: string
          revision_item_id: string
          session_id: string
          user_id: string
          workspace_id: string
        }
        Update: {
          item_id?: string
          revision_item_id?: string
          session_id?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revision_execution_links_item_id_session_id_workspace_id_u_fkey"
            columns: ["item_id", "session_id", "workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "execution_session_items"
            referencedColumns: ["id", "session_id", "workspace_id", "user_id"]
          },
          {
            foreignKeyName: "revision_execution_links_revision_item_id_workspace_id_use_fkey"
            columns: ["revision_item_id", "workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "revision_items"
            referencedColumns: ["id", "workspace_id", "user_id"]
          },
        ]
      }
      revision_items: {
        Row: {
          created_at: string
          due_at: string
          entity_id: string
          entity_type: string
          failure_count: number
          id: string
          independent_streak: number
          interval_days: number
          last_outcome: string
          last_reviewed_at: string
          origin_session_id: string
          policy_version: string
          review_count: number
          schedule_reason: string
          snooze_count: number
          state: string
          updated_at: string
          user_id: string
          version: number
          workspace_id: string
        }
        Insert: {
          created_at?: string
          due_at: string
          entity_id: string
          entity_type?: string
          failure_count?: number
          id?: string
          independent_streak?: number
          interval_days: number
          last_outcome: string
          last_reviewed_at: string
          origin_session_id: string
          policy_version?: string
          review_count?: number
          schedule_reason: string
          snooze_count?: number
          state?: string
          updated_at?: string
          user_id: string
          version?: number
          workspace_id: string
        }
        Update: {
          created_at?: string
          due_at?: string
          entity_id?: string
          entity_type?: string
          failure_count?: number
          id?: string
          independent_streak?: number
          interval_days?: number
          last_outcome?: string
          last_reviewed_at?: string
          origin_session_id?: string
          policy_version?: string
          review_count?: number
          schedule_reason?: string
          snooze_count?: number
          state?: string
          updated_at?: string
          user_id?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revision_items_entity_id_origin_session_id_workspace_id_us_fkey"
            columns: [
              "entity_id",
              "origin_session_id",
              "workspace_id",
              "user_id",
            ]
            isOneToOne: false
            referencedRelation: "execution_session_items"
            referencedColumns: ["id", "session_id", "workspace_id", "user_id"]
          },
          {
            foreignKeyName: "revision_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      revision_snoozes: {
        Row: {
          created_at: string
          id: string
          previous_due_at: string
          previous_state: string
          reason: string
          revision_item_id: string
          snoozed_until: string
          undone_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          previous_due_at: string
          previous_state: string
          reason?: string
          revision_item_id: string
          snoozed_until: string
          undone_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          previous_due_at?: string
          previous_state?: string
          reason?: string
          revision_item_id?: string
          snoozed_until?: string
          undone_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revision_snoozes_revision_item_id_workspace_id_user_id_fkey"
            columns: ["revision_item_id", "workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "revision_items"
            referencedColumns: ["id", "workspace_id", "user_id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          role_family: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: string
          is_active?: boolean
          name: string
          role_family: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          role_family?: string
        }
        Relationships: []
      }
      star_stories: {
        Row: {
          action: string
          context: string
          created_at: string
          id: string
          period: string
          private_notes: string
          reflection: string
          result: string
          retired_at: string | null
          situation: string
          status: string
          story_type: string | null
          summary: string
          task: string
          title: string
          updated_at: string
          user_id: string
          version: number
          workspace_id: string
        }
        Insert: {
          action?: string
          context?: string
          created_at?: string
          id?: string
          period?: string
          private_notes?: string
          reflection?: string
          result?: string
          retired_at?: string | null
          situation?: string
          status?: string
          story_type?: string | null
          summary?: string
          task?: string
          title: string
          updated_at?: string
          user_id: string
          version?: number
          workspace_id: string
        }
        Update: {
          action?: string
          context?: string
          created_at?: string
          id?: string
          period?: string
          private_notes?: string
          reflection?: string
          result?: string
          retired_at?: string | null
          situation?: string
          status?: string
          story_type?: string | null
          summary?: string
          task?: string
          title?: string
          updated_at?: string
          user_id?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "star_stories_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      star_story_principles: {
        Row: {
          is_primary: boolean
          notes: string
          principle_id: string
          relevance: string
          story_id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          is_primary?: boolean
          notes?: string
          principle_id: string
          relevance: string
          story_id: string
          user_id: string
          workspace_id: string
        }
        Update: {
          is_primary?: boolean
          notes?: string
          principle_id?: string
          relevance?: string
          story_id?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "star_story_principles_principle_id_fkey"
            columns: ["principle_id"]
            isOneToOne: false
            referencedRelation: "behavioral_principles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "star_story_principles_story_id_workspace_id_user_id_fkey"
            columns: ["story_id", "workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "star_stories"
            referencedColumns: ["id", "workspace_id", "user_id"]
          },
        ]
      }
      template_behavioral_frameworks: {
        Row: {
          framework_id: string
          framework_version: number
          template_id: string
          template_version: number
        }
        Insert: {
          framework_id: string
          framework_version: number
          template_id: string
          template_version: number
        }
        Update: {
          framework_id?: string
          framework_version?: number
          template_id?: string
          template_version?: number
        }
        Relationships: [
          {
            foreignKeyName: "template_behavioral_framework_framework_id_framework_versi_fkey"
            columns: ["framework_id", "framework_version"]
            isOneToOne: false
            referencedRelation: "behavioral_frameworks"
            referencedColumns: ["id", "version"]
          },
          {
            foreignKeyName: "template_behavioral_framework_template_id_template_version_fkey"
            columns: ["template_id", "template_version"]
            isOneToOne: true
            referencedRelation: "preparation_template_versions"
            referencedColumns: ["template_id", "version_number"]
          },
        ]
      }
      template_interview_stages: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          optional: boolean
          sort_order: number
          stage_type: string
          template_version_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          optional?: boolean
          sort_order?: number
          stage_type: string
          template_version_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          optional?: boolean
          sort_order?: number
          stage_type?: string
          template_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_interview_stages_template_version_id_fkey"
            columns: ["template_version_id"]
            isOneToOne: false
            referencedRelation: "preparation_template_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      template_readiness_requirements: {
        Row: {
          created_at: string
          dimension: string
          id: string
          minimum_evidence: string
          required: boolean
          template_version_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          dimension: string
          id?: string
          minimum_evidence: string
          required?: boolean
          template_version_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          dimension?: string
          id?: string
          minimum_evidence?: string
          required?: boolean
          template_version_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "template_readiness_requirements_template_version_id_fkey"
            columns: ["template_version_id"]
            isOneToOne: false
            referencedRelation: "preparation_template_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      template_version_patterns: {
        Row: {
          created_at: string
          id: string
          pattern_id: string
          priority: string
          recommended_attempts: number | null
          sort_order: number
          template_version_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pattern_id: string
          priority?: string
          recommended_attempts?: number | null
          sort_order?: number
          template_version_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pattern_id?: string
          priority?: string
          recommended_attempts?: number | null
          sort_order?: number
          template_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_version_patterns_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "patterns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_version_patterns_template_version_id_fkey"
            columns: ["template_version_id"]
            isOneToOne: false
            referencedRelation: "preparation_template_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      template_version_topics: {
        Row: {
          created_at: string
          id: string
          priority: string
          recommended_question_count: number | null
          recommended_revision_depth: number | null
          required: boolean
          sort_order: number
          template_version_id: string
          topic_id: string
          track_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          priority?: string
          recommended_question_count?: number | null
          recommended_revision_depth?: number | null
          required?: boolean
          sort_order?: number
          template_version_id: string
          topic_id: string
          track_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          id?: string
          priority?: string
          recommended_question_count?: number | null
          recommended_revision_depth?: number | null
          required?: boolean
          sort_order?: number
          template_version_id?: string
          topic_id?: string
          track_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "template_version_topics_template_version_id_fkey"
            columns: ["template_version_id"]
            isOneToOne: false
            referencedRelation: "preparation_template_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_version_topics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_version_topics_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      template_version_tracks: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          priority: string
          recommended_minutes_percent: number | null
          required: boolean
          sort_order: number
          template_version_id: string
          track_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          priority?: string
          recommended_minutes_percent?: number | null
          required?: boolean
          sort_order?: number
          template_version_id: string
          track_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          priority?: string
          recommended_minutes_percent?: number | null
          required?: boolean
          sort_order?: number
          template_version_id?: string
          track_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "template_version_tracks_template_version_id_fkey"
            columns: ["template_version_id"]
            isOneToOne: false
            referencedRelation: "preparation_template_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_version_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      today_activity_events: {
        Row: {
          created_at: string
          daily_plan_id: string
          event_type: string
          id: string
          task_id: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          daily_plan_id: string
          event_type: string
          id?: string
          task_id?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          daily_plan_id?: string
          event_type?: string
          id?: string
          task_id?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "today_activity_events_daily_plan_id_workspace_id_fkey"
            columns: ["daily_plan_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "daily_plans"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "today_activity_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "daily_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "today_activity_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          created_at: string
          description: string | null
          id: string
          importance_level: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          track_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: string
          importance_level?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          track_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          importance_level?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          track_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      weekly_goal_items: {
        Row: {
          created_at: string
          goal_type: string
          id: string
          target: number
          title: string
          track_id: string | null
          unit: string
          updated_at: string
          weekly_goal_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          goal_type: string
          id?: string
          target: number
          title: string
          track_id?: string | null
          unit: string
          updated_at?: string
          weekly_goal_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          goal_type?: string
          id?: string
          target?: number
          title?: string
          track_id?: string | null
          unit?: string
          updated_at?: string
          weekly_goal_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_goal_items_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_goal_items_weekly_goal_id_workspace_id_fkey"
            columns: ["weekly_goal_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "weekly_goals"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "weekly_goal_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_goals: {
        Row: {
          created_at: string
          id: string
          week_start: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          week_start: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          week_start?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_goals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_reports: {
        Row: {
          attempt_count: number
          created_at: string
          failure_code: string | null
          generated_at: string | null
          id: string
          lease_token: string | null
          lease_until: string | null
          period_end: string
          period_start: string
          policy_version: string
          published_at: string | null
          source_coverage: Json
          status: string
          summary_json: Json | null
          timezone: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          failure_code?: string | null
          generated_at?: string | null
          id?: string
          lease_token?: string | null
          lease_until?: string | null
          period_end: string
          period_start: string
          policy_version?: string
          published_at?: string | null
          source_coverage?: Json
          status?: string
          summary_json?: Json | null
          timezone: string
          user_id: string
          workspace_id: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          failure_code?: string | null
          generated_at?: string | null
          id?: string
          lease_token?: string | null
          lease_until?: string | null
          period_end?: string
          period_start?: string
          policy_version?: string
          published_at?: string | null
          source_coverage?: Json
          status?: string
          summary_json?: Json | null
          timezone?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_reports_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_reviews: {
        Row: {
          closed_at: string
          closed_by: string
          id: string
          notes: string
          summary: Json
          week_start: string
          workspace_id: string
        }
        Insert: {
          closed_at?: string
          closed_by: string
          id?: string
          notes?: string
          summary: Json
          week_start: string
          workspace_id: string
        }
        Update: {
          closed_at?: string
          closed_by?: string
          id?: string
          notes?: string
          summary?: Json
          week_start?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_reviews_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_activity_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_activity_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_behavioral_settings: {
        Row: {
          framework_id: string
          framework_version: number
          user_id: string
          version: number
          workspace_id: string
        }
        Insert: {
          framework_id: string
          framework_version: number
          user_id: string
          version?: number
          workspace_id: string
        }
        Update: {
          framework_id?: string
          framework_version?: number
          user_id?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_behavioral_settings_framework_id_framework_versi_fkey"
            columns: ["framework_id", "framework_version"]
            isOneToOne: false
            referencedRelation: "behavioral_frameworks"
            referencedColumns: ["id", "version"]
          },
          {
            foreignKeyName: "workspace_behavioral_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_curricula: {
        Row: {
          applied_at: string
          id: string
          status: string
          template_id: string
          template_version_id: string
          updated_at: string
          version_number: number
          workspace_id: string
        }
        Insert: {
          applied_at?: string
          id?: string
          status?: string
          template_id: string
          template_version_id: string
          updated_at?: string
          version_number: number
          workspace_id: string
        }
        Update: {
          applied_at?: string
          id?: string
          status?: string
          template_id?: string
          template_version_id?: string
          updated_at?: string
          version_number?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_curricula_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "preparation_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_curricula_template_version_id_fkey"
            columns: ["template_version_id"]
            isOneToOne: false
            referencedRelation: "preparation_template_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_curricula_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_curriculum_overrides: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          override_type: string
          updated_at: string
          value: Json
          workspace_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          override_type: string
          updated_at?: string
          value: Json
          workspace_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          override_type?: string
          updated_at?: string
          value?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_curriculum_overrides_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_learning_state: {
        Row: {
          bookmarked: boolean
          concept_id: string
          concept_version: number
          note: string
          opened_at: string
          request_hash: string
          request_id: string
          user_id: string
          version: number
          workspace_id: string
        }
        Insert: {
          bookmarked?: boolean
          concept_id: string
          concept_version: number
          note?: string
          opened_at?: string
          request_hash: string
          request_id: string
          user_id: string
          version?: number
          workspace_id: string
        }
        Update: {
          bookmarked?: boolean
          concept_id?: string
          concept_version?: number
          note?: string
          opened_at?: string
          request_hash?: string
          request_id?: string
          user_id?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_learning_state_concept_id_concept_version_fkey"
            columns: ["concept_id", "concept_version"]
            isOneToOne: false
            referencedRelation: "learning_concepts"
            referencedColumns: ["id", "version"]
          },
          {
            foreignKeyName: "workspace_learning_state_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          joined_at: string | null
          role: string
          status: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_plans: {
        Row: {
          created_at: string
          first_week_plan: Json
          focus_areas: string[]
          id: string
          planned_sessions: number
          starter_items: Json
          status: string
          template_id: string | null
          total_weekly_minutes: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          first_week_plan?: Json
          focus_areas?: string[]
          id?: string
          planned_sessions: number
          starter_items?: Json
          status?: string
          template_id?: string | null
          total_weekly_minutes: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          first_week_plan?: Json
          focus_areas?: string[]
          id?: string
          planned_sessions?: number
          starter_items?: Json
          status?: string
          template_id?: string | null
          total_weekly_minutes?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_plans_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "preparation_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_plans_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_preferences: {
        Row: {
          created_at: string
          default_daily_minutes: number
          planning_mode: string
          study_days: string[]
          updated_at: string
          weekly_target_minutes: number
          workspace_id: string
        }
        Insert: {
          created_at?: string
          default_daily_minutes?: number
          planning_mode?: string
          study_days?: string[]
          updated_at?: string
          weekly_target_minutes?: number
          workspace_id: string
        }
        Update: {
          created_at?: string
          default_daily_minutes?: number
          planning_mode?: string
          study_days?: string[]
          updated_at?: string
          weekly_target_minutes?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_preferences_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_settings: {
        Row: {
          created_at: string
          default_daily_minutes: number
          id: string
          preferred_coding_language: string | null
          study_days: string[]
          updated_at: string
          weekly_target_minutes: number
          workspace_id: string
        }
        Insert: {
          created_at?: string
          default_daily_minutes: number
          id?: string
          preferred_coding_language?: string | null
          study_days?: string[]
          updated_at?: string
          weekly_target_minutes: number
          workspace_id: string
        }
        Update: {
          created_at?: string
          default_daily_minutes?: number
          id?: string
          preferred_coding_language?: string | null
          study_days?: string[]
          updated_at?: string
          weekly_target_minutes?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_targets: {
        Row: {
          company_id: string | null
          company_name: string | null
          created_at: string
          custom_company_name: string | null
          custom_role_name: string | null
          id: string
          interview_language: string
          preparation_level: string
          role_family: string
          role_id: string | null
          role_name: string
          target_date: string | null
          template_id: string | null
          template_version: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          company_id?: string | null
          company_name?: string | null
          created_at?: string
          custom_company_name?: string | null
          custom_role_name?: string | null
          id?: string
          interview_language?: string
          preparation_level?: string
          role_family: string
          role_id?: string | null
          role_name: string
          target_date?: string | null
          template_id?: string | null
          template_version?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          company_id?: string | null
          company_name?: string | null
          created_at?: string
          custom_company_name?: string | null
          custom_role_name?: string | null
          id?: string
          interview_language?: string
          preparation_level?: string
          role_family?: string
          role_id?: string | null
          role_name?: string
          target_date?: string | null
          template_id?: string | null
          template_version?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_targets_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_targets_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "preparation_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_targets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string
          created_by_user_id: string | null
          id: string
          name: string
          slug: string
          status: string
          target_company: string | null
          target_role: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by: string
          created_by_user_id?: string | null
          id?: string
          name: string
          slug: string
          status?: string
          target_company?: string | null
          target_role?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string
          created_by_user_id?: string | null
          id?: string
          name?: string
          slug?: string
          status?: string
          target_company?: string | null
          target_role?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      analytics_activity: {
        Args: { p_filters?: Json; p_slug: string }
        Returns: Json
      }
      analytics_core: {
        Args: { p_filters?: Json; p_slug: string }
        Returns: Json
      }
      analytics_history: {
        Args: {
          p_cursor?: Json
          p_filters: Json
          p_metric?: string
          p_slug: string
        }
        Returns: Json
      }
      analytics_interviews: {
        Args: { p_filters?: Json; p_limit?: number; p_slug: string }
        Returns: Json
      }
      apply_template_to_workspace: {
        Args: {
          p_template_id: string
          p_version_number?: number
          p_workspace_id: string
        }
        Returns: Json
      }
      archive_workspace: { Args: { p_workspace_id: string }; Returns: Json }
      assign_execution_topic: {
        Args: { p_item: string; p_slug: string; p_topic: string }
        Returns: undefined
      }
      behavioral_command: {
        Args: { p_command: Json; p_request: string; p_slug: string }
        Returns: Json
      }
      behavioral_complete: {
        Args: {
          p_evidence: Json
          p_request: string
          p_session: string
          p_slug: string
        }
        Returns: Json
      }
      behavioral_cue: {
        Args: { p_level: number; p_session: string; p_slug: string }
        Returns: Json
      }
      behavioral_detail: {
        Args: { p_slug: string; p_story: string }
        Returns: Json
      }
      behavioral_history: {
        Args: { p_cursor?: Json; p_slug: string; p_story?: string }
        Returns: Json
      }
      behavioral_home: {
        Args: { p_filters?: Json; p_slug: string }
        Returns: Json
      }
      behavioral_launch: {
        Args: {
          p_prompt: string
          p_request: string
          p_slug: string
          p_story: string
          p_target: number
        }
        Returns: Json
      }
      behavioral_prompts: {
        Args: { p_after?: string; p_search?: string; p_slug: string }
        Returns: Json
      }
      behavioral_session: {
        Args: { p_session: string; p_slug: string }
        Returns: Json
      }
      behavioral_story_rows: {
        Args: { p_filters?: Json; p_slug: string }
        Returns: Json
      }
      bootstrap_initial_workspace: {
        Args: {
          p_company_id?: string
          p_company_name?: string
          p_custom_company_name?: string
          p_default_daily_minutes?: number
          p_first_week_plan?: Json
          p_focus_areas?: string[]
          p_planned_sessions?: number
          p_preferred_coding_language?: string
          p_role_family: string
          p_role_name: string
          p_starter_items?: Json
          p_study_days?: string[]
          p_target_date?: string
          p_template_id?: string
          p_total_weekly_minutes?: number
          p_user_id: string
          p_weekly_target_minutes?: number
          p_workspace_name: string
          p_workspace_slug: string
        }
        Returns: Json
      }
      create_execution: {
        Args: { p_payload: Json; p_request: string; p_slug: string }
        Returns: Json
      }
      execution_focus: {
        Args: { p_from: string; p_to: string; p_workspace: string }
        Returns: {
          ended_at: string
          started_at: string
          task_type: string
          workspace_id: string
        }[]
      }
      execution_task_links: {
        Args: { p_tasks: string[]; p_workspace: string }
        Returns: {
          session_id: string
          status: string
          task_id: string
        }[]
      }
      is_workspace_member: {
        Args: { p_workspace_id: string }
        Returns: boolean
      }
      is_workspace_owner: { Args: { p_workspace_id: string }; Returns: boolean }
      learning_catalog: {
        Args: {
          p_after?: string
          p_bookmarked?: boolean
          p_search?: string
          p_slug: string
          p_subject?: string
          p_topic?: string
        }
        Returns: Json
      }
      learning_concept: {
        Args: { p_id: string; p_slug: string }
        Returns: Json
      }
      learning_launch: {
        Args: {
          p_activity: string
          p_mode: string
          p_request: string
          p_slug: string
        }
        Returns: Json
      }
      learning_overview: { Args: { p_slug: string }; Returns: Json }
      learning_session: {
        Args: { p_session: string; p_slug: string }
        Returns: Json
      }
      learning_state: {
        Args: {
          p_id: string
          p_patch: Json
          p_request: string
          p_slug: string
          p_version: number
        }
        Returns: Json
      }
      learning_submit: {
        Args: {
          p_answer: Json
          p_confidence: number
          p_mistakes?: string[]
          p_session: string
          p_slug: string
          p_version: number
        }
        Returns: Json
      }
      mastery_evidence: {
        Args: { p_at?: string; p_days?: number; p_slug: string }
        Returns: Json
      }
      mastery_spine: {
        Args: {
          p_before?: Json
          p_entity: string
          p_slug: string
          p_type: string
        }
        Returns: Json
      }
      mutate_execution: {
        Args: {
          p_command: Json
          p_request: string
          p_session: string
          p_slug: string
          p_version: number
        }
        Returns: Json
      }
      mutate_planning: {
        Args: {
          p_command: Json
          p_context: string
          p_request: string
          p_revision: number
          p_slug: string
          p_week: string
        }
        Returns: number
      }
      mutate_revision: {
        Args: {
          p_command: Json
          p_item: string
          p_request: string
          p_slug: string
          p_version: number
        }
        Returns: Json
      }
      mutate_today: {
        Args: { p_command: Json; p_day: string; p_slug: string }
        Returns: string
      }
      notification_check: { Args: { p_slug: string }; Returns: Json }
      notification_command: {
        Args: { p_command: Json; p_request: string; p_slug: string }
        Returns: Json
      }
      notification_detail: {
        Args: { p_id: string; p_slug: string }
        Returns: Json
      }
      notification_inbox: {
        Args: {
          p_cursor?: Json
          p_filters?: Json
          p_limit?: number
          p_slug: string
        }
        Returns: Json
      }
      notification_report: {
        Args: { p_id: string; p_slug: string }
        Returns: Json
      }
      notification_schedule_preview: {
        Args: {
          p_schedule: Json
          p_slug: string
          p_source_id?: string
          p_source_type?: string
        }
        Returns: Json
      }
      notification_settings: { Args: { p_slug: string }; Returns: Json }
      notification_worker: { Args: { p_command: Json }; Returns: Json }
      platform_file_command: {
        Args: { p_command: Json; p_request: string; p_slug: string }
        Returns: Json
      }
      platform_files: {
        Args: { p_cursor?: Json; p_slug: string }
        Returns: Json
      }
      platform_replay: {
        Args: { p_id: string; p_reason: string; p_request: string }
        Returns: Json
      }
      platform_worker: { Args: { p_command: Json }; Returns: Json }
      reconcile_revision: { Args: { p_slug: string }; Returns: number }
      resolve_execution: {
        Args: { p_session: string; p_slug: string }
        Returns: Json
      }
      restore_workspace: { Args: { p_workspace_id: string }; Returns: Json }
      revision_detail: {
        Args: {
          p_before?: string
          p_before_id?: string
          p_item: string
          p_slug: string
        }
        Returns: Json
      }
      revision_queue: {
        Args: { p_cursor?: Json; p_filters?: Json; p_slug: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
