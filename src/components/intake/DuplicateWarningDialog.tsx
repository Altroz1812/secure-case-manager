import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import type { DuplicateLead } from '@/hooks/useLeadDuplicates';

interface DuplicateWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicates: DuplicateLead[];
  onCancel: () => void;
  onViewLead: (leadId: string) => void;
  onOverride: (reason: string) => void;
  isSubmitting?: boolean;
}

export function DuplicateWarningDialog({
  open,
  onOpenChange,
  duplicates,
  onCancel,
  onViewLead,
  onOverride,
  isSubmitting = false,
}: DuplicateWarningDialogProps) {
  const [overrideReason, setOverrideReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);

  const getMatchTypeBadge = (matchType: string) => {
    const config: Record<string, { label: string; variant: 'destructive' | 'secondary' | 'outline' }> = {
      application_number: { label: 'Exact App #', variant: 'destructive' },
      applicant_name: { label: 'Same Name', variant: 'destructive' },
      time_window: { label: 'Similar (24h)', variant: 'secondary' },
    };
    const { label, variant } = config[matchType] || { label: matchType, variant: 'outline' };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const handleOverrideClick = () => {
    if (!showReasonInput) {
      setShowReasonInput(true);
      return;
    }
    if (overrideReason.trim().length < 10) {
      return;
    }
    onOverride(overrideReason.trim());
  };

  const handleClose = () => {
    setOverrideReason('');
    setShowReasonInput(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Potential Duplicate Detected
          </DialogTitle>
          <DialogDescription>
            We found {duplicates.length} existing lead(s) that may be duplicates of the one you're creating.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[300px] overflow-y-auto">
          {duplicates.map((dup) => (
            <div
              key={dup.lead_id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{dup.lead_number}</span>
                  {getMatchTypeBadge(dup.match_type)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {dup.applicant_name}
                  {dup.application_number && ` • App #: ${dup.application_number}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  Created: {format(new Date(dup.created_at), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewLead(dup.lead_id)}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                View Lead
              </Button>
            </div>
          ))}
        </div>

        {showReasonInput && (
          <Alert>
            <AlertDescription>
              <p className="mb-2 font-medium">Override Reason (required)</p>
              <Textarea
                placeholder="Please provide a reason for creating this lead despite the duplicate warning (minimum 10 characters)..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={3}
              />
              {overrideReason.length > 0 && overrideReason.length < 10 && (
                <p className="text-xs text-destructive mt-1">
                  Reason must be at least 10 characters
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleOverrideClick}
            disabled={isSubmitting || (showReasonInput && overrideReason.trim().length < 10)}
          >
            {isSubmitting
              ? 'Creating...'
              : showReasonInput
              ? 'Confirm Override'
              : 'Override & Create Anyway'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
