import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";
import type { ChecklistItem } from "@/hooks/useVerificationFramework";

interface VerificationChecklistProps {
  items: ChecklistItem[];
  responses: Record<string, boolean>;
  onResponsesChange: (responses: Record<string, boolean>) => void;
  disabled?: boolean;
}

export function VerificationChecklist({
  items,
  responses,
  onResponsesChange,
  disabled = false,
}: VerificationChecklistProps) {
  const handleItemToggle = (itemCode: string) => {
    onResponsesChange({
      ...responses,
      [itemCode]: !responses[itemCode],
    });
  };

  const mandatoryItems = items.filter((item) => item.is_mandatory);
  const optionalItems = items.filter((item) => !item.is_mandatory);
  
  const completedMandatory = mandatoryItems.filter(
    (item) => responses[item.item_code]
  ).length;
  const totalMandatory = mandatoryItems.length;

  const allMandatoryComplete = completedMandatory === totalMandatory;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Verification Checklist</Label>
        <div className="flex items-center gap-2">
          {allMandatoryComplete ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-orange-500" />
          )}
          <span className="text-xs text-muted-foreground">
            {completedMandatory}/{totalMandatory} mandatory items
          </span>
        </div>
      </div>

      {/* Mandatory Items */}
      {mandatoryItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Mandatory Checks
          </p>
          <div className="space-y-2">
            {mandatoryItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-start space-x-3 p-3 border rounded-lg transition-colors ${
                  responses[item.item_code]
                    ? "border-green-200 bg-green-50"
                    : "border-orange-200 bg-orange-50"
                } ${disabled ? "opacity-50" : "cursor-pointer"}`}
                onClick={() => !disabled && handleItemToggle(item.item_code)}
              >
                <Checkbox
                  id={item.id}
                  checked={responses[item.item_code] || false}
                  onCheckedChange={() => handleItemToggle(item.item_code)}
                  disabled={disabled}
                  className="mt-0.5"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{item.item_label}</span>
                    <Badge variant="destructive" className="text-xs">
                      Required
                    </Badge>
                  </div>
                  {item.item_description && (
                    <p className="text-xs text-muted-foreground">
                      {item.item_description}
                    </p>
                  )}
                </div>
                {responses[item.item_code] ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 text-orange-400" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optional Items */}
      {optionalItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Optional Checks
          </p>
          <div className="space-y-2">
            {optionalItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-start space-x-3 p-3 border rounded-lg transition-colors ${
                  responses[item.item_code]
                    ? "border-green-200 bg-green-50"
                    : "border-border"
                } ${disabled ? "opacity-50" : "cursor-pointer"}`}
                onClick={() => !disabled && handleItemToggle(item.item_code)}
              >
                <Checkbox
                  id={item.id}
                  checked={responses[item.item_code] || false}
                  onCheckedChange={() => handleItemToggle(item.item_code)}
                  disabled={disabled}
                  className="mt-0.5"
                />
                <div className="flex-1 space-y-1">
                  <span className="font-medium text-sm">{item.item_label}</span>
                  {item.item_description && (
                    <p className="text-xs text-muted-foreground">
                      {item.item_description}
                    </p>
                  )}
                </div>
                {responses[item.item_code] && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!allMandatoryComplete && (
        <p className="text-sm text-destructive">
          Please complete all mandatory checklist items
        </p>
      )}
    </div>
  );
}
