import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useCaseFieldData, useSaveCaseFieldData } from '@/hooks/useCaseFieldData';
import { useUpdateTaskStatus, TaskWithDetails } from '@/hooks/useTasks';
import { Save, Send, Building, User, ClipboardCheck } from 'lucide-react';

interface Props {
  task: TaskWithDetails;
  readOnly?: boolean;
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

export function FieldVerificationForm({ task, readOnly = false }: Props) {
  const { data: caseData, isLoading } = useCaseFieldData(task.id);
  const saveMutation = useSaveCaseFieldData();
  const updateStatus = useUpdateTaskStatus();
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (caseData?.field_data) {
      setFormData(caseData.field_data);
    } else {
      // Pre-fill with visit date
      setFormData({ visit_date_time: new Date().toISOString().slice(0, 16) });
    }
  }, [caseData]);

  const updateField = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveMutation.mutate({
      taskId: task.id,
      fieldData: formData,
      formType: task.verification_type === 'residential' ? 'RV' : 'BV',
    });
  };

  const handleSubmit = () => {
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
      {/* Pre-filled info from CSV */}
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

      {/* Actions */}
      {!disabled && (
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={handleSave} disabled={saveMutation.isPending}>
            <Save className="h-4 w-4 mr-2" /> Save Draft
          </Button>
          <Button onClick={handleSubmit} disabled={saveMutation.isPending || updateStatus.isPending}>
            <Send className="h-4 w-4 mr-2" /> Submit Verification
          </Button>
        </div>
      )}
    </div>
  );
}
