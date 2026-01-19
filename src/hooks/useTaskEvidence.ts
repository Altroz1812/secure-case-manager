import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface TaskEvidence {
  id: string;
  task_id: string;
  file_name: string;
  storage_path: string;
  file_type: string | null;
  latitude: number | null;
  longitude: number | null;
  captured_at: string | null;
  remarks: string | null;
  uploaded_by: string;
  created_at: string;
  // Validation fields
  is_validated: boolean;
  validation_status: string;
  validation_errors: string[];
  exif_data: Record<string, unknown>;
  address_watermark: string | null;
  geo_deviation_meters: number | null;
  expected_latitude: number | null;
  expected_longitude: number | null;
  geo_deviation_flagged: boolean;
  validated_at: string | null;
  validated_by: string | null;
}

export interface EvidenceValidationLog {
  id: string;
  evidence_id: string;
  validation_type: string;
  passed: boolean;
  details: Record<string, unknown>;
  created_at: string;
}

interface UploadEvidenceParams {
  taskId: string;
  file: File;
  latitude?: number;
  longitude?: number;
  remarks?: string;
  expectedLatitude?: number;
  expectedLongitude?: number;
}

// Haversine formula to calculate distance between two GPS coordinates
function calculateGeoDeviation(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Maximum allowed deviation in meters (500m radius)
const MAX_GEO_DEVIATION_METERS = 500;

export function useTaskEvidence(taskId: string | undefined) {
  return useQuery({
    queryKey: ['task-evidence', taskId],
    queryFn: async () => {
      if (!taskId) return [];

      const { data, error } = await supabase
        .from('task_evidence')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type assertion for extended fields
      return (data || []).map(item => ({
        ...item,
        is_validated: (item as any).is_validated ?? false,
        validation_status: (item as any).validation_status ?? 'pending',
        validation_errors: (item as any).validation_errors ?? [],
        exif_data: (item as any).exif_data ?? {},
        address_watermark: (item as any).address_watermark ?? null,
        geo_deviation_meters: (item as any).geo_deviation_meters ?? null,
        expected_latitude: (item as any).expected_latitude ?? null,
        expected_longitude: (item as any).expected_longitude ?? null,
        geo_deviation_flagged: (item as any).geo_deviation_flagged ?? false,
        validated_at: (item as any).validated_at ?? null,
        validated_by: (item as any).validated_by ?? null,
      })) as TaskEvidence[];
    },
    enabled: !!taskId,
  });
}

export function useEvidenceValidationLogs(evidenceId: string | undefined) {
  return useQuery({
    queryKey: ['evidence-validation-logs', evidenceId],
    queryFn: async () => {
      if (!evidenceId) return [];

      const { data, error } = await supabase
        .from('evidence_validation_logs')
        .select('*')
        .eq('evidence_id', evidenceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EvidenceValidationLog[];
    },
    enabled: !!evidenceId,
  });
}

export function useUploadEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      file,
      latitude,
      longitude,
      remarks,
      expectedLatitude,
      expectedLongitude,
    }: UploadEvidenceParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${taskId}/${Date.now()}_${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('task-evidence')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Calculate geo deviation if coordinates provided
      let geoDeviationMeters: number | null = null;
      let geoDeviationFlagged = false;

      if (
        latitude !== undefined &&
        longitude !== undefined &&
        expectedLatitude !== undefined &&
        expectedLongitude !== undefined
      ) {
        geoDeviationMeters = calculateGeoDeviation(
          latitude,
          longitude,
          expectedLatitude,
          expectedLongitude
        );
        geoDeviationFlagged = geoDeviationMeters > MAX_GEO_DEVIATION_METERS;
      }

      // Initial validation status
      const validationErrors: string[] = [];
      
      if (!latitude || !longitude) {
        validationErrors.push('Missing GPS coordinates');
      }
      
      if (geoDeviationFlagged) {
        validationErrors.push(`GPS deviation ${Math.round(geoDeviationMeters!)}m exceeds ${MAX_GEO_DEVIATION_METERS}m limit`);
      }

      // Create evidence record with validation fields
      const { data, error: insertError } = await supabase
        .from('task_evidence')
        .insert({
          task_id: taskId,
          file_name: file.name,
          storage_path: fileName,
          file_type: file.type,
          latitude: latitude ?? null,
          longitude: longitude ?? null,
          captured_at: new Date().toISOString(),
          remarks: remarks ?? null,
          uploaded_by: user.id,
          // Extended validation fields will be updated by edge function
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Call edge function to validate EXIF and watermarks
      try {
        await supabase.functions.invoke('validate-evidence', {
          body: {
            evidenceId: data.id,
            storagePath: fileName,
            expectedLatitude,
            expectedLongitude,
          },
        });
      } catch (e) {
        console.error('Evidence validation failed:', e);
        // Don't fail upload if validation fails
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-evidence', variables.taskId] });
      toast.success('Evidence uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to upload evidence', { description: error.message });
    },
  });
}

export function useValidateEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ evidenceId }: { evidenceId: string }) => {
      const { data, error } = await supabase.functions.invoke('validate-evidence', {
        body: { evidenceId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-evidence'] });
      queryClient.invalidateQueries({ queryKey: ['evidence-validation-logs', variables.evidenceId] });
      toast.success('Evidence validation complete');
    },
    onError: (error: Error) => {
      toast.error('Validation failed', { description: error.message });
    },
  });
}

export function useDeleteEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ evidenceId, storagePath, taskId }: { evidenceId: string; storagePath: string; taskId: string }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('task-evidence')
        .remove([storagePath]);

      if (storageError) throw storageError;

      // Delete record
      const { error: dbError } = await supabase
        .from('task_evidence')
        .delete()
        .eq('id', evidenceId);

      if (dbError) throw dbError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-evidence', variables.taskId] });
      toast.success('Evidence deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete evidence', { description: error.message });
    },
  });
}

// Get validation status color
export function getValidationStatusColor(status: string): string {
  switch (status) {
    case 'valid':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'invalid':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'warning':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'pending':
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

// Get validation status label
export function getValidationStatusLabel(status: string): string {
  switch (status) {
    case 'valid':
      return 'Validated';
    case 'invalid':
      return 'Invalid';
    case 'warning':
      return 'Warning';
    case 'pending':
    default:
      return 'Pending Validation';
  }
}
