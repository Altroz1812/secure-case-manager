import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { RemarkTemplate } from "@/hooks/useVerificationFramework";
import { getRemarkTypeLabel } from "@/hooks/useVerificationFramework";
import type { Database } from "@/integrations/supabase/types";

type RemarkType = Database["public"]["Enums"]["remark_type"];

interface StructuredRemarkSectionProps {
  templates: RemarkTemplate[];
  selectedRemarkType: RemarkType | null;
  selectedTemplateId: string | null;
  structuredRemark: string;
  freeTextRemark: string;
  onRemarkTypeChange: (remarkType: RemarkType) => void;
  onTemplateChange: (templateId: string, templateText: string) => void;
  onFreeTextChange: (text: string) => void;
  requiresFreeText: boolean;
  disabled?: boolean;
}

const remarkTypeOrder: RemarkType[] = [
  "positive_confirmed",
  "partial_verification",
  "refer_for_review",
  "negative_uncontactable",
  "negative_discrepancy",
  "negative_not_found",
];

export function StructuredRemarkSection({
  templates,
  selectedRemarkType,
  selectedTemplateId,
  structuredRemark,
  freeTextRemark,
  onRemarkTypeChange,
  onTemplateChange,
  onFreeTextChange,
  requiresFreeText,
  disabled = false,
}: StructuredRemarkSectionProps) {
  // Group templates by remark type
  const templatesByType = templates.reduce((acc, template) => {
    if (!acc[template.remark_type]) {
      acc[template.remark_type] = [];
    }
    acc[template.remark_type].push(template);
    return acc;
  }, {} as Record<RemarkType, RemarkTemplate[]>);

  // Get available remark types (those that have templates)
  const availableRemarkTypes = remarkTypeOrder.filter(
    (type) => templatesByType[type]?.length > 0
  );

  const handleRemarkTypeSelect = (remarkType: RemarkType) => {
    onRemarkTypeChange(remarkType);
    // Auto-select first template of this type
    const typeTemplates = templatesByType[remarkType];
    if (typeTemplates && typeTemplates.length > 0) {
      onTemplateChange(typeTemplates[0].id, typeTemplates[0].template_text);
    }
  };

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const isNegativeRemark = selectedRemarkType?.startsWith("negative_");

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Verification Remarks</Label>

      {/* Remark Type Selection */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Select Outcome
        </p>
        <RadioGroup
          value={selectedRemarkType || ""}
          onValueChange={(value) => handleRemarkTypeSelect(value as RemarkType)}
          disabled={disabled}
          className="grid grid-cols-1 md:grid-cols-2 gap-2"
        >
          {availableRemarkTypes.map((remarkType) => {
            const isPositive = remarkType === "positive_confirmed";
            const isNegative = remarkType.startsWith("negative_");
            
            return (
              <div
                key={remarkType}
                className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors ${
                  selectedRemarkType === remarkType
                    ? isPositive
                      ? "border-green-300 bg-green-50"
                      : isNegative
                      ? "border-red-300 bg-red-50"
                      : "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/50"
                } ${disabled ? "opacity-50" : "cursor-pointer"}`}
              >
                <RadioGroupItem value={remarkType} id={remarkType} />
                <div className="flex items-center gap-2">
                  {isPositive ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : isNegative ? (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  )}
                  <Label
                    htmlFor={remarkType}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {getRemarkTypeLabel(remarkType)}
                  </Label>
                </div>
              </div>
            );
          })}
        </RadioGroup>
      </div>

      {/* Template Selection (if multiple templates for selected type) */}
      {selectedRemarkType && templatesByType[selectedRemarkType]?.length > 1 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Select Remark Template
          </p>
          <RadioGroup
            value={selectedTemplateId || ""}
            onValueChange={(templateId) => {
              const template = templates.find((t) => t.id === templateId);
              if (template) {
                onTemplateChange(template.id, template.template_text);
              }
            }}
            disabled={disabled}
            className="space-y-2"
          >
            {templatesByType[selectedRemarkType].map((template) => (
              <div
                key={template.id}
                className={`flex items-start space-x-3 p-3 border rounded-lg ${
                  selectedTemplateId === template.id
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <RadioGroupItem value={template.id} id={template.id} />
                <Label
                  htmlFor={template.id}
                  className="text-sm cursor-pointer flex-1"
                >
                  {template.template_text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}

      {/* Structured Remark Display */}
      {structuredRemark && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Standard Remark
          </p>
          <div className="p-3 bg-muted rounded-lg text-sm">{structuredRemark}</div>
        </div>
      )}

      {/* Free Text Remark */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Additional Details
          </p>
          {requiresFreeText && (
            <span className="text-xs text-red-500 font-medium">(Required)</span>
          )}
        </div>
        <Textarea
          value={freeTextRemark}
          onChange={(e) => onFreeTextChange(e.target.value)}
          placeholder={
            requiresFreeText
              ? "Please provide detailed explanation for the negative/discrepancy observation..."
              : "Add any additional observations or comments..."
          }
          disabled={disabled}
          className={`min-h-[100px] ${
            requiresFreeText && !freeTextRemark
              ? "border-red-300 focus:border-red-500"
              : ""
          }`}
        />
        {requiresFreeText && !freeTextRemark && (
          <p className="text-sm text-destructive">
            Detailed remarks are mandatory for negative/discrepancy observations
          </p>
        )}
      </div>

      {!selectedRemarkType && (
        <p className="text-sm text-destructive">Please select a remark type</p>
      )}
    </div>
  );
}
