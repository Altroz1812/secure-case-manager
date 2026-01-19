import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type VerificationMethodType = Database["public"]["Enums"]["verification_method_type"];
type VerificationType = Database["public"]["Enums"]["verification_type"];
type ObservationCategory = Database["public"]["Enums"]["observation_category"];
type RemarkType = Database["public"]["Enums"]["remark_type"];

export interface VerificationMethod {
  id: string;
  method_type: VerificationMethodType;
  display_name: string;
  description: string | null;
  applicable_verification_types: VerificationType[];
  is_field_method: boolean | null;
  is_active: boolean | null;
}

export interface ChecklistItem {
  id: string;
  verification_type: VerificationType;
  item_code: string;
  item_label: string;
  item_description: string | null;
  is_mandatory: boolean | null;
  display_order: number | null;
  is_active: boolean | null;
}

export interface ObservationTag {
  id: string;
  tag_code: string;
  tag_label: string;
  category: ObservationCategory;
  applicable_verification_types: VerificationType[];
  severity_weight: number | null;
  is_active: boolean | null;
}

export interface RemarkTemplate {
  id: string;
  verification_type: VerificationType;
  remark_type: RemarkType;
  template_text: string;
  requires_free_text: boolean | null;
  is_active: boolean | null;
}

export interface TaskVerificationData {
  id: string;
  task_id: string;
  verification_methods: VerificationMethodType[];
  checklist_responses: Record<string, boolean>;
  observation_tag_ids: string[];
  remark_type: RemarkType | null;
  remark_template_id: string | null;
  structured_remark: string | null;
  free_text_remark: string | null;
  target_applicant_id: string | null;
  target_address_id: string | null;
  verified_by: string | null;
  verified_at: string | null;
}

// Fetch verification methods for a specific verification type
export function useVerificationMethods(verificationType?: VerificationType) {
  return useQuery({
    queryKey: ["verification-methods", verificationType],
    queryFn: async () => {
      let query = supabase
        .from("verification_methods")
        .select("*")
        .eq("is_active", true)
        .order("display_name");

      const { data, error } = await query;
      if (error) throw error;

      // Filter by verification type if provided
      if (verificationType && data) {
        return data.filter((method) =>
          method.applicable_verification_types?.includes(verificationType)
        ) as VerificationMethod[];
      }

      return data as VerificationMethod[];
    },
  });
}

// Fetch checklist items for a specific verification type
export function useChecklistItems(verificationType?: VerificationType) {
  return useQuery({
    queryKey: ["checklist-items", verificationType],
    queryFn: async () => {
      let query = supabase
        .from("verification_checklist_items")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (verificationType) {
        query = query.eq("verification_type", verificationType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ChecklistItem[];
    },
    enabled: !!verificationType,
  });
}

// Fetch observation tags for a specific verification type
export function useObservationTags(verificationType?: VerificationType) {
  return useQuery({
    queryKey: ["observation-tags", verificationType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("observation_tags")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true })
        .order("tag_label", { ascending: true });

      if (error) throw error;

      // Filter by verification type if provided
      if (verificationType && data) {
        return data.filter((tag) =>
          tag.applicable_verification_types?.includes(verificationType)
        ) as ObservationTag[];
      }

      return data as ObservationTag[];
    },
  });
}

// Fetch remark templates for a specific verification type
export function useRemarkTemplates(verificationType?: VerificationType) {
  return useQuery({
    queryKey: ["remark-templates", verificationType],
    queryFn: async () => {
      let query = supabase
        .from("remark_templates")
        .select("*")
        .eq("is_active", true)
        .order("remark_type");

      if (verificationType) {
        query = query.eq("verification_type", verificationType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as RemarkTemplate[];
    },
    enabled: !!verificationType,
  });
}

// Fetch task verification data
export function useTaskVerificationData(taskId?: string) {
  return useQuery({
    queryKey: ["task-verification-data", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_verification_data")
        .select("*")
        .eq("task_id", taskId!)
        .maybeSingle();

      if (error) throw error;
      return data as TaskVerificationData | null;
    },
    enabled: !!taskId,
  });
}

// Save task verification data
export function useSaveVerificationData() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      task_id: string;
      verification_methods: VerificationMethodType[];
      checklist_responses: Record<string, boolean>;
      observation_tag_ids: string[];
      remark_type?: RemarkType;
      remark_template_id?: string;
      structured_remark?: string;
      free_text_remark?: string;
      target_applicant_id?: string;
      target_address_id?: string;
    }) => {
      // Check if verification data already exists
      const { data: existingData } = await supabase
        .from("task_verification_data")
        .select("id")
        .eq("task_id", data.task_id)
        .maybeSingle();

      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;

      if (existingData) {
        // Update existing
        const { error } = await supabase
          .from("task_verification_data")
          .update({
            verification_methods: data.verification_methods,
            checklist_responses: data.checklist_responses,
            observation_tag_ids: data.observation_tag_ids,
            remark_type: data.remark_type,
            remark_template_id: data.remark_template_id,
            structured_remark: data.structured_remark,
            free_text_remark: data.free_text_remark,
            target_applicant_id: data.target_applicant_id,
            target_address_id: data.target_address_id,
            verified_by: userId,
            verified_at: new Date().toISOString(),
          })
          .eq("id", existingData.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase.from("task_verification_data").insert({
          task_id: data.task_id,
          verification_methods: data.verification_methods,
          checklist_responses: data.checklist_responses,
          observation_tag_ids: data.observation_tag_ids,
          remark_type: data.remark_type,
          remark_template_id: data.remark_template_id,
          structured_remark: data.structured_remark,
          free_text_remark: data.free_text_remark,
          target_applicant_id: data.target_applicant_id,
          target_address_id: data.target_address_id,
          verified_by: userId,
          verified_at: new Date().toISOString(),
        });

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["task-verification-data", variables.task_id],
      });
      toast({
        title: "Verification saved",
        description: "Verification data has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving verification",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Get category color for observation tags
export function getObservationCategoryColor(category: ObservationCategory): string {
  switch (category) {
    case "positive":
      return "bg-green-100 text-green-800 border-green-200";
    case "negative":
      return "bg-red-100 text-red-800 border-red-200";
    case "discrepancy":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "unverifiable":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "neutral":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

// Get remark type label
export function getRemarkTypeLabel(remarkType: RemarkType): string {
  const labels: Record<RemarkType, string> = {
    positive_confirmed: "Positive - Confirmed",
    negative_not_found: "Negative - Not Found",
    negative_discrepancy: "Negative - Discrepancy",
    negative_uncontactable: "Negative - Uncontactable",
    refer_for_review: "Refer for Review",
    partial_verification: "Partial Verification",
  };
  return labels[remarkType] || remarkType;
}
