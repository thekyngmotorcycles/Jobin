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
      jobin_professional_catalog: { Args: Record<string, never>; Returns: Json }
      jobin_jcard_data: { Args: { target?: string | null }; Returns: Json }
      jobin_professional_workspace: { Args: Record<string, never>; Returns: Json }
      jobin_save_jcard: { Args: { legal_name:string; handle:string; languages:Json; availability:string; city:string; region:string }; Returns: undefined }
      jobin_set_profession: { Args: { profession:string; training:string; institution?:string|null; make_primary?:boolean }; Returns: string }
      jobin_remove_unverified_profession: { Args: { profession:string }; Returns: undefined }
      jobin_set_organization_kind: { Args: { kind:string }; Returns: undefined }
      jobin_submit_credential: { Args: { profession:string; path:string }; Returns: string }
      jobin_decide_credential: { Args: { request:string; approve:boolean; reason:string }; Returns: undefined }
      jobin_set_scope_active: { Args: { organization:string; profession:string; enabled:boolean }; Returns: undefined }
      jobin_verify_training: { Args: { person_profession:string; approve:boolean }; Returns: undefined }
      jobin_define_rank: { Args: { profession:string; label:string; short_label:string; ordinal:number }; Returns: string }
      jobin_grant_rank: { Args: { worker:string; rank:string }; Returns: undefined }
      jobin_set_representative: { Args: { employment:string; approved:boolean }; Returns: undefined }
      jobin_credential_queue: { Args: Record<string, never>; Returns: Json }
      jobin_education_options: { Args: { profession:string }; Returns: Json }
      jobin_organization_data: { Args: { target?:string|null }; Returns: Json }
      jobin_career_search: { Args: { profession:string; city:string; mode:string }; Returns: Json }
      jobin_contact_career: { Args: { target:string; profession:string; kind:string; message:string }; Returns: string }
      jobin_respond_career: { Args: { contact:string; decision:string }; Returns: undefined }
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
      jobin_claim_employment: {
        Args: { company: string; start_date: string; title: string }
        Returns: string
      }
      jobin_dispute_review: {
        Args: { reason: string; review: string }
        Returns: string
      }
      jobin_end_employment: {
        Args: { end_date: string; record: string }
        Returns: undefined
      }
      jobin_express_interest: {
        Args: { mode: string; target: string }
        Returns: string
      }
      jobin_request_verification: {
        Args: { industry: string; municipality: string; state: string }
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
