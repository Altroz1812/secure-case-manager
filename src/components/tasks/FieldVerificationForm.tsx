import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useCaseFieldData, useSaveCaseFieldData } from '@/hooks/useCaseFieldData';
import { useUpdateTaskStatus, TaskWithDetails } from '@/hooks/useTasks';
import { useTaskEvidence, useUploadEvidence } from '@/hooks/useTaskEvidence';
import { EvidenceGallery } from '@/components/tasks/EvidenceGallery';
import { toast } from 'sonner';
import {
  Save, Send, Building, ClipboardCheck, Camera, MapPin, Navigation,
  Loader2, AlertTriangle, CheckCircle, X, Upload, Image as ImageIcon,
} from 'lucide-react';

interface Props {
  task: TaskWithDetails;
  readOnly?: boolean;
  expectedLatitude?: number;
  expectedLongitude?: number;
}

const YES_NO_OPTIONS = ['Yes', 'No'];

const OFFICE_TYPES = [
  'Owned', 'Rented', 'Leased', 'Shared', 'Co-Working', 'Virtual', 'Other'
];

const BV_FIELDS = [
  { key: 'customer_located', label: 'Customer Located', type: 'yesno' },
  { key: 'entry_allowed', label: 'Entry Allowed', type: 'yesno' },
  { key: 'entry_allowed_till', label: 'Entry Allowed Till', type: 'text' },
  { key: 'person_met', label: 'Person Met', type: 'text' },
  { key: 'relationship', label: 'Relationship', type: 'text' },
  { key: 'family_members', label: 'Family Members', type: 'text' },
  { key: 'office_type', label: 'Office Type', type: 'select', options: OFFICE_TYPES },
  { key: 'negative_area', label: 'Negative Area', type: 'yesno' },
  { key: 'met_person_designation', label: 'Met Person Designation', type: 'text' },
  { key: 'applicant_designation', label: 'Applicant Designation', type: 'text' },
  { key: 'working_since', label: 'Working Since', type: 'text' },
  { key: 'id_check', label: 'ID Check', type: 'yesno' },
  { key: 'id_number', label: 'ID Number', type: 'text' },
  { key: 'board_seen', label: 'Board Seen', type: 'yesno' },
  { key: 'business_activity_seen', label: 'Business Activity Seen', type: 'yesno' },
  { key: 'stock_seen', label: 'Stock Seen', type: 'yesno' },
  { key: 'nature_of_business', label: 'Nature of Business', type: 'text' },
  { key: 'number_of_employees', label: 'Number of Employees', type: 'number' },
  { key: 'area_sqft', label: 'Area (Sqft)', type: 'number' },
  { key: 'office_is_in', label: 'Office is in', type: 'select', options: ['Owned', 'Rented', 'Leased', 'Other'] },
  { key: 'office_asset_seen', label: 'Office Asset Seen', type: 'yesno' },
  { key: 'landmark', label: 'Landmark', type: 'text' },
  { key: 'visit_date_time', label: 'Date and Time of Visit', type: 'datetime' },
  { key: 'summary', label: 'Summary / Remarks', type: 'textarea' },
];

interface QueuedPhoto {
  file: File;
  preview: string;
  id: string;
}

