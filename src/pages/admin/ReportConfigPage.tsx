import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Settings, Trash2, Edit, FileText } from 'lucide-react';
import { toast } from 'sonner';
import {
  useClientReportConfigs,
  useCreateClientReportConfig,
  useUpdateClientReportConfig,
  useDeleteClientReportConfig,
} from '@/hooks/useClientReportConfigs';
import { useClients } from '@/hooks/useClients';
import type { Json } from '@/integrations/supabase/types';

const REPORT_TYPES = [
  { value: 'verification_report', label: 'Verification Report' },
  { value: 'consolidated_report', label: 'Consolidated Report' },
  { value: 'mis_report', label: 'MIS Report' },
];

export default function ReportConfigPage() {
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    client_id: '',
    report_type: '' as 'verification_report' | 'consolidated_report' | 'mis_report' | '',
    config_name: '',
    template_config: '{}',
    header_config: '{}',
    field_mappings: '{}',
    is_active: true,
  });

  const { data: configs, isLoading } = useClientReportConfigs(selectedClient || undefined);
  const { data: clients } = useClients();
  const createConfig = useCreateClientReportConfig();
  const updateConfig = useUpdateClientReportConfig();
  const deleteConfig = useDeleteClientReportConfig();

  const resetForm = () => {
    setFormData({
      client_id: '',
      report_type: '',
      config_name: '',
      template_config: '{}',
      header_config: '{}',
      field_mappings: '{}',
      is_active: true,
    });
  };

  const handleCreate = () => {
    if (!formData.client_id || !formData.report_type || !formData.config_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const templateConfig = JSON.parse(formData.template_config);
      const headerConfig = JSON.parse(formData.header_config);
      const fieldMappings = JSON.parse(formData.field_mappings);

      createConfig.mutate({
        client_id: formData.client_id,
        report_type: formData.report_type as 'verification_report' | 'consolidated_report' | 'mis_report',
        config_name: formData.config_name,
        template_config: templateConfig as Json,
        header_config: headerConfig as Json,
        field_mappings: fieldMappings as Json,
        is_active: formData.is_active,
      }, {
        onSuccess: () => {
          setIsCreateOpen(false);
          resetForm();
        },
      });
    } catch (error) {
      toast.error('Invalid JSON in configuration fields');
    }
  };

  const handleUpdate = (id: string) => {
    try {
      const templateConfig = JSON.parse(formData.template_config);
      const headerConfig = JSON.parse(formData.header_config);
      const fieldMappings = JSON.parse(formData.field_mappings);

      updateConfig.mutate({
        id,
        updates: {
          config_name: formData.config_name,
          template_config: templateConfig,
          header_config: headerConfig,
          field_mappings: fieldMappings,
          is_active: formData.is_active,
        },
      }, {
        onSuccess: () => {
          setEditingConfig(null);
          resetForm();
        },
      });
    } catch (error) {
      toast.error('Invalid JSON in configuration fields');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this configuration?')) {
      deleteConfig.mutate(id);
    }
  };

  const startEditing = (config: any) => {
    setFormData({
      client_id: config.client_id,
      report_type: config.report_type,
      config_name: config.config_name,
      template_config: JSON.stringify(config.template_config, null, 2),
      header_config: JSON.stringify(config.header_config, null, 2),
      field_mappings: JSON.stringify(config.field_mappings, null, 2),
      is_active: config.is_active,
    });
    setEditingConfig(config.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Report Configurations</h1>
          <p className="text-muted-foreground">
            Configure client-specific report formats and templates
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              New Configuration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Report Configuration</DialogTitle>
              <DialogDescription>
                Configure a new report template for a client
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client *</Label>
                  <Select 
                    value={formData.client_id} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, client_id: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Report Type *</Label>
                  <Select 
                    value={formData.report_type} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, report_type: v as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {REPORT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Configuration Name *</Label>
                <Input
                  value={formData.config_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, config_name: e.target.value }))}
                  placeholder="e.g., Standard Verification Template"
                />
              </div>
              <div className="space-y-2">
                <Label>Template Configuration (JSON)</Label>
                <Textarea
                  value={formData.template_config}
                  onChange={(e) => setFormData(prev => ({ ...prev, template_config: e.target.value }))}
                  className="font-mono text-sm"
                  rows={4}
                  placeholder='{"logo_position": "top-left", "page_size": "A4"}'
                />
              </div>
              <div className="space-y-2">
                <Label>Header Configuration (JSON)</Label>
                <Textarea
                  value={formData.header_config}
                  onChange={(e) => setFormData(prev => ({ ...prev, header_config: e.target.value }))}
                  className="font-mono text-sm"
                  rows={4}
                  placeholder='{"title": "Verification Report", "show_date": true}'
                />
              </div>
              <div className="space-y-2">
                <Label>Field Mappings (JSON)</Label>
                <Textarea
                  value={formData.field_mappings}
                  onChange={(e) => setFormData(prev => ({ ...prev, field_mappings: e.target.value }))}
                  className="font-mono text-sm"
                  rows={4}
                  placeholder='{"applicant_name": "Applicant Name", "address": "Residence Address"}'
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_active: v }))}
                />
                <Label>Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createConfig.isPending}>
                Create Configuration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Filter by Client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Clients</SelectItem>
                {clients?.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Configurations Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : configs?.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {configs.map((config) => (
            <Card key={config.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{config.config_name}</CardTitle>
                    <CardDescription>{config.client?.name}</CardDescription>
                  </div>
                  <Badge variant={config.is_active ? 'default' : 'secondary'}>
                    {config.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {REPORT_TYPES.find(t => t.value === config.report_type)?.label}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditing(config)}
                    >
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(config.id)}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No configurations found</h3>
            <p className="text-muted-foreground text-sm">
              Create a new report configuration to get started
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingConfig} onOpenChange={(open) => !open && setEditingConfig(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Configuration</DialogTitle>
            <DialogDescription>
              Update the report configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Configuration Name</Label>
              <Input
                value={formData.config_name}
                onChange={(e) => setFormData(prev => ({ ...prev, config_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Template Configuration (JSON)</Label>
              <Textarea
                value={formData.template_config}
                onChange={(e) => setFormData(prev => ({ ...prev, template_config: e.target.value }))}
                className="font-mono text-sm"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Header Configuration (JSON)</Label>
              <Textarea
                value={formData.header_config}
                onChange={(e) => setFormData(prev => ({ ...prev, header_config: e.target.value }))}
                className="font-mono text-sm"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Field Mappings (JSON)</Label>
              <Textarea
                value={formData.field_mappings}
                onChange={(e) => setFormData(prev => ({ ...prev, field_mappings: e.target.value }))}
                className="font-mono text-sm"
                rows={4}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_active: v }))}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingConfig(null)}>
              Cancel
            </Button>
            <Button 
              onClick={() => editingConfig && handleUpdate(editingConfig)} 
              disabled={updateConfig.isPending}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
