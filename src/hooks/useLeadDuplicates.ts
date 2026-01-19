import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DuplicateLead {
  lead_id: string;
  lead_number: string;
  applicant_name: string;
  application_number: string | null;
  match_type: string;
  match_score: number;
  created_at: string;
}

export function useCheckLeadDuplicates(
  clientId: string | undefined,
  applicantName: string | undefined,
  applicationNumber?: string | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: ['lead-duplicates', clientId, applicantName, applicationNumber],
    queryFn: async () => {
      if (!clientId || !applicantName || applicantName.length < 3) return [];

      const { data, error } = await supabase.rpc('check_lead_duplicates', {
        _client_id: clientId,
        _applicant_name: applicantName,
        _application_number: applicationNumber || null,
        _time_window_hours: 24,
      });

      if (error) {
        console.error('Duplicate check error:', error);
        return [];
      }

      return (data || []) as DuplicateLead[];
    },
    enabled: enabled && !!clientId && !!applicantName && applicantName.length >= 3,
    staleTime: 0, // Always refetch
  });
}
