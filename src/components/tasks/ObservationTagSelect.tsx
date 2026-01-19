import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { ObservationTag } from "@/hooks/useVerificationFramework";
import { getObservationCategoryColor } from "@/hooks/useVerificationFramework";
import type { Database } from "@/integrations/supabase/types";

type ObservationCategory = Database["public"]["Enums"]["observation_category"];

interface ObservationTagSelectProps {
  tags: ObservationTag[];
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  disabled?: boolean;
}

const categoryLabels: Record<ObservationCategory, string> = {
  positive: "Positive",
  negative: "Negative",
  discrepancy: "Discrepancy",
  unverifiable: "Unverifiable",
  neutral: "Neutral",
};

export function ObservationTagSelect({
  tags,
  selectedTagIds,
  onTagsChange,
  disabled = false,
}: ObservationTagSelectProps) {
  const handleTagToggle = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onTagsChange([...selectedTagIds, tagId]);
    }
  };

  // Group tags by category
  const tagsByCategory = tags.reduce((acc, tag) => {
    if (!acc[tag.category]) {
      acc[tag.category] = [];
    }
    acc[tag.category].push(tag);
    return acc;
  }, {} as Record<ObservationCategory, ObservationTag[]>);

  const selectedTags = tags.filter((tag) => selectedTagIds.includes(tag.id));
  
  // Check if any negative/discrepancy tag is selected
  const hasNegativeObservation = selectedTags.some(
    (tag) => tag.category === "negative" || tag.category === "discrepancy"
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Observation Tags</Label>
        {selectedTags.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {selectedTags.length} selected
          </span>
        )}
      </div>

      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
          {selectedTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className={`${getObservationCategoryColor(tag.category)} cursor-pointer`}
              onClick={() => !disabled && handleTagToggle(tag.id)}
            >
              {tag.tag_label}
              {!disabled && <X className="h-3 w-3 ml-1" />}
            </Badge>
          ))}
        </div>
      )}

      {/* Tag Categories */}
      <div className="space-y-3">
        {(Object.keys(categoryLabels) as ObservationCategory[]).map((category) => {
          const categoryTags = tagsByCategory[category] || [];
          if (categoryTags.length === 0) return null;

          return (
            <div key={category} className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {categoryLabels[category]}
              </p>
              <div className="flex flex-wrap gap-2">
                {categoryTags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? getObservationCategoryColor(tag.category)
                          : "bg-background hover:bg-muted"
                      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                      onClick={() => !disabled && handleTagToggle(tag.id)}
                    >
                      {tag.tag_label}
                      {tag.severity_weight && tag.severity_weight > 0 && (
                        <span className="ml-1 opacity-60">({tag.severity_weight})</span>
                      )}
                    </Badge>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {selectedTagIds.length === 0 && (
        <p className="text-sm text-destructive">
          Please select at least one observation tag
        </p>
      )}

      {hasNegativeObservation && (
        <p className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
          ⚠️ Negative observation selected. Detailed remarks are required.
        </p>
      )}
    </div>
  );
}
