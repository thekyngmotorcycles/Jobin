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
      account_preferences: {
        Row: {
          birth_date: string | null
          dating_mode: boolean
          friendship_mode: boolean
          professional_mode: boolean
          profile_id: string
          relationship_status: string | null
          show_relationship: boolean
          theme: string
          timezone: string
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          dating_mode?: boolean
          friendship_mode?: boolean
          professional_mode?: boolean
          profile_id: string
          relationship_status?: string | null
          show_relationship?: boolean
          theme?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          dating_mode?: boolean
          friendship_mode?: boolean
          professional_mode?: boolean
          profile_id?: string
          relationship_status?: string | null
          show_relationship?: boolean
          theme?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_rules: {
        Row: {
          id: string
          local_end: string
          local_start: string
          provider_id: string
          timezone: string
          weekday: number
        }
        Insert: {
          id?: string
          local_end: string
          local_start: string
          provider_id: string
          timezone: string
          weekday: number
        }
        Update: {
          id?: string
          local_end?: string
          local_start?: string
          provider_id?: string
          timezone?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "availability_rules_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          amount_minor: number
          client_id: string
          completed_at: string | null
          created_at: string
          currency: string
          ends_at: string
          id: string
          provider_id: string
          service_id: string | null
          starts_at: string
          status: string
        }
        Insert: {
          amount_minor: number
          client_id: string
          completed_at?: string | null
          created_at?: string
          currency?: string
          ends_at: string
          id?: string
          provider_id: string
          service_id?: string | null
          starts_at: string
          status?: string
        }
        Update: {
          amount_minor?: number
          client_id?: string
          completed_at?: string | null
          created_at?: string
          currency?: string
          ends_at?: string
          id?: string
          provider_id?: string
          service_id?: string | null
          starts_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_connections: {
        Row: {
          created_at: string
          external_calendar_id: string
          id: string
          profile_id: string
          provider: string
        }
        Insert: {
          created_at?: string
          external_calendar_id: string
          id?: string
          profile_id: string
          provider: string
        }
        Update: {
          created_at?: string
          external_calendar_id?: string
          id?: string
          profile_id?: string
          provider?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_connections_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      career_contacts: {
        Row: {
          created_at: string
          decided_at: string | null
          id: string
          kind: string
          message: string
          organization_id: string
          profession_code: string
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          id?: string
          kind: string
          message: string
          organization_id: string
          profession_code: string
          status?: string
          student_id: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          id?: string
          kind?: string
          message?: string
          organization_id?: string
          profession_code?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "career_contacts_profession_code_fkey"
            columns: ["profession_code"]
            isOneToOne: false
            referencedRelation: "profession_catalog"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "career_contacts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          jurisdiction_city: string | null
          jurisdiction_state: string | null
          legal_name: string
          profile_id: string
          website: string | null
        }
        Insert: {
          created_at?: string
          jurisdiction_city?: string | null
          jurisdiction_state?: string | null
          legal_name: string
          profile_id: string
          website?: string | null
        }
        Update: {
          created_at?: string
          jurisdiction_city?: string | null
          jurisdiction_state?: string | null
          legal_name?: string
          profile_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_documents: {
        Row: {
          created_at: string
          id: string
          issuing_authority: string
          kind: string
          license_number: string | null
          request_id: string
          storage_path: string
          uploaded_by: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          issuing_authority: string
          kind: string
          license_number?: string | null
          request_id: string
          storage_path: string
          uploaded_by: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          issuing_authority?: string
          kind?: string
          license_number?: string | null
          request_id?: string
          storage_path?: string
          uploaded_by?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_documents_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "company_verification_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_verification_requests: {
        Row: {
          company_id: string
          created_at: string
          decision_reason: string | null
          id: string
          industry: string
          municipality: string
          reviewed_at: string | null
          reviewed_by: string | null
          state: string
          status: string
          submitted_by: string
          valid_until: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          decision_reason?: string | null
          id?: string
          industry: string
          municipality: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          state: string
          status?: string
          submitted_by: string
          valid_until?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          decision_reason?: string | null
          id?: string
          industry?: string
          municipality?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: string
          status?: string
          submitted_by?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_verification_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "company_verification_requests_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_verifications: {
        Row: {
          company_id: string
          id: string
          request_id: string
          revocation_reason: string | null
          revoked_at: string | null
          valid_until: string
          verified_at: string
          verified_by: string
        }
        Insert: {
          company_id: string
          id?: string
          request_id: string
          revocation_reason?: string | null
          revoked_at?: string | null
          valid_until: string
          verified_at?: string
          verified_by: string
        }
        Update: {
          company_id?: string
          id?: string
          request_id?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          valid_until?: string
          verified_at?: string
          verified_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_verifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "company_verifications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "company_verification_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      connection_interests: {
        Row: {
          created_at: string
          from_id: string
          intent: string
          to_id: string
        }
        Insert: {
          created_at?: string
          from_id: string
          intent: string
          to_id: string
        }
        Update: {
          created_at?: string
          from_id?: string
          intent?: string
          to_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connection_interests_from_id_fkey"
            columns: ["from_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_interests_to_id_fkey"
            columns: ["to_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          accepted_at: string | null
          amount_minor: number | null
          completed_at: string | null
          created_at: string
          currency: string
          hirer_id: string
          id: string
          professional_id: string
          status: string
          title: string
        }
        Insert: {
          accepted_at?: string | null
          amount_minor?: number | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          hirer_id: string
          id?: string
          professional_id: string
          status: string
          title: string
        }
        Update: {
          accepted_at?: string | null
          amount_minor?: number | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          hirer_id?: string
          id?: string
          professional_id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_hirer_id_fkey"
            columns: ["hirer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_members: {
        Row: {
          conversation_id: string
          joined_at: string
          profile_id: string
        }
        Insert: {
          conversation_id: string
          joined_at?: string
          profile_id: string
        }
        Update: {
          conversation_id?: string
          joined_at?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          booking_id: string | null
          created_at: string
          id: string
          match_id: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          id?: string
          match_id?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          id?: string
          match_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      credential_requests: {
        Row: {
          created_at: string
          id: string
          organization_kind: string | null
          owner_id: string
          profession_code: string
          reason: string | null
          request_kind: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_kind?: string | null
          owner_id: string
          profession_code: string
          reason?: string | null
          request_kind: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_kind?: string | null
          owner_id?: string
          profession_code?: string
          reason?: string | null
          request_kind?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "credential_requests_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credential_requests_profession_code_fkey"
            columns: ["profession_code"]
            isOneToOne: false
            referencedRelation: "profession_catalog"
            referencedColumns: ["code"]
          },
        ]
      }
      dispute_evidence: {
        Row: {
          created_at: string
          dispute_id: string
          id: string
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          dispute_id: string
          id?: string
          storage_path: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          dispute_id?: string
          id?: string
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_evidence_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "review_disputes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispute_evidence_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employment_events: {
        Row: {
          actor_id: string | null
          created_at: string
          details: Json
          event: string
          id: number
          record_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          details?: Json
          event: string
          id?: never
          record_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          details?: Json
          event?: string
          id?: never
          record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employment_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employment_events_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "employment_records"
            referencedColumns: ["id"]
          },
        ]
      }
      employment_records: {
        Row: {
          company_approved_at: string | null
          company_id: string
          created_at: string
          ended_on: string | null
          id: string
          job_title: string
          started_on: string
          worker_consented_at: string | null
          worker_id: string
        }
        Insert: {
          company_approved_at?: string | null
          company_id: string
          created_at?: string
          ended_on?: string | null
          id?: string
          job_title: string
          started_on: string
          worker_consented_at?: string | null
          worker_id: string
        }
        Update: {
          company_approved_at?: string | null
          company_id?: string
          created_at?: string
          ended_on?: string | null
          id?: string
          job_title?: string
          started_on?: string
          worker_consented_at?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employment_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "employment_records_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guild_members: {
        Row: {
          created_at: string
          guild_id: string
          profile_id: string
          role: string
        }
        Insert: {
          created_at?: string
          guild_id: string
          profile_id: string
          role?: string
        }
        Update: {
          created_at?: string
          guild_id?: string
          profile_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "guild_members_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guild_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guild_posts: {
        Row: {
          author_id: string
          body: string
          created_at: string
          guild_id: string
          id: string
          removed_at: string | null
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          guild_id: string
          id?: string
          removed_at?: string | null
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          guild_id?: string
          id?: string
          removed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guild_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guild_posts_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      guilds: {
        Row: {
          city: string
          created_at: string
          description: string
          id: string
          industry: string | null
          name: string
          owner_id: string
        }
        Insert: {
          city: string
          created_at?: string
          description?: string
          id?: string
          industry?: string | null
          name: string
          owner_id: string
        }
        Update: {
          city?: string
          created_at?: string
          description?: string
          id?: string
          industry?: string | null
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guilds_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      impersonation_reports: {
        Row: {
          accused_id: string
          company_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          evidence_path: string
          id: string
          live_id: string | null
          status: string
        }
        Insert: {
          accused_id: string
          company_id: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          evidence_path: string
          id?: string
          live_id?: string | null
          status?: string
        }
        Update: {
          accused_id?: string
          company_id?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          evidence_path?: string
          id?: string
          live_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "impersonation_reports_accused_id_fkey"
            columns: ["accused_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "impersonation_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "impersonation_reports_live_id_fkey"
            columns: ["live_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_ranks: {
        Row: {
          active: boolean
          id: string
          label: string
          ordinal: number
          organization_id: string
          profession_code: string
          short_label: string
        }
        Insert: {
          active?: boolean
          id?: string
          label: string
          ordinal: number
          organization_id: string
          profession_code: string
          short_label: string
        }
        Update: {
          active?: boolean
          id?: string
          label?: string
          ordinal?: number
          organization_id?: string
          profession_code?: string
          short_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_ranks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "institution_ranks_profession_code_fkey"
            columns: ["profession_code"]
            isOneToOne: false
            referencedRelation: "profession_catalog"
            referencedColumns: ["code"]
          },
        ]
      }
      jcard_profiles: {
        Row: {
          availability: string
          handle: string
          languages: Json
          profile_id: string
        }
        Insert: {
          availability?: string
          handle: string
          languages?: Json
          profile_id: string
        }
        Update: {
          availability?: string
          handle?: string
          languages?: Json
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jcard_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_participants: {
        Row: {
          accepted_at: string | null
          invited_at: string
          profile_id: string
          role: string
          session_id: string
        }
        Insert: {
          accepted_at?: string | null
          invited_at?: string
          profile_id: string
          role: string
          session_id: string
        }
        Update: {
          accepted_at?: string | null
          invited_at?: string
          profile_id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          host_id: string
          id: string
          provider_room_id: string | null
          purpose: string
          scheduled_at: string | null
          started_at: string | null
          status: string
          title: string
          visibility: string
          work_consent_at: string | null
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          host_id: string
          id?: string
          provider_room_id?: string | null
          purpose: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          title: string
          visibility: string
          work_consent_at?: string | null
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          host_id?: string
          id?: string
          provider_room_id?: string | null
          purpose?: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          title?: string
          visibility?: string
          work_consent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_sessions_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          id: string
          intent: string
          profile_a: string
          profile_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          intent: string
          profile_a: string
          profile_b: string
        }
        Update: {
          created_at?: string
          id?: string
          intent?: string
          profile_a?: string
          profile_b?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_profile_a_fkey"
            columns: ["profile_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_profile_b_fkey"
            columns: ["profile_b"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          removed_at: string | null
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          removed_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          removed_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          kind: string
          payload: Json
          read_at: string | null
          recipient_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          payload?: Json
          read_at?: string | null
          recipient_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
          read_at?: string | null
          recipient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_representatives: {
        Row: {
          approved_at: string
          approved_by: string
          can_represent: boolean
          employment_id: string
        }
        Insert: {
          approved_at?: string
          approved_by: string
          can_represent?: boolean
          employment_id: string
        }
        Update: {
          approved_at?: string
          approved_by?: string
          can_represent?: boolean
          employment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_representatives_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "organization_representatives_employment_id_fkey"
            columns: ["employment_id"]
            isOneToOne: true
            referencedRelation: "employment_records"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_scopes: {
        Row: {
          active: boolean
          approved_at: string
          approved_by: string
          organization_id: string
          profession_code: string
        }
        Insert: {
          active?: boolean
          approved_at?: string
          approved_by: string
          organization_id: string
          profession_code: string
        }
        Update: {
          active?: boolean
          approved_at?: string
          approved_by?: string
          organization_id?: string
          profession_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_scopes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "organization_scopes_profession_code_fkey"
            columns: ["profession_code"]
            isOneToOne: false
            referencedRelation: "profession_catalog"
            referencedColumns: ["code"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          kind: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          kind?: string
          profile_id: string
        }
        Update: {
          created_at?: string
          kind?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      payment_accounts: {
        Row: {
          charges_enabled: boolean
          payouts_enabled: boolean
          profile_id: string
          stripe_account_id: string
          updated_at: string
        }
        Insert: {
          charges_enabled?: boolean
          payouts_enabled?: boolean
          profile_id: string
          stripe_account_id: string
          updated_at?: string
        }
        Update: {
          charges_enabled?: boolean
          payouts_enabled?: boolean
          profile_id?: string
          stripe_account_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_accounts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_minor: number
          booking_id: string | null
          contract_id: string | null
          created_at: string
          currency: string
          id: string
          platform_fee_minor: number
          status: string
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount_minor: number
          booking_id?: string | null
          contract_id?: string | null
          created_at?: string
          currency: string
          id?: string
          platform_fee_minor?: number
          status: string
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount_minor?: number
          booking_id?: string | null
          contract_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          platform_fee_minor?: number
          status?: string
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      person_professions: {
        Row: {
          id: string
          institution_id: string | null
          primary_profession: boolean
          profession_code: string
          training_status: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
          worker_id: string
        }
        Insert: {
          id?: string
          institution_id?: string | null
          primary_profession?: boolean
          profession_code: string
          training_status: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          worker_id: string
        }
        Update: {
          id?: string
          institution_id?: string | null
          primary_profession?: boolean
          profession_code?: string
          training_status?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_professions_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "person_professions_profession_code_fkey"
            columns: ["profession_code"]
            isOneToOne: false
            referencedRelation: "profession_catalog"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "person_professions_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_licenses: {
        Row: {
          created_at: string
          decided_at: string | null
          id: string
          profile_id: string
          reviewed_by: string | null
          status: string
          storage_path: string
          valid_until: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          id?: string
          profile_id: string
          reviewed_by?: string | null
          status?: string
          storage_path: string
          valid_until: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          id?: string
          profile_id?: string
          reviewed_by?: string | null
          status?: string
          storage_path?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_licenses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_post_likes: {
        Row: {
          created_at: string
          post_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          profile_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "photo_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_post_likes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_post_media: {
        Row: {
          position: number
          post_id: string
          storage_path: string
        }
        Insert: {
          position: number
          post_id: string
          storage_path: string
        }
        Update: {
          position?: number
          post_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "photo_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_posts: {
        Row: {
          author_id: string
          caption: string
          created_at: string
          id: string
          removed_at: string | null
        }
        Insert: {
          author_id: string
          caption?: string
          created_at?: string
          id?: string
          removed_at?: string | null
        }
        Update: {
          author_id?: string
          caption?: string
          created_at?: string
          id?: string
          removed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photo_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profession_catalog: {
        Row: {
          active: boolean
          category: string
          code: string
          icon: string
          label: string
          short_label: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          category: string
          code: string
          icon?: string
          label: string
          short_label: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          category?: string
          code?: string
          icon?: string
          label?: string
          short_label?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "profession_catalog_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "profession_categories"
            referencedColumns: ["code"]
          },
        ]
      }
      profession_categories: {
        Row: {
          active: boolean
          code: string
          label: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          code: string
          label: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          code?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      profession_seals: {
        Row: {
          credential_id: string | null
          employment_id: string | null
          granted_at: string
          id: string
          organization_id: string | null
          origin: string
          profession_code: string
          rank_id: string | null
          revoked_at: string | null
          status: string
          worker_id: string
        }
        Insert: {
          credential_id?: string | null
          employment_id?: string | null
          granted_at?: string
          id?: string
          organization_id?: string | null
          origin: string
          profession_code: string
          rank_id?: string | null
          revoked_at?: string | null
          status: string
          worker_id: string
        }
        Update: {
          credential_id?: string | null
          employment_id?: string | null
          granted_at?: string
          id?: string
          organization_id?: string | null
          origin?: string
          profession_code?: string
          rank_id?: string | null
          revoked_at?: string | null
          status?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profession_seals_credential_id_fkey"
            columns: ["credential_id"]
            isOneToOne: false
            referencedRelation: "credential_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profession_seals_employment_id_fkey"
            columns: ["employment_id"]
            isOneToOne: false
            referencedRelation: "employment_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profession_seals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "profession_seals_profession_code_fkey"
            columns: ["profession_code"]
            isOneToOne: false
            referencedRelation: "profession_catalog"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "profession_seals_rank_id_fkey"
            columns: ["rank_id"]
            isOneToOne: false
            referencedRelation: "institution_ranks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profession_seals_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: string
          avatar_path: string | null
          bio: string
          city: string | null
          created_at: string
          deactivated_at: string | null
          display_name: string
          id: string
          industry: string | null
          region: string | null
        }
        Insert: {
          account_type: string
          avatar_path?: string | null
          bio?: string
          city?: string | null
          created_at?: string
          deactivated_at?: string | null
          display_name: string
          id: string
          industry?: string | null
          region?: string | null
        }
        Update: {
          account_type?: string
          avatar_path?: string | null
          bio?: string
          city?: string | null
          created_at?: string
          deactivated_at?: string | null
          display_name?: string
          id?: string
          industry?: string | null
          region?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string
          status: string
          subject_id: string | null
          video_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          status?: string
          subject_id?: string | null
          video_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          status?: string
          subject_id?: string | null
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      review_authorizations: {
        Row: {
          client_id: string
          expires_at: string
          granted_at: string
          id: string
          worker_id: string
        }
        Insert: {
          client_id: string
          expires_at: string
          granted_at?: string
          id?: string
          worker_id: string
        }
        Update: {
          client_id?: string
          expires_at?: string
          granted_at?: string
          id?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_authorizations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_authorizations_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      review_disputes: {
        Row: {
          created_at: string
          id: string
          opened_by: string
          reason: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          review_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          opened_by: string
          reason: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          review_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          opened_by?: string
          reason?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          review_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_disputes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_disputes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_evidence: {
        Row: {
          created_at: string
          id: string
          review_id: string
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          review_id: string
          storage_path: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          id?: string
          review_id?: string
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_evidence_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_evidence_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      review_extension_requests: {
        Row: {
          authorization_id: string
          created_at: string
          decided_at: string | null
          id: string
          months: number
          requested_by: string
          status: string
        }
        Insert: {
          authorization_id: string
          created_at?: string
          decided_at?: string | null
          id?: string
          months: number
          requested_by: string
          status?: string
        }
        Update: {
          authorization_id?: string
          created_at?: string
          decided_at?: string | null
          id?: string
          months?: number
          requested_by?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_extension_requests_authorization_id_fkey"
            columns: ["authorization_id"]
            isOneToOne: false
            referencedRelation: "review_authorizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_extension_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string | null
          contract_id: string | null
          created_at: string
          description: string
          id: string
          rating: number
          reviewer_id: string
          status: string
          subject_id: string
        }
        Insert: {
          booking_id?: string | null
          contract_id?: string | null
          created_at?: string
          description: string
          id?: string
          rating: number
          reviewer_id: string
          status?: string
          subject_id: string
        }
        Update: {
          booking_id?: string | null
          contract_id?: string | null
          created_at?: string
          description?: string
          id?: string
          rating?: number
          reviewer_id?: string
          status?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: true
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_ledger: {
        Row: {
          activity_id: string
          created_at: string
          id: string
          points: number
          profile_id: string
          reason: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          id?: string
          points: number
          profile_id: string
          reason: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          id?: string
          points?: number
          profile_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_ledger_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: true
            referencedRelation: "work_activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_ledger_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          created_at: string
          currency: string
          description: string
          duration_minutes: number
          id: string
          price_minor: number
          provider_id: string
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          currency?: string
          description?: string
          duration_minutes: number
          id?: string
          price_minor: number
          provider_id: string
          title: string
        }
        Update: {
          active?: boolean
          created_at?: string
          currency?: string
          description?: string
          duration_minutes?: number
          id?: string
          price_minor?: number
          provider_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_programs: {
        Row: {
          profile_id: string
          program: string
          school: string | null
          updated_at: string
        }
        Insert: {
          profile_id: string
          program: string
          school?: string | null
          updated_at?: string
        }
        Update: {
          profile_id?: string
          program?: string
          school?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_programs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      video_clips: {
        Row: {
          id: string
          position: number
          project_id: string
          storage_path: string
          trim_end_ms: number
          trim_start_ms: number
        }
        Insert: {
          id?: string
          position: number
          project_id: string
          storage_path: string
          trim_end_ms: number
          trim_start_ms?: number
        }
        Update: {
          id?: string
          position?: number
          project_id?: string
          storage_path?: string
          trim_end_ms?: number
          trim_start_ms?: number
        }
        Relationships: [
          {
            foreignKeyName: "video_clips_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "video_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      video_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          removed_at: string | null
          video_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          removed_at?: string | null
          video_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          removed_at?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_likes: {
        Row: {
          created_at: string
          profile_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          profile_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          profile_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_likes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_likes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_projects: {
        Row: {
          caption: string
          created_at: string
          creator_id: string
          id: string
          status: string
          template: string | null
          title: string
        }
        Insert: {
          caption?: string
          created_at?: string
          creator_id: string
          id?: string
          status?: string
          template?: string | null
          title: string
        }
        Update: {
          caption?: string
          created_at?: string
          creator_id?: string
          id?: string
          status?: string
          template?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_projects_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      video_saves: {
        Row: {
          created_at: string
          profile_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          profile_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          profile_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_saves_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_saves_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          caption: string
          creator_id: string
          duration_ms: number
          id: string
          playback_url: string
          processing_status: string
          project_id: string
          provider_asset_id: string
          published_at: string
          removed_at: string | null
          thumbnail_url: string | null
          visibility: string
        }
        Insert: {
          caption?: string
          creator_id: string
          duration_ms: number
          id?: string
          playback_url: string
          processing_status: string
          project_id: string
          provider_asset_id: string
          published_at?: string
          removed_at?: string | null
          thumbnail_url?: string | null
          visibility?: string
        }
        Update: {
          caption?: string
          creator_id?: string
          duration_ms?: number
          id?: string
          playback_url?: string
          processing_status?: string
          project_id?: string
          provider_asset_id?: string
          published_at?: string
          removed_at?: string | null
          thumbnail_url?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "video_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      work_activity: {
        Row: {
          activity_date: string
          id: string
          profile_id: string
          proof_level: string
          recorded_at: string
          source_booking_id: string | null
          source_video_id: string | null
          timezone: string
        }
        Insert: {
          activity_date: string
          id?: string
          profile_id: string
          proof_level: string
          recorded_at?: string
          source_booking_id?: string | null
          source_video_id?: string | null
          timezone: string
        }
        Update: {
          activity_date?: string
          id?: string
          profile_id?: string
          proof_level?: string
          recorded_at?: string
          source_booking_id?: string | null
          source_video_id?: string | null
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_activity_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_activity_source_booking_id_fkey"
            columns: ["source_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_activity_source_video_id_fkey"
            columns: ["source_video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      company_workforce: {
        Row: {
          company_id: string | null
          current_people: number | null
          verified_people_ever: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employment_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      profile_ratings: {
        Row: {
          average_rating: number | null
          review_count: number | null
          subject_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      verified_companies: {
        Row: {
          company_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_verifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["profile_id"]
          },
        ]
      }
    }
    Functions: {
      jobin_work_options: {Args:Record<string,never>;Returns:Json}
      jobin_safety_status: { Args:Record<string, never>;Returns:Json }
      jobin_public_trust_mark: { Args:{worker:string};Returns:Json }
      jobin_request_work_live: { Args:{title:string;profession:string;activity:string;employer?:string;visibility?:string;consent?:boolean};Returns:string }
      jobin_submit_work_video: { Args:{title:string;profession:string;activity:string;path:string;start_ms:number;end_ms:number;employer?:string;consent?:boolean};Returns:string }
      jobin_end_work_live: { Args:{media:string};Returns:undefined }
      jobin_report_employer: { Args:{media:string;path:string;description:string};Returns:string }
      jobin_review_employer_report: { Args:{report:string;uphold:boolean;reason:string;incident_time?:string};Returns:undefined }
      jobin_appeal_safety: { Args:{incident:string;reason:string};Returns:string }
      jobin_review_safety_appeal: { Args:{appeal:string;accept:boolean;reason:string};Returns:undefined }
      jobin_confirm_held_media: { Args:{media:string;category:string;reason:string};Returns:undefined }
      jobin_safety_review_queue: { Args:Record<string, never>;Returns:Json }
      jobin_my_work_media: { Args:Record<string, never>;Returns:Json }
      jobin_work_media: { Args:{media:string};Returns:Json }
      jobin_published_work_media: { Args:Record<string, never>;Returns:Json }
      jobin_approve_employment: { Args: { record: string }; Returns: undefined }
      jobin_attach_company_document: {
        Args: {
          authority: string
          expires: string
          kind: string
          number: string
          path: string
          request: string
        }
        Returns: string
      }
      jobin_card: {
        Args: { profile: string }
        Returns: {
          avatar_path: string
          average_rating: number
          card_status: string
          current_employer: string
          display_name: string
          experience_years: number
          licensed: boolean
          profession: string
          profile_id: string
          review_count: number
          student_program: string
        }[]
      }
      jobin_career_search: {
        Args: { city: string; mode: string; profession: string }
        Returns: Json
      }
      jobin_claim_employment: {
        Args: { company: string; start_date: string; title: string }
        Returns: string
      }
      jobin_contact_career: {
        Args: {
          kind: string
          message: string
          profession: string
          target: string
        }
        Returns: string
      }
      jobin_create_photo_post: {
        Args: { caption: string; paths: string[] }
        Returns: string
      }
      jobin_credential_queue: {
        Args: { status_filter?: string }
        Returns: Json
      }
      jobin_decide_credential: {
        Args: { approve: boolean; reason: string; request: string }
        Returns: undefined
      }
      jobin_decide_impersonation: {
        Args: { report: string; uphold: boolean }
        Returns: undefined
      }
      jobin_decide_license: {
        Args: { approve: boolean; license: string }
        Returns: undefined
      }
      jobin_define_rank: {
        Args: {
          label: string
          ordinal: number
          profession: string
          short_label: string
        }
        Returns: string
      }
      jobin_dispute_review: {
        Args: { reason: string; review: string }
        Returns: string
      }
      jobin_education_options: { Args: { profession: string }; Returns: Json }
      jobin_end_employment: {
        Args: { end_date: string; record: string }
        Returns: undefined
      }
      jobin_express_interest: {
        Args: { mode: string; target: string }
        Returns: string
      }
      jobin_grant_rank: {
        Args: { rank: string; worker: string }
        Returns: undefined
      }
      jobin_jcard_data: { Args: { target?: string }; Returns: Json }
      jobin_organization_data: { Args: { target?: string }; Returns: Json }
      jobin_professional_catalog: { Args: never; Returns: Json }
      jobin_professional_workspace: { Args: never; Returns: Json }
      jobin_remove_unverified_profession: {
        Args: { profession: string }
        Returns: undefined
      }
      jobin_report_impersonation: {
        Args: { accused: string; evidence: string; live: string }
        Returns: string
      }
      jobin_request_review_extension: {
        Args: { months: number; worker: string }
        Returns: string
      }
      jobin_request_verification: {
        Args: { industry: string; municipality: string; state: string }
        Returns: string
      }
      jobin_respond_career: {
        Args: { contact: string; decision: string }
        Returns: undefined
      }
      jobin_respond_review_extension: {
        Args: { accept: boolean; request: string }
        Returns: undefined
      }
      jobin_save_jcard: {
        Args: {
          availability: string
          city: string
          handle: string
          languages: Json
          legal_name: string
          region: string
        }
        Returns: undefined
      }
      jobin_send_jobin_card: { Args: { client: string }; Returns: string }
      jobin_set_organization_kind: {
        Args: { kind: string }
        Returns: undefined
      }
      jobin_set_profession: {
        Args: {
          institution?: string
          make_primary?: boolean
          profession: string
          training: string
        }
        Returns: string
      }
      jobin_set_representative: {
        Args: { approved: boolean; employment: string }
        Returns: undefined
      }
      jobin_set_scope_active: {
        Args: { enabled: boolean; organization: string; profession: string }
        Returns: undefined
      }
      jobin_start_live: {
        Args: {
          consent: boolean
          purpose: string
          title: string
          visibility: string
        }
        Returns: string
      }
      jobin_submit_credential: {
        Args: { path: string; profession: string }
        Returns: string
      }
      jobin_submit_license: {
        Args: { storage_path: string; valid_until: string }
        Returns: string
      }
      jobin_submit_review: {
        Args: {
          body: string
          booking: string
          contract: string
          photos?: string[]
          stars: number
        }
        Returns: string
      }
      jobin_verify_training: {
        Args: { approve: boolean; person_profession: string }
        Returns: undefined
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
