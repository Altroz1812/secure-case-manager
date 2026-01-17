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
          captured_at: string | null
          created_at: string
          file_name: string
          file_type: string | null
          id: string
          latitude: number | null
          longitude: number | null
          remarks: string | null
          storage_path: string
          task_id: string
          uploaded_by: string
        }
        Insert: {
          captured_at?: string | null
          created_at?: string
          file_name: string
          file_type?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          remarks?: string | null
          storage_path: string
          task_id: string
          uploaded_by: string
        }
        Update: {
          captured_at?: string | null
          created_at?: string
          file_name?: string
          file_type?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          remarks?: string | null
          storage_path?: string
          task_id?: string
          uploaded_by?: string
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
      generate_lead_number: { Args: never; Returns: string }
      generate_task_number: { Args: never; Returns: string }
      get_user_branches: { Args: { _user_id: string }; Returns: string[] }
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "intake"
        | "analyst"
        | "field_executive"
        | "qc"
        | "ops_manager"
        | "client_viewer"
      fe_skill: "residential" | "business" | "end_use"
      priority_level: "normal" | "urgent"
      task_status:
        | "pending"
        | "assigned"
        | "in_progress"
        | "completed"
        | "qc_review"
        | "approved"
        | "rejected"
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
      app_role: [
        "admin",
        "intake",
        "analyst",
        "field_executive",
        "qc",
        "ops_manager",
        "client_viewer",
      ],
      fe_skill: ["residential", "business", "end_use"],
      priority_level: ["normal", "urgent"],
      task_status: [
        "pending",
        "assigned",
        "in_progress",
        "completed",
        "qc_review",
        "approved",
        "rejected",
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
