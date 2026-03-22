import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface CSVRow {
  clientName: string;
  branch: string;
  absCode: string;
  product: string;
  category: string;
  verification: string;
  applicantName: string;
  coApplicantName: string;
  applicantAddress: string;
  mobile: string;
  feCode: string;
  geoLimit: string;
  priority: string;
  pinCode: string;
}

export interface ParsedRow extends CSVRow {
  rowIndex: number;
  errors: string[];
  clientId?: string;
  branchId?: string;
  productId?: string;
  verificationType?: string;
}

const CSV_COLUMN_MAP: Record<string, keyof CSVRow> = {
  'client name': 'clientName',
  'branch': 'branch',
  'abs code': 'absCode',
  'prouduct': 'product',
  'product': 'product',
  'category': 'category',
  'verification': 'verification',
  'applicant name': 'applicantName',
  'co applicant name': 'coApplicantName',
  'applicant address': 'applicantAddress',
  'mobile': 'mobile',
  'fe code': 'feCode',
  'geo limit': 'geoLimit',
  'priority': 'priority',
  'pin code': 'pinCode',
};

const VERIFICATION_MAP: Record<string, string> = {
  'bv': 'business',
  'rv': 'residential',
  'pv': 'property',
  'ev': 'end_use',
  'bank': 'bank',
  'itr': 'itr',
  'bgv': 'bgv',
  'profile': 'profile',
  'residence': 'residential',
  'business': 'business',
  'office': 'business',
  'residential': 'residential',
};

const PRIORITY_MAP: Record<string, string> = {
  'high': 'urgent',
  'medium': 'normal',
  'normal': 'normal',
  'low': 'normal',
  'urgent': 'urgent',
};

export function parseCSV(text: string): CSVRow[] {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  // Parse header - handle quoted values
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
  const columnIndices: Record<keyof CSVRow, number> = {} as any;

  headers.forEach((header, idx) => {
    const mapped = CSV_COLUMN_MAP[header];
    if (mapped) columnIndices[mapped] = idx;
  });

  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const row: CSVRow = {
      clientName: values[columnIndices.clientName] || '',
      branch: values[columnIndices.branch] || '',
      absCode: values[columnIndices.absCode] || '',
      product: values[columnIndices.product] || '',
      category: values[columnIndices.category] || '',
      verification: values[columnIndices.verification] || '',
      applicantName: values[columnIndices.applicantName] || '',
      coApplicantName: values[columnIndices.coApplicantName] || '',
      applicantAddress: values[columnIndices.applicantAddress] || '',
      mobile: values[columnIndices.mobile] || '',
      feCode: values[columnIndices.feCode] || '',
      geoLimit: values[columnIndices.geoLimit] || '',
      priority: values[columnIndices.priority] || '',
      pinCode: values[columnIndices.pinCode] || '',
    };
    return row;
  });
}

