import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Image,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Trash2,
  RefreshCw,
  Navigation,
  FileText,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import {
  useTaskEvidence,
  useEvidenceValidationLogs,
  useValidateEvidence,
  useDeleteEvidence,
  getValidationStatusColor,
  getValidationStatusLabel,
  TaskEvidence,
} from '@/hooks/useTaskEvidence';

interface EvidenceGalleryProps {
  taskId: string;
  disabled?: boolean;
}

export function EvidenceGallery({ taskId, disabled = false }: EvidenceGalleryProps) {
  const { data: evidenceList, isLoading } = useTaskEvidence(taskId);
  const [selectedEvidence, setSelectedEvidence] = useState<TaskEvidence | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!evidenceList || evidenceList.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Field Evidence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No evidence uploaded yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Field Evidence
            <Badge variant="secondary">{evidenceList.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {evidenceList.map((evidence) => (
              <EvidenceCard
                key={evidence.id}
                evidence={evidence}
                onClick={() => setSelectedEvidence(evidence)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedEvidence && (
        <EvidenceDetailDialog
          evidence={selectedEvidence}
          taskId={taskId}
          open={!!selectedEvidence}
          onClose={() => setSelectedEvidence(null)}
          disabled={disabled}
        />
      )}
    </>
  );
}

function EvidenceCard({
  evidence,
  onClick,
}: {
  evidence: TaskEvidence;
  onClick: () => void;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Get signed URL for image
  useState(() => {
    supabase.storage
      .from('task-evidence')
      .createSignedUrl(evidence.storage_path, 3600)
      .then(({ data }) => {
        if (data?.signedUrl) setImageUrl(data.signedUrl);
      });
  });

  const statusIcon = {
    valid: <CheckCircle className="h-4 w-4 text-green-600" />,
    invalid: <XCircle className="h-4 w-4 text-red-600" />,
    warning: <AlertTriangle className="h-4 w-4 text-yellow-600" />,
    pending: <Clock className="h-4 w-4 text-gray-600" />,
  }[evidence.validation_status] || <Clock className="h-4 w-4 text-gray-600" />;

  return (
    <div
      className="relative group cursor-pointer rounded-lg overflow-hidden border bg-muted aspect-square"
      onClick={onClick}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={evidence.file_name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Image className="h-8 w-8 text-muted-foreground" />
        </div>
      )}

      {/* Overlay with status */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className={`${getValidationStatusColor(evidence.validation_status)} text-xs`}
            >
              {statusIcon}
              <span className="ml-1">{getValidationStatusLabel(evidence.validation_status)}</span>
            </Badge>
            <Button size="icon" variant="ghost" className="h-6 w-6 text-white">
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Validation status indicator */}
      <div className="absolute top-2 right-2">
        {evidence.geo_deviation_flagged && (
          <Badge variant="destructive" className="text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Flagged
          </Badge>
        )}
      </div>

      {/* GPS indicator */}
      {evidence.latitude && evidence.longitude && (
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="text-xs bg-background/80">
            <MapPin className="h-3 w-3 mr-1" />
            GPS
          </Badge>
        </div>
      )}
    </div>
  );
}

function EvidenceDetailDialog({
  evidence,
  taskId,
  open,
  onClose,
  disabled,
}: {
  evidence: TaskEvidence;
  taskId: string;
  open: boolean;
  onClose: () => void;
  disabled: boolean;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const { data: validationLogs } = useEvidenceValidationLogs(evidence.id);
  const validateEvidence = useValidateEvidence();
  const deleteEvidence = useDeleteEvidence();

  // Get signed URL for image
  useState(() => {
    supabase.storage
      .from('task-evidence')
      .createSignedUrl(evidence.storage_path, 3600)
      .then(({ data }) => {
        if (data?.signedUrl) setImageUrl(data.signedUrl);
      });
  });

  const handleRevalidate = async () => {
    await validateEvidence.mutateAsync({ evidenceId: evidence.id });
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this evidence?')) {
      await deleteEvidence.mutateAsync({
        evidenceId: evidence.id,
        storagePath: evidence.storage_path,
        taskId,
      });
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Evidence Details
          </DialogTitle>
          <DialogDescription>
            {evidence.file_name}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Image */}
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={evidence.file_name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-4">
              {/* Validation Status */}
              <div>
                <h4 className="text-sm font-medium mb-2">Validation Status</h4>
                <Badge
                  variant="outline"
                  className={`${getValidationStatusColor(evidence.validation_status)}`}
                >
                  {evidence.validation_status === 'valid' && <CheckCircle className="h-4 w-4 mr-1" />}
                  {evidence.validation_status === 'invalid' && <XCircle className="h-4 w-4 mr-1" />}
                  {evidence.validation_status === 'warning' && <AlertTriangle className="h-4 w-4 mr-1" />}
                  {evidence.validation_status === 'pending' && <Clock className="h-4 w-4 mr-1" />}
                  {getValidationStatusLabel(evidence.validation_status)}
                </Badge>

                {evidence.validation_errors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {evidence.validation_errors.map((error, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-destructive">
                        <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        {error}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* GPS Coordinates */}
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  GPS Coordinates
                </h4>
                {evidence.latitude && evidence.longitude ? (
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground">Latitude:</span>{' '}
                        <span className="font-mono">{evidence.latitude.toFixed(6)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Longitude:</span>{' '}
                        <span className="font-mono">{evidence.longitude.toFixed(6)}</span>
                      </div>
                    </div>

                    {evidence.geo_deviation_meters !== null && (
                      <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Deviation:</span>
                        <Badge
                          variant="outline"
                          className={
                            evidence.geo_deviation_flagged
                              ? 'border-destructive text-destructive'
                              : 'border-green-600 text-green-600'
                          }
                        >
                          {Math.round(evidence.geo_deviation_meters)}m
                        </Badge>
                        {evidence.geo_deviation_flagged && (
                          <span className="text-destructive text-xs">Exceeds 500m limit</span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    No GPS coordinates
                  </div>
                )}
              </div>

              <Separator />

              {/* Capture Time */}
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Capture Details
                </h4>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-muted-foreground">Captured:</span>{' '}
                    {evidence.captured_at
                      ? format(new Date(evidence.captured_at), 'MMM dd, yyyy HH:mm:ss')
                      : 'Unknown'}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Uploaded:</span>{' '}
                    {format(new Date(evidence.created_at), 'MMM dd, yyyy HH:mm:ss')}
                  </div>
                </div>
              </div>

              {/* Watermark */}
              {evidence.address_watermark && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Watermark Text
                    </h4>
                    <p className="text-sm bg-muted p-2 rounded">{evidence.address_watermark}</p>
                  </div>
                </>
              )}

              {/* Remarks */}
              {evidence.remarks && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2">Remarks</h4>
                    <p className="text-sm text-muted-foreground">{evidence.remarks}</p>
                  </div>
                </>
              )}

              {/* Validation Logs */}
              {validationLogs && validationLogs.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2">Validation Checks</h4>
                    <div className="space-y-2">
                      {validationLogs.map((log) => (
                        <div
                          key={log.id}
                          className={`flex items-center gap-2 text-sm p-2 rounded ${
                            log.passed ? 'bg-green-50' : 'bg-red-50'
                          }`}
                        >
                          {log.passed ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="capitalize">
                            {log.validation_type.replace(/_/g, ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRevalidate}
            disabled={disabled || validateEvidence.isPending}
          >
            {validateEvidence.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Re-validate
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={disabled || deleteEvidence.isPending}
          >
            {deleteEvidence.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
