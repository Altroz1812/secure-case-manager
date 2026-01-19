import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Video, FileText, Database as DatabaseIcon, Users, Building2 } from "lucide-react";
import type { VerificationMethod } from "@/hooks/useVerificationFramework";
import type { Database } from "@/integrations/supabase/types";

type VerificationMethodType = Database["public"]["Enums"]["verification_method_type"];

interface VerificationMethodSelectProps {
  methods: VerificationMethod[];
  selectedMethods: VerificationMethodType[];
  onMethodsChange: (methods: VerificationMethodType[]) => void;
  disabled?: boolean;
}

const methodIcons: Record<VerificationMethodType, React.ReactNode> = {
  physical_visit: <MapPin className="h-4 w-4" />,
  telephonic: <Phone className="h-4 w-4" />,
  video_call: <Video className="h-4 w-4" />,
  document_based: <FileText className="h-4 w-4" />,
  api_check: <DatabaseIcon className="h-4 w-4" />,
  neighbor_check: <Users className="h-4 w-4" />,
  employer_check: <Building2 className="h-4 w-4" />,
};

export function VerificationMethodSelect({
  methods,
  selectedMethods,
  onMethodsChange,
  disabled = false,
}: VerificationMethodSelectProps) {
  const handleMethodToggle = (methodType: VerificationMethodType) => {
    if (selectedMethods.includes(methodType)) {
      onMethodsChange(selectedMethods.filter((m) => m !== methodType));
    } else {
      onMethodsChange([...selectedMethods, methodType]);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Verification Methods Used</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {methods.map((method) => (
          <div
            key={method.id}
            className={`flex items-start space-x-3 p-3 border rounded-lg transition-colors ${
              selectedMethods.includes(method.method_type)
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/50"
            } ${disabled ? "opacity-50" : "cursor-pointer"}`}
            onClick={() => !disabled && handleMethodToggle(method.method_type)}
          >
            <Checkbox
              id={method.id}
              checked={selectedMethods.includes(method.method_type)}
              onCheckedChange={() => handleMethodToggle(method.method_type)}
              disabled={disabled}
              className="mt-0.5"
            />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                {methodIcons[method.method_type]}
                <span className="font-medium text-sm">{method.display_name}</span>
                {method.is_field_method && (
                  <Badge variant="outline" className="text-xs">
                    Field
                  </Badge>
                )}
              </div>
              {method.description && (
                <p className="text-xs text-muted-foreground">{method.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      {selectedMethods.length === 0 && (
        <p className="text-sm text-destructive">Please select at least one verification method</p>
      )}
    </div>
  );
}