export function useBulkUpload() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [validatedRows, setValidatedRows] = useState<ParsedRow[]>([]);

  const validateRows = async (rows: CSVRow[]) => {
    // Fetch lookup data
    const [clientsRes, branchesRes, productsRes] = await Promise.all([
      supabase.from('clients').select('id, name, code').eq('is_active', true),
      supabase.from('branches').select('id, name, code').eq('is_active', true),
      supabase.from('products').select('id, name, code').eq('is_active', true),
    ]);

    const clients = clientsRes.data || [];
    const branches = branchesRes.data || [];
    const products = productsRes.data || [];

    const parsed: ParsedRow[] = rows.map((row, idx) => {
      const errors: string[] = [];
      
      // Match client
      const client = clients.find(c => 
        c.name.toLowerCase() === row.clientName.toLowerCase() || 
        c.code.toLowerCase() === row.clientName.toLowerCase()
      );
      if (!client && row.clientName) errors.push(`Unknown client: ${row.clientName}`);
      if (!row.clientName) errors.push('Client name is required');

      // Match branch
      const branch = branches.find(b => 
        b.name.toLowerCase() === row.branch.toLowerCase() || 
        b.code.toLowerCase() === row.branch.toLowerCase()
      );
      if (!branch && row.branch) errors.push(`Unknown branch: ${row.branch}`);
      if (!row.branch) errors.push('Branch is required');

      // Match product
      const product = products.find(p => 
        p.name.toLowerCase() === row.product.toLowerCase() || 
        p.code.toLowerCase() === row.product.toLowerCase()
      );
      if (!product && row.product) errors.push(`Unknown product: ${row.product}`);

      // Map verification type
      const vt = VERIFICATION_MAP[row.verification.toLowerCase()];
      if (!vt && row.verification) errors.push(`Unknown verification: ${row.verification}`);

      if (!row.applicantName) errors.push('Applicant name is required');

      return {
        ...row,
        rowIndex: idx + 2,
        errors,
        clientId: client?.id,
        branchId: branch?.id,
        productId: product?.id,
        verificationType: vt,
      };
    });

    setValidatedRows(parsed);
    return parsed;
  };

  const uploadMutation = useMutation({
    mutationFn: async ({ rows, fileName }: { rows: ParsedRow[]; fileName: string }) => {
      if (!user) throw new Error('Not authenticated');

      const validRows = rows.filter(r => r.errors.length === 0);
      if (validRows.length === 0) throw new Error('No valid rows to import');

      const primaryBranch = validRows[0].branchId;

      // Create bulk upload record
      const { data: upload, error: uploadError } = await supabase
        .from('bulk_uploads')
        .insert({
          uploaded_by: user.id,
          file_name: fileName,
          total_rows: rows.length,
          processed_rows: 0,
          failed_rows: rows.length - validRows.length,
          status: 'processing',
          branch_id: primaryBranch,
        })
        .select()
        .single();

      if (uploadError) throw uploadError;

      let processed = 0;
      const errors: any[] = [];

      for (const row of validRows) {
        try {
          const priority = PRIORITY_MAP[row.priority.toLowerCase()] || 'normal';
          const verTypes = row.verificationType ? [row.verificationType] : ['business'];

          // Create lead
          // Generate lead number
          const { data: leadNumData } = await supabase.rpc('generate_lead_number');
          const leadNumber = leadNumData || `RCU-${Date.now()}`;

          const { data: lead, error: leadError } = await supabase
            .from('leads')
            .insert({
              applicant_name: row.applicantName,
              address: row.applicantAddress,
              pincode: row.pinCode,
              client_id: row.clientId!,
              branch_id: row.branchId!,
              product_id: row.productId || row.clientId!,
              lead_number: leadNumber,
              created_by: user.id,
              priority: priority as any,
              verification_types: verTypes as any,
              category: row.category || null,
            })
            .select()
            .single();

          if (leadError) throw leadError;

          // Create primary applicant record
          await supabase.from('lead_applicants').insert({
            lead_id: lead.id,
            name: row.applicantName,
            applicant_type: 'primary',
            is_primary: true,
            phone: row.mobile || null,
          });

          // Add co-applicant if provided
          if (row.coApplicantName && row.coApplicantName !== 'NA') {
            await supabase.from('lead_applicants').insert({
              lead_id: lead.id,
              name: row.coApplicantName,
              applicant_type: 'co_applicant',
              is_primary: false,
            });
          }

          // Update task with FE code and geo limit if present (task auto-created by trigger)
          if (row.feCode || row.geoLimit) {
            const { data: tasks } = await supabase
              .from('tasks')
              .select('id')
              .eq('lead_id', lead.id);

            if (tasks) {
              for (const task of tasks) {
                await supabase
                  .from('tasks')
                  .update({
                    fe_code: row.feCode !== 'NA' ? row.feCode : null,
                    geo_limit: row.geoLimit !== 'NA' ? row.geoLimit : null,
                  })
                  .eq('id', task.id);
              }
            }
          }

          processed++;
        } catch (err: any) {
          errors.push({ row: row.rowIndex, error: err.message });
        }
      }

      // Update upload record
      await supabase
        .from('bulk_uploads')
        .update({
          processed_rows: processed,
          failed_rows: rows.length - processed,
          status: errors.length === 0 ? 'completed' : 'completed',
          error_log: errors,
        })
        .eq('id', upload.id);

      return { processed, failed: rows.length - validRows.length + errors.length, total: rows.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(`Imported ${result.processed} of ${result.total} cases successfully`);
    },
    onError: (error: Error) => {
      toast.error('Bulk upload failed', { description: error.message });
    },
  });

  return {
    validatedRows,
    validateRows,
    uploadMutation,
    setValidatedRows,
  };
}