// Haversine formula
function calculateDeviation(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function FieldVerificationForm({ task, readOnly = false, expectedLatitude, expectedLongitude }: Props) {
  const { data: caseData, isLoading } = useCaseFieldData(task.id);
  const { data: existingEvidence } = useTaskEvidence(task.id);
  const saveMutation = useSaveCaseFieldData();
  const updateStatus = useUpdateTaskStatus();
  const uploadEvidence = useUploadEvidence();
  const [formData, setFormData] = useState<Record<string, any>>({});

  // GPS state
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Photo queue state
  const [queuedPhotos, setQueuedPhotos] = useState<QueuedPhoto[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (caseData?.field_data) {
      setFormData(caseData.field_data);
    } else {
      setFormData({ visit_date_time: new Date().toISOString().slice(0, 16) });
    }
  }, [caseData]);

  const updateField = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // GPS capture
  const captureLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      return;
    }
    setGettingLocation(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setGettingLocation(false);
        toast.success('Location captured');
      },
      (err) => {
        setGettingLocation(false);
        const msgs: Record<number, string> = {
          1: 'Location permission denied',
          2: 'Location unavailable',
          3: 'Location request timed out',
        };
        setLocationError(msgs[err.code] || 'Unknown error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Photo handling
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => {
      if (!f.type.startsWith('image/')) { toast.error(`${f.name} is not an image`); return false; }
      if (f.size > 10 * 1024 * 1024) { toast.error(`${f.name} exceeds 10MB`); return false; }
      return true;
    });

    valid.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setQueuedPhotos(prev => [...prev, {
          file,
          preview: reader.result as string,
          id: crypto.randomUUID(),
        }]);
      };
      reader.readAsDataURL(file);
    });

    // Auto-capture location on first photo
    if (!latitude && !longitude && valid.length > 0) {
      captureLocation();
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeQueuedPhoto = (id: string) => {
    setQueuedPhotos(prev => {
      const removed = prev.find(p => p.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter(p => p.id !== id);
    });
  };

  // Batch upload queued photos
  const uploadQueuedPhotos = async () => {
    if (queuedPhotos.length === 0) return;
    if (!latitude || !longitude) {
      toast.error('Please capture GPS location before uploading photos');
      return;
    }

    setUploadProgress({ current: 0, total: queuedPhotos.length });
    for (let i = 0; i < queuedPhotos.length; i++) {
      setUploadProgress({ current: i + 1, total: queuedPhotos.length });
      try {
        await uploadEvidence.mutateAsync({
          taskId: task.id,
          file: queuedPhotos[i].file,
          latitude,
          longitude,
          expectedLatitude,
          expectedLongitude,
        });
      } catch {
        // individual error handled by mutation toast
      }
    }
    setQueuedPhotos([]);
    setUploadProgress(null);
  };

  const handleSave = async () => {
    // Upload photos first if any
    if (queuedPhotos.length > 0) await uploadQueuedPhotos();
    saveMutation.mutate({
      taskId: task.id,
      fieldData: formData,
      formType: task.verification_type === 'residential' ? 'RV' : 'BV',
    });
  };

  const handleSubmit = async () => {
    // Upload photos first if any
    if (queuedPhotos.length > 0) await uploadQueuedPhotos();
    saveMutation.mutate(
      {
        taskId: task.id,
        fieldData: { ...formData, visit_date_time: formData.visit_date_time || new Date().toISOString().slice(0, 16) },
        formType: task.verification_type === 'residential' ? 'RV' : 'BV',
        isSubmit: true,
      },
      {
        onSuccess: () => {
          updateStatus.mutate({ taskId: task.id, status: 'completed' });
        },
      }
    );
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>;
  }

  const isSubmitted = !!caseData?.submitted_at;
  const disabled = readOnly || isSubmitted;
  const hasLocation = latitude !== null && longitude !== null;
  const geoDeviation = hasLocation && expectedLatitude && expectedLongitude
    ? calculateDeviation(latitude!, longitude!, expectedLatitude, expectedLongitude)
    : null;
  const isDeviationExceeded = geoDeviation !== null && geoDeviation > 500;

  const renderField = (field: typeof BV_FIELDS[0]) => {
    const value = formData[field.key] || '';

    if (field.type === 'yesno') {
      return (
        <Select value={value} onValueChange={v => updateField(field.key, v)} disabled={disabled}>
          <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
          <SelectContent>
            {YES_NO_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      );
    }
    if (field.type === 'select') {
      return (
        <Select value={value} onValueChange={v => updateField(field.key, v)} disabled={disabled}>
          <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
          <SelectContent>
            {field.options?.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      );
    }
    if (field.type === 'textarea') {
      return <Textarea value={value} onChange={e => updateField(field.key, e.target.value)} disabled={disabled} rows={3} />;
    }
    if (field.type === 'datetime') {
      return <Input type="datetime-local" value={value} onChange={e => updateField(field.key, e.target.value)} disabled={disabled} />;
    }
    return (
      <Input
        type={field.type === 'number' ? 'number' : 'text'}
        value={value}
        onChange={e => updateField(field.key, e.target.value)}
        disabled={disabled}
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Pre-filled info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building className="h-4 w-4" /> Case Information (Pre-filled)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Client:</span> <span className="font-medium">{task.lead?.client?.name || 'N/A'}</span></div>
            <div><span className="text-muted-foreground">Product:</span> <span className="font-medium">{task.lead?.product?.name || 'N/A'}</span></div>
            <div><span className="text-muted-foreground">Applicant:</span> <span className="font-medium">{task.lead?.applicant_name}</span></div>
            <div><span className="text-muted-foreground">Address:</span> <span className="font-medium">{task.lead?.address || 'N/A'}</span></div>
            <div><span className="text-muted-foreground">Pin Code:</span> <span className="font-medium">{task.lead?.pincode || 'N/A'}</span></div>
            <div><span className="text-muted-foreground">Task:</span> <span className="font-medium">{task.task_number}</span></div>
          </div>
          {isSubmitted && (
            <Badge className="mt-3 bg-emerald-100 text-emerald-700">
              Submitted on {new Date(caseData!.submitted_at!).toLocaleString()}
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* GPS Location Capture */}
      {!disabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" /> GPS Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={captureLocation}
                disabled={gettingLocation}
              >
                {gettingLocation ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Getting Location...</>
                ) : (
                  <><Navigation className="h-4 w-4 mr-2" /> {hasLocation ? 'Recapture Location' : 'Capture Location'}</>
                )}
              </Button>
              {hasLocation && (
                <Badge className="bg-emerald-100 text-emerald-700">
                  <CheckCircle className="h-3 w-3 mr-1" /> Location Captured
                </Badge>
              )}
            </div>

            {locationError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" /> {locationError}
              </div>
            )}

            {hasLocation && (
              <div className="bg-muted rounded-lg p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Lat:</span> <span className="font-mono">{latitude?.toFixed(6)}</span></div>
                  <div><span className="text-muted-foreground">Lng:</span> <span className="font-mono">{longitude?.toFixed(6)}</span></div>
                </div>
                {geoDeviation !== null && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Deviation:</span>
                    <Badge variant="outline" className={isDeviationExceeded ? 'border-destructive text-destructive' : 'border-green-600 text-green-600'}>
                      {Math.round(geoDeviation)}m
                    </Badge>
                    {isDeviationExceeded && (
                      <span className="text-xs text-destructive">Exceeds 500m limit</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Verification fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" /> Verification Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BV_FIELDS.map(field => (
              <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                <Label className="text-sm font-medium">{field.label}</Label>
                <div className="mt-1">{renderField(field)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Photo Evidence Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-4 w-4" /> Photo Evidence
            {(existingEvidence?.length || 0) + queuedPhotos.length > 0 && (
              <Badge variant="secondary">{(existingEvidence?.length || 0) + queuedPhotos.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing uploaded evidence */}
          {existingEvidence && existingEvidence.length > 0 && (
            <EvidenceGallery taskId={task.id} disabled={disabled} />
          )}

          {/* Queued photos preview */}
          {queuedPhotos.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm">Queued for Upload ({queuedPhotos.length})</Label>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {queuedPhotos.map(photo => (
                  <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
                    <img src={photo.preview} alt={photo.file.name} className="w-full h-full object-cover" />
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => removeQueuedPhoto(photo.id)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-0.5">
                      <p className="text-[10px] text-white truncate">{photo.file.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload progress */}
          {uploadProgress && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading {uploadProgress.current} of {uploadProgress.total}...
              </div>
              <Progress value={(uploadProgress.current / uploadProgress.total) * 100} className="h-2" />
            </div>
          )}

          {/* Add photos button */}
          {!disabled && (
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Click to add photos</p>
              <p className="text-xs text-muted-foreground mt-1">Select multiple files • Max 10MB each</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            className="hidden"
            onChange={handleFilesSelected}
            disabled={disabled}
          />

          {/* No photos message */}
          {!disabled && existingEvidence?.length === 0 && queuedPhotos.length === 0 && (
            <p className="text-sm text-muted-foreground text-center">No photos uploaded yet. GPS coordinates will be auto-captured when you add photos.</p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {!disabled && (
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={handleSave} disabled={saveMutation.isPending || !!uploadProgress}>
            <Save className="h-4 w-4 mr-2" /> Save Draft
          </Button>
          <Button onClick={handleSubmit} disabled={saveMutation.isPending || updateStatus.isPending || !!uploadProgress}>
            <Send className="h-4 w-4 mr-2" /> Submit Verification
          </Button>
        </div>
      )}
    </div>
  );
}
