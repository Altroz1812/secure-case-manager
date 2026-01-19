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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      applicant_addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          address_type: Database["public"]["Enums"]["address_type"]
          applicant_id: string
          city: string
          created_at: string
          id: string
          is_primary: boolean
          landmark: string | null
          latitude: number | null
          longitude: number | null
          ownership_type: string | null
          pincode: string
          state: string
          updated_at: string
          years_at_address: number | null
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          address_type?: Database["public"]["Enums"]["address_type"]
          applicant_id: string
          city: string
          created_at?: string
          id?: string
          is_primary?: boolean
          landmark?: string | null
          latitude?: number | null
          longitude?: number | null
          ownership_type?: string | null
          pincode: string
          state: string
          updated_at?: string
          years_at_address?: number | null
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          address_type?: Database["public"]["Enums"]["address_type"]
          applicant_id?: string
          city?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          landmark?: string | null
          latitude?: number | null
          longitude?: number | null
          ownership_type?: string | null
          pincode?: string
          state?: string
          updated_at?: string
          years_at_address?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "applicant_addresses_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "lead_applicants"
            referencedColumns: ["id"]
          },
        ]
      }
      applicant_documents: {
        Row: {
          applicant_id: string
          created_at: string
          document_number: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_size: number | null
          file_type: string | null
          id: string
          is_verified: boolean | null
          storage_path: string
          uploaded_by: string
          verification_remarks: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          applicant_id: string
          created_at?: string
          document_number?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_verified?: boolean | null
          storage_path: string
          uploaded_by: string
          verification_remarks?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          applicant_id?: string
          created_at?: string
          document_number?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_verified?: boolean | null
          storage_path?: string
          uploaded_by?: string
          verification_remarks?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applicant_documents_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "lead_applicants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          branch_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          branch_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          branch_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          branch_email: string | null
          city: string
          code: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          serviceable_pincodes: string[] | null
          state: string
          updated_at: string
        }
        Insert: {
          branch_email?: string | null
          city: string
          code: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          serviceable_pincodes?: string[] | null
          state: string
          updated_at?: string
        }
        Update: {
          branch_email?: string | null
          city?: string
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          serviceable_pincodes?: string[] | null
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_branches: {
        Row: {
          branch_id: string
          client_id: string
          created_at: string
          id: string
        }
        Insert: {
          branch_id: string
          client_id: string
          created_at?: string
          id?: string
        }
        Update: {
          branch_id?: string
          client_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_branches_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_branches_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_documents: {
        Row: {
          created_at: string
          document_type: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          id: string
          lead_id: string
          remarks: string | null
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          document_type?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          lead_id: string
          remarks?: string | null
          storage_path: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          document_type?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          lead_id?: string
          remarks?: string | null
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_documents_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      client_products: {
        Row: {
          client_id: string
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_products_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      client_report_configs: {
        Row: {
          client_id: string
          config_name: string
          created_at: string
          field_mappings: Json | null
          header_config: Json | null
          id: string
          is_active: boolean | null
          report_type: string
          template_config: Json
          updated_at: string
        }
        Insert: {
          client_id: string
          config_name: string
          created_at?: string
          field_mappings?: Json | null
          header_config?: Json | null
          id?: string
          is_active?: boolean | null
          report_type: string
          template_config?: Json
          updated_at?: string
        }
        Update: {
          client_id?: string
          config_name?: string
          created_at?: string
          field_mappings?: Json | null
          header_config?: Json | null
          id?: string
          is_active?: boolean | null
          report_type?: string
          template_config?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_report_configs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_user_assignments: {
        Row: {
          client_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_user_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          code: string
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_attachments: {
        Row: {
          created_at: string
          email_id: string
          file_name: string
          file_size: number | null
          file_type: string | null
          id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          email_id: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          storage_path: string
        }
        Update: {
          created_at?: string
          email_id?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_attachments_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "emails"
            referencedColumns: ["id"]
          },
        ]
      }
      emails: {
        Row: {
          body_html: string | null
          body_preview: string | null
          branch_id: string | null
          created_at: string
          external_id: string | null
          id: string
          is_processed: boolean | null
          processed_at: string | null
          processed_by: string | null
          received_at: string
          recipient_email: string | null
          sender_email: string
          sender_name: string | null
          subject: string
        }
        Insert: {
          body_html?: string | null
          body_preview?: string | null
          branch_id?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          is_processed?: boolean | null
          processed_at?: string | null
          processed_by?: string | null
          received_at: string
          recipient_email?: string | null
          sender_email: string
          sender_name?: string | null
          subject: string
        }
        Update: {
          body_html?: string | null
          body_preview?: string | null
          branch_id?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          is_processed?: boolean | null
          processed_at?: string | null
          processed_by?: string | null
          received_at?: string
          recipient_email?: string | null
          sender_email?: string
          sender_name?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "emails_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_validation_logs: {
        Row: {
          created_at: string
          details: Json | null
          evidence_id: string
          id: string
          passed: boolean
          validation_type: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          evidence_id: string
          id?: string
          passed: boolean
          validation_type: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          evidence_id?: string
          id?: string
          passed?: boolean
          validation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_validation_logs_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "task_evidence"
            referencedColumns: ["id"]
          },
        ]
      }
      field_executives: {
        Row: {
          created_at: string
          current_workload: number | null
          employee_code: string
          id: string
          is_available: boolean | null
          mapped_pincodes: string[] | null
          max_workload: number | null
          skills: Database["public"]["Enums"]["fe_skill"][] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_workload?: number | null
          employee_code: string
          id?: string
          is_available?: boolean | null
          mapped_pincodes?: string[] | null
          max_workload?: number | null
          skills?: Database["public"]["Enums"]["fe_skill"][] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_workload?: number | null
          employee_code?: string
          id?: string
          is_available?: boolean | null
          mapped_pincodes?: string[] | null
          max_workload?: number | null
          skills?: Database["public"]["Enums"]["fe_skill"][] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      generated_reports: {
        Row: {
          created_at: string
          generated_at: string
          generated_by: string
          id: string
          lead_id: string | null
          report_data: Json
          report_type: string
          storage_path: string | null
          task_id: string | null
          version: number
        }
        Insert: {
          created_at?: string
          generated_at?: string
          generated_by: string
          id?: string
          lead_id?: string | null
          report_data: Json
          report_type: string
          storage_path?: string | null
          task_id?: string | null
          version?: number
        }
        Update: {
          created_at?: string
          generated_at?: string
          generated_by?: string
          id?: string
          lead_id?: string | null
          report_data?: Json
          report_type?: string
          storage_path?: string | null
          task_id?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "generated_reports_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_reports_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_applicants: {
        Row: {
          aadhar_number: string | null
          applicant_type: Database["public"]["Enums"]["applicant_type"]
          created_at: string
          date_of_birth: string | null
          email: string | null
          employer_name: string | null
          id: string
          is_primary: boolean
          lead_id: string
          monthly_income: number | null
          name: string
          occupation: string | null
          pan_number: string | null
          phone: string | null
          relation_to_primary: string | null
          updated_at: string
        }
        Insert: {
          aadhar_number?: string | null
          applicant_type?: Database["public"]["Enums"]["applicant_type"]
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          employer_name?: string | null
          id?: string
          is_primary?: boolean
          lead_id: string
          monthly_income?: number | null
          name: string
          occupation?: string | null
          pan_number?: string | null
          phone?: string | null
          relation_to_primary?: string | null
          updated_at?: string
        }
        Update: {
          aadhar_number?: string | null
          applicant_type?: Database["public"]["Enums"]["applicant_type"]
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          employer_name?: string | null
          id?: string
          is_primary?: boolean
          lead_id?: string
          monthly_income?: number | null
          name?: string
          occupation?: string | null
          pan_number?: string | null
          phone?: string | null
          relation_to_primary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_applicants_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_duplicates: {
        Row: {
          created_at: string
          duplicate_lead_id: string | null
          id: string
          is_overridden: boolean | null
          match_score: number | null
          match_type: string
          original_lead_id: string
          overridden_by: string | null
          override_reason: string | null
        }
        Insert: {
          created_at?: string
          duplicate_lead_id?: string | null
          id?: string
          is_overridden?: boolean | null
          match_score?: number | null
          match_type: string
          original_lead_id: string
          overridden_by?: string | null
          override_reason?: string | null
        }
        Update: {
          created_at?: string
          duplicate_lead_id?: string | null
          id?: string
          is_overridden?: boolean | null
          match_score?: number | null
          match_type?: string
          original_lead_id?: string
          overridden_by?: string | null
          override_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_duplicates_duplicate_lead_id_fkey"
            columns: ["duplicate_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_duplicates_original_lead_id_fkey"
            columns: ["original_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          applicant_name: string
          application_number: string | null
          branch_id: string
          client_branch_id: string | null
          client_id: string
          created_at: string
          created_by: string
          email_id: string | null
          id: string
          lead_number: string
          loan_number: string | null
          pincode: string | null
          priority: Database["public"]["Enums"]["priority_level"] | null
          product_id: string
          updated_at: string
          verification_types: Database["public"]["Enums"]["verification_type"][]
        }
        Insert: {
          address?: string | null
          applicant_name: string
          application_number?: string | null
          branch_id: string
          client_branch_id?: string | null
          client_id: string
          created_at?: string
          created_by: string
          email_id?: string | null
          id?: string
          lead_number: string
          loan_number?: string | null
          pincode?: string | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          product_id: string
          updated_at?: string
          verification_types?: Database["public"]["Enums"]["verification_type"][]
        }
        Update: {
          address?: string | null
          applicant_name?: string
          application_number?: string | null
          branch_id?: string
          client_branch_id?: string | null
          client_id?: string
          created_at?: string
          created_by?: string
          email_id?: string | null
          id?: string
          lead_number?: string
          loan_number?: string | null
          pincode?: string | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          product_id?: string
          updated_at?: string
          verification_types?: Database["public"]["Enums"]["verification_type"][]
        }
        Relationships: [
          {
            foreignKeyName: "leads_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_client_branch_id_fkey"
            columns: ["client_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "emails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      message_queue: {
        Row: {
          channel: string
          created_at: string
          delivered_at: string | null
          error_message: string | null
          external_message_id: string | null
          id: string
          max_retries: number | null
          notification_id: string | null
          payload: Json
          recipient_email: string | null
          recipient_phone: string | null
          recipient_user_id: string
          retry_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          status: string
          template_id: string | null
          updated_at: string
        }
        Insert: {
          channel: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          external_message_id?: string | null
          id?: string
          max_retries?: number | null
          notification_id?: string | null
          payload?: Json
          recipient_email?: string | null
          recipient_phone?: string | null
          recipient_user_id: string
          retry_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          external_message_id?: string | null
          id?: string
          max_retries?: number | null
          notification_id?: string | null
          payload?: Json
          recipient_email?: string | null
          recipient_phone?: string | null
          recipient_user_id?: string
          retry_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_queue_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_queue_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          daily_digest_enabled: boolean | null
          email_enabled: boolean | null
          id: string
          in_app_enabled: boolean | null
          qc_result_enabled: boolean | null
          reassignment_enabled: boolean | null
          sla_warning_enabled: boolean | null
          sms_enabled: boolean | null
          task_assignment_enabled: boolean | null
          updated_at: string
          user_id: string
          whatsapp_enabled: boolean | null
        }
        Insert: {
          created_at?: string
          daily_digest_enabled?: boolean | null
          email_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          qc_result_enabled?: boolean | null
          reassignment_enabled?: boolean | null
          sla_warning_enabled?: boolean | null
          sms_enabled?: boolean | null
          task_assignment_enabled?: boolean | null
          updated_at?: string
          user_id: string
          whatsapp_enabled?: boolean | null
        }
        Update: {
          created_at?: string
          daily_digest_enabled?: boolean | null
          email_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          qc_result_enabled?: boolean | null
          reassignment_enabled?: boolean | null
          sla_warning_enabled?: boolean | null
          sms_enabled?: boolean | null
          task_assignment_enabled?: boolean | null
          updated_at?: string
          user_id?: string
          whatsapp_enabled?: boolean | null
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          body_template: string
          channel: string
          created_at: string
          id: string
          is_active: boolean | null
          subject: string | null
          template_code: string | null
          template_name: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          body_template: string
          channel: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          subject?: string | null
          template_code?: string | null
          template_name: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          body_template?: string
          channel?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          subject?: string | null
          template_code?: string | null
          template_name?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      observation_tags: {
        Row: {
          applicable_verification_types: Database["public"]["Enums"]["verification_type"][]
          category: Database["public"]["Enums"]["observation_category"]
          created_at: string
          id: string
          is_active: boolean | null
          severity_weight: number | null
          tag_code: string
          tag_label: string
          updated_at: string
        }
        Insert: {
          applicable_verification_types?: Database["public"]["Enums"]["verification_type"][]
          category: Database["public"]["Enums"]["observation_category"]
          created_at?: string
          id?: string
          is_active?: boolean | null
          severity_weight?: number | null
          tag_code: string
          tag_label: string
          updated_at?: string
        }
        Update: {
          applicable_verification_types?: Database["public"]["Enums"]["verification_type"][]
          category?: Database["public"]["Enums"]["observation_category"]
          created_at?: string
          id?: string
          is_active?: boolean | null
          severity_weight?: number | null
          tag_code?: string
          tag_label?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      remark_templates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          remark_type: Database["public"]["Enums"]["remark_type"]
          requires_free_text: boolean | null
          template_text: string
          updated_at: string
          verification_type: Database["public"]["Enums"]["verification_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          remark_type: Database["public"]["Enums"]["remark_type"]
          requires_free_text?: boolean | null
          template_text: string
          updated_at?: string
          verification_type: Database["public"]["Enums"]["verification_type"]
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          remark_type?: Database["public"]["Enums"]["remark_type"]
          requires_free_text?: boolean | null
          template_text?: string
          updated_at?: string
          verification_type?: Database["public"]["Enums"]["verification_type"]
        }
        Relationships: []
      }
      task_assignments: {
        Row: {
          assigned_by: string
          assigned_from: string | null
          assigned_to: string
          created_at: string
          id: string
          is_override: boolean | null
          reason: string | null
          task_id: string
        }
        Insert: {
          assigned_by: string
          assigned_from?: string | null
          assigned_to: string
          created_at?: string
          id?: string
          is_override?: boolean | null
          reason?: string | null
          task_id: string
        }
        Update: {
          assigned_by?: string
          assigned_from?: string | null
          assigned_to?: string
          created_at?: string
          id?: string
          is_override?: boolean | null
          reason?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_evidence: {
        Row: {
          address_watermark: string | null
          captured_at: string | null
          created_at: string
          exif_data: Json | null
          expected_latitude: number | null
          expected_longitude: number | null
          file_name: string
          file_type: string | null
          geo_deviation_flagged: boolean | null
          geo_deviation_meters: number | null
          id: string
          is_validated: boolean | null
          latitude: number | null
          longitude: number | null
          remarks: string | null
          storage_path: string
          task_id: string
          uploaded_by: string
          validated_at: string | null
          validated_by: string | null
          validation_errors: string[] | null
          validation_status: string | null
        }
        Insert: {
          address_watermark?: string | null
          captured_at?: string | null
          created_at?: string
          exif_data?: Json | null
          expected_latitude?: number | null
          expected_longitude?: number | null
          file_name: string
          file_type?: string | null
          geo_deviation_flagged?: boolean | null
          geo_deviation_meters?: number | null
          id?: string
          is_validated?: boolean | null
          latitude?: number | null
          longitude?: number | null
          remarks?: string | null
          storage_path: string
          task_id: string
          uploaded_by: string
          validated_at?: string | null
          validated_by?: string | null
          validation_errors?: string[] | null
          validation_status?: string | null
        }
        Update: {
          address_watermark?: string | null
          captured_at?: string | null
          created_at?: string
          exif_data?: Json | null
          expected_latitude?: number | null
          expected_longitude?: number | null
          file_name?: string
          file_type?: string | null
          geo_deviation_flagged?: boolean | null
          geo_deviation_meters?: number | null
          id?: string
          is_validated?: boolean | null
          latitude?: number | null
          longitude?: number | null
          remarks?: string | null
          storage_path?: string
          task_id?: string
          uploaded_by?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_errors?: string[] | null
          validation_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_evidence_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_verification_data: {
        Row: {
          checklist_responses: Json
          created_at: string
          free_text_remark: string | null
          id: string
          observation_tag_ids: string[]
          remark_template_id: string | null
          remark_type: Database["public"]["Enums"]["remark_type"] | null
          structured_remark: string | null
          target_address_id: string | null
          target_applicant_id: string | null
          task_id: string
          updated_at: string
          verification_methods: Database["public"]["Enums"]["verification_method_type"][]
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          checklist_responses?: Json
          created_at?: string
          free_text_remark?: string | null
          id?: string
          observation_tag_ids?: string[]
          remark_template_id?: string | null
          remark_type?: Database["public"]["Enums"]["remark_type"] | null
          structured_remark?: string | null
          target_address_id?: string | null
          target_applicant_id?: string | null
          task_id: string
          updated_at?: string
          verification_methods?: Database["public"]["Enums"]["verification_method_type"][]
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          checklist_responses?: Json
          created_at?: string
          free_text_remark?: string | null
          id?: string
          observation_tag_ids?: string[]
          remark_template_id?: string | null
          remark_type?: Database["public"]["Enums"]["remark_type"] | null
          structured_remark?: string | null
          target_address_id?: string | null
          target_applicant_id?: string | null
          task_id?: string
          updated_at?: string
          verification_methods?: Database["public"]["Enums"]["verification_method_type"][]
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_verification_data_remark_template_id_fkey"
            columns: ["remark_template_id"]
            isOneToOne: false
            referencedRelation: "remark_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_verification_data_target_address_id_fkey"
            columns: ["target_address_id"]
            isOneToOne: false
            referencedRelation: "applicant_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_verification_data_target_applicant_id_fkey"
            columns: ["target_applicant_id"]
            isOneToOne: false
            referencedRelation: "lead_applicants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_verification_data_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: true
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          branch_id: string
          completed_at: string | null
          created_at: string
          final_remarks: string | null
          id: string
          is_overdue: boolean | null
          lead_id: string
          qc_remarks: string | null
          qc_reviewed_at: string | null
          qc_reviewed_by: string | null
          sla_deadline: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          task_number: string
          updated_at: string
          verification_type: Database["public"]["Enums"]["verification_type"]
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          branch_id: string
          completed_at?: string | null
          created_at?: string
          final_remarks?: string | null
          id?: string
          is_overdue?: boolean | null
          lead_id: string
          qc_remarks?: string | null
          qc_reviewed_at?: string | null
          qc_reviewed_by?: string | null
          sla_deadline?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          task_number: string
          updated_at?: string
          verification_type: Database["public"]["Enums"]["verification_type"]
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          branch_id?: string
          completed_at?: string | null
          created_at?: string
          final_remarks?: string | null
          id?: string
          is_overdue?: boolean | null
          lead_id?: string
          qc_remarks?: string | null
          qc_reviewed_at?: string | null
          qc_reviewed_by?: string | null
          sla_deadline?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          task_number?: string
          updated_at?: string
          verification_type?: Database["public"]["Enums"]["verification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "tasks_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      user_branch_assignments: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          is_primary: boolean | null
          user_id: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          user_id: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_branch_assignments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_screen_permissions: {
        Row: {
          created_at: string
          id: string
          is_allowed: boolean
          screen_name: string
          screen_path: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_allowed?: boolean
          screen_name: string
          screen_path: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_allowed?: boolean
          screen_name?: string
          screen_path?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      verification_checklist_items: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          is_mandatory: boolean | null
          item_code: string
          item_description: string | null
          item_label: string
          updated_at: string
          verification_type: Database["public"]["Enums"]["verification_type"]
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          item_code: string
          item_description?: string | null
          item_label: string
          updated_at?: string
          verification_type: Database["public"]["Enums"]["verification_type"]
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          item_code?: string
          item_description?: string | null
          item_label?: string
          updated_at?: string
          verification_type?: Database["public"]["Enums"]["verification_type"]
        }
        Relationships: []
      }
      verification_methods: {
        Row: {
          applicable_verification_types: Database["public"]["Enums"]["verification_type"][]
          created_at: string
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          is_field_method: boolean | null
          method_type: Database["public"]["Enums"]["verification_method_type"]
          updated_at: string
        }
        Insert: {
          applicable_verification_types?: Database["public"]["Enums"]["verification_type"][]
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          is_field_method?: boolean | null
          method_type: Database["public"]["Enums"]["verification_method_type"]
          updated_at?: string
        }
        Update: {
          applicable_verification_types?: Database["public"]["Enums"]["verification_type"][]
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          is_field_method?: boolean | null
          method_type?: Database["public"]["Enums"]["verification_method_type"]
          updated_at?: string
        }
        Relationships: []
      }
      verification_type_config: {
        Row: {
          created_at: string
          display_name: string
          id: string
          is_active: boolean | null
          is_field_verification: boolean | null
          sla_hours: number
          type: Database["public"]["Enums"]["verification_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean | null
          is_field_verification?: boolean | null
          sla_hours?: number
          type: Database["public"]["Enums"]["verification_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean | null
          is_field_verification?: boolean | null
          sla_hours?: number
          type?: Database["public"]["Enums"]["verification_type"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_reassign_task: { Args: { p_user_id: string }; Returns: boolean }
      check_lead_duplicates: {
        Args: {
          _applicant_name: string
          _application_number?: string
          _client_id: string
          _time_window_hours?: number
        }
        Returns: {
          applicant_name: string
          application_number: string
          created_at: string
          lead_id: string
          lead_number: string
          match_score: number
          match_type: string
        }[]
      }
      find_best_field_executive: {
        Args: {
          p_branch_id: string
          p_pincode: string
          p_verification_type: Database["public"]["Enums"]["verification_type"]
        }
        Returns: string
      }
      generate_lead_number: { Args: never; Returns: string }
      generate_task_number: { Args: never; Returns: string }
      get_branch_by_email: {
        Args: { _recipient_email: string }
        Returns: string
      }
      get_sla_hours: {
        Args: {
          p_verification_type: Database["public"]["Enums"]["verification_type"]
        }
        Returns: number
      }
      get_user_branches: { Args: { _user_id: string }; Returns: string[] }
      get_user_clients: { Args: { _user_id: string }; Returns: string[] }
      get_user_primary_branch: { Args: { _user_id: string }; Returns: string }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_branch_access: {
        Args: { _branch_id: string; _user_id: string }
        Returns: boolean
      }
      has_client_access: {
        Args: { _client_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_screen_access: {
        Args: { _screen_path: string; _user_id: string }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      address_type: "residence" | "office" | "permanent" | "correspondence"
      app_role:
        | "admin"
        | "intake"
        | "analyst"
        | "field_executive"
        | "qc"
        | "ops_manager"
        | "client_viewer"
      applicant_type: "primary" | "co_applicant" | "guarantor"
      document_type:
        | "pan"
        | "aadhar"
        | "passport"
        | "voter_id"
        | "driving_license"
        | "bank_statement"
        | "itr"
        | "salary_slip"
        | "form_16"
        | "property_docs"
        | "business_registration"
        | "gst_certificate"
        | "utility_bill"
        | "rent_agreement"
        | "other"
      fe_skill: "residential" | "business" | "end_use"
      observation_category:
        | "positive"
        | "negative"
        | "neutral"
        | "discrepancy"
        | "unverifiable"
      priority_level: "normal" | "urgent"
      remark_type:
        | "positive_confirmed"
        | "negative_not_found"
        | "negative_discrepancy"
        | "negative_uncontactable"
        | "refer_for_review"
        | "partial_verification"
      task_status:
        | "pending"
        | "assigned"
        | "in_progress"
        | "completed"
        | "qc_review"
        | "approved"
        | "rejected"
      verification_method_type:
        | "physical_visit"
        | "telephonic"
        | "video_call"
        | "document_based"
        | "api_check"
        | "neighbor_check"
        | "employer_check"
      verification_type:
        | "profile"
        | "bgv"
        | "residential"
        | "business"
        | "itr"
        | "bank"
        | "property"
        | "end_use"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      address_type: ["residence", "office", "permanent", "correspondence"],
      app_role: [
        "admin",
        "intake",
        "analyst",
        "field_executive",
        "qc",
        "ops_manager",
        "client_viewer",
      ],
      applicant_type: ["primary", "co_applicant", "guarantor"],
      document_type: [
        "pan",
        "aadhar",
        "passport",
        "voter_id",
        "driving_license",
        "bank_statement",
        "itr",
        "salary_slip",
        "form_16",
        "property_docs",
        "business_registration",
        "gst_certificate",
        "utility_bill",
        "rent_agreement",
        "other",
      ],
      fe_skill: ["residential", "business", "end_use"],
      observation_category: [
        "positive",
        "negative",
        "neutral",
        "discrepancy",
        "unverifiable",
      ],
      priority_level: ["normal", "urgent"],
      remark_type: [
        "positive_confirmed",
        "negative_not_found",
        "negative_discrepancy",
        "negative_uncontactable",
        "refer_for_review",
        "partial_verification",
      ],
      task_status: [
        "pending",
        "assigned",
        "in_progress",
        "completed",
        "qc_review",
        "approved",
        "rejected",
      ],
      verification_method_type: [
        "physical_visit",
        "telephonic",
        "video_call",
        "document_based",
        "api_check",
        "neighbor_check",
        "employer_check",
      ],
      verification_type: [
        "profile",
        "bgv",
        "residential",
        "business",
        "itr",
        "bank",
        "property",
        "end_use",
      ],
    },
  },
} as const
