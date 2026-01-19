import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useVerificationMethods,
  useChecklistItems,
  useObservationTags,
  useRemarkTemplates,
  useTaskVerificationData,
  useSaveVerificationData,
} from "@/hooks/useVerificationFramework";
import { VerificationMethodSelect } from "./VerificationMethodSelect";
import { VerificationChecklist } from "./VerificationChecklist";
import { ObservationTagSelect } from "./ObservationTagSelect";
import { StructuredRemarkSection } from "./StructuredRemarkSection";
import type { Database } from "@/integrations/supabase/types";

type VerificationType = Database["public"]["Enums"]["verification_type"];
type VerificationMethodType = Database["public"]["Enums"]["verification_method_type"];
type RemarkType = Database["public"]["Enums"]["remark_type"];

interface VerificationExecutionFormProps {
  taskId: string;
  verificationType: VerificationType;
  onComplete?: () => void;
  disabled?: boolean;
}

export function VerificationExecutionForm({
  taskId,
  verificationType,
  onComplete,
  disabled = false,
}: VerificationExecutionFormProps) {
  const { toast } = useToast();

  // Fetch master data
  const { data: methods, isLoading: methodsLoading } = useVerificationMethods(verificationType);
  const { data: checklistItems, isLoading: checklistLoading } = useChecklistItems(verificationType);
  const { data: observationTags, isLoading: tagsLoading } = useObservationTags(verificationType);
  const { data: remarkTemplates, isLoading: templatesLoading } = useRemarkTemplates(verificationType);
  const { data: existingData, isLoading: existingLoading } = useTaskVerificationData(taskId);

  // Form state
  const [selectedMethods, setSelectedMethods] = useState<VerificationMethodType[]>([]);
  const [checklistResponses, setChecklistResponses] = useState<Record<string, boolean>>({});
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedRemarkType, setSelectedRemarkType] = useState<RemarkType | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [structuredRemark, setStructuredRemark] = useState("");
  const [freeTextRemark, setFreeTextRemark] = useState("");

  const saveVerificationData = useSaveVerificationData();

  // Initialize form with existing data
  useEffect(() => {
    if (existingData) {
      setSelectedMethods(existingData.verification_methods || []);
      setChecklistResponses(
        (existingData.checklist_responses as Record<string, boolean>) || {}
      );
      setSelectedTagIds(existingData.observation_tag_ids || []);
      setSelectedRemarkType(existingData.remark_type || null);
      setSelectedTemplateId(existingData.remark_template_id || null);
      setStructuredRemark(existingData.structured_remark || "");
      setFreeTextRemark(existingData.free_text_remark || "");
    }
  }, [existingData]);

  const isLoading =
    methodsLoading || checklistLoading || tagsLoading || templatesLoading || existingLoading;

  // Validation
  const mandatoryItems = checklistItems?.filter((item) => item.is_mandatory) || [];
  const allMandatoryComplete = mandatoryItems.every(
    (item) => checklistResponses[item.item_code]
  );

  const selectedTags = observationTags?.filter((tag) => selectedTagIds.includes(tag.id)) || [];
  const hasNegativeObservation = selectedTags.some(
    (tag) => tag.category === "negative" || tag.category === "discrepancy"
  );
  const requiresFreeText = hasNegativeObservation;

  const isValid =
    selectedMethods.length > 0 &&
    allMandatoryComplete &&
    selectedTagIds.length > 0 &&
    selectedRemarkType !== null &&
    (!requiresFreeText || freeTextRemark.trim().length > 0);

  const handleSave = async () => {
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please complete all required fields before saving.",
        variant: "destructive",
      });
      return;
    }

    await saveVerificationData.mutateAsync({
      task_id: taskId,
      verification_methods: selectedMethods,
      checklist_responses: checklistResponses,
      observation_tag_ids: selectedTagIds,
      remark_type: selectedRemarkType!,
      remark_template_id: selectedTemplateId || undefined,
      structured_remark: structuredRemark || undefined,
      free_text_remark: freeTextRemark || undefined,
    });

    onComplete?.();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Verification Execution
          {isValid ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          )}
        </CardTitle>
        <CardDescription>
          Complete the standardized verification process for this task
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Verification Methods */}
        <VerificationMethodSelect
          methods={methods || []}
          selectedMethods={selectedMethods}
          onMethodsChange={setSelectedMethods}
          disabled={disabled}
        />

        <Separator />

        {/* Verification Checklist */}
        <VerificationChecklist
          items={checklistItems || []}
          responses={checklistResponses}
          onResponsesChange={setChecklistResponses}
          disabled={disabled}
        />

        <Separator />

        {/* Observation Tags */}
        <ObservationTagSelect
          tags={observationTags || []}
          selectedTagIds={selectedTagIds}
          onTagsChange={setSelectedTagIds}
          disabled={disabled}
        />

        <Separator />

        {/* Structured Remarks */}
        <StructuredRemarkSection
          templates={remarkTemplates || []}
          selectedRemarkType={selectedRemarkType}
          selectedTemplateId={selectedTemplateId}
          structuredRemark={structuredRemark}
          freeTextRemark={freeTextRemark}
          onRemarkTypeChange={setSelectedRemarkType}
          onTemplateChange={(templateId, templateText) => {
            setSelectedTemplateId(templateId);
            setStructuredRemark(templateText);
          }}
          onFreeTextChange={setFreeTextRemark}
          requiresFreeText={requiresFreeText}
          disabled={disabled}
        />

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSave}
            disabled={disabled || !isValid || saveVerificationData.isPending}
            size="lg"
          >
            {saveVerificationData.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Verification Data
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
