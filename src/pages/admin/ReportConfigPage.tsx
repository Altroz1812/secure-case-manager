import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Plus, Settings, Trash2, Edit, FileText, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import {
  useClientReportConfigs,
  useCreateClientReportConfig,
  useUpdateClientReportConfig,
  useDeleteClientReportConfig,
  type ClientReportConfigWithClient,
} from '@/hooks/useClientReportConfigs';
import { useClients } from '@/hooks/useClients';
import type { Json } from '@/integrations/supabase/types';
import ReportTemplateBuilder from '@/components/reports/ReportTemplateBuilder';
import { TemplateConfig } from '@/components/reports/reportTypes';

const REPORT_TYPES = [
  { value: 'verification_report', label: 'Verification Report' },
  { value: 'consolidated_report', label: 'Consolidated Report' },
  { value: 'mis_report', label: 'MIS Report' },
];

const DEFAULT_TEMPLATE: TemplateConfig = {
  pageSize: 'A4',
  orientation: 'portrait',
  margins: { top: 40, right: 30, bottom: 40, left: 30 },
  blocks: [],
};

export default function ReportConfigPage() {
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ClientReportConfigWithClient | null>(null);

  // Form state for create dialog
  const [createForm, setCreateForm] = useState({
    client_id: '',
    report_type: '' as string,
    config_name: '',
    is_active: true,
  });

  // Builder state
  const [builderTemplate, setBuilderTemplate] = useState<TemplateConfig>(DEFAULT_TEMPLATE);
  const [builderName, setBuilderName] = useState('');
  const [builderActive, setBuilderActive] = useState(true);

  const { data: configs, isLoading } = useClientReportConfigs(selectedClient || undefined);
  const { data: clients } = useClients();
  const createConfig = useCreateClientReportConfig();
  const updateConfig = useUpdateClientReportConfig();
  const deleteConfig = useDeleteClientReportConfig();

  const handleCreate = () => {
    if (!createForm.client_id || !createForm.report_type || !createForm.config_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    createConfig.mutate({
      client_id: createForm.client_id,
      report_type: createForm.report_type as 'verification_report' | 'consolidated_report' | 'mis_report',
      config_name: createForm.config_name,
      template_config: DEFAULT_TEMPLATE as unknown as Json,
      header_config: {} as Json,
      field_mappings: {} as Json,
      is_active: createForm.is_active,
    }, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setCreateForm({ client_id: '', report_type: '', config_name: '', is_active: true });
        toast.success('Configuration created. Click Edit to design your template.');
      },
    });
  };

  const startEditing = (config: ClientReportConfigWithClient) => {
    const tc = config.template_config as any;
    const template: TemplateConfig = tc?.blocks
      ? { pageSize: tc.pageSize || 'A4', orientation: tc.orientation || 'portrait', margins: tc.margins || { top: 40, right: 30, bottom: 40, left: 30 }, blocks: tc.blocks }
      : DEFAULT_TEMPLATE;
    setBuilderTemplate(template);
    setBuilderName(config.config_name);
    setBuilderActive(config.is_active);
    setEditingConfig(config);
  };

  const saveEditing = () => {
    if (!editingConfig) return;
    updateConfig.mutate({
      id: editingConfig.id,
      updates: {
        config_name: builderName,
        template_config: builderTemplate as unknown as Json,
        is_active: builderActive,
      },
    }, {
      onSuccess: () => {
        setEditingConfig(null);
      },
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this configuration?')) {
      deleteConfig.mutate(id);
    }
  };

  // If editing, show the builder
  if (editingConfig) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setEditingConfig(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="flex-1">
            <Input
              value={builderName}
              onChange={e => setBuilderName(e.target.value)}
              className="h-8 text-lg font-semibold border-none shadow-none px-0 focus-visible:ring-0"
              placeholder="Configuration name"
            />
            <div className="text-xs text-muted-foreground">
              {editingConfig.client?.name} · {REPORT_TYPES.find(t => t.value === editingConfig.report_type)?.label}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={builderActive} onCheckedChange={setBuilderActive} />
            <Label className="text-xs">Active</Label>
          </div>
          <Button onClick={saveEditing} disabled={updateConfig.isPending}>
            Save Configuration
          </Button>
        </div>

        <ReportTemplateBuilder value={builderTemplate} onChange={setBuilderTemplate} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Report Configurations</h1>
          <p className="text-muted-foreground">
            Design client-specific PDF report templates with visual builder
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Configuration
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Report Configuration</DialogTitle>
              <DialogDescription>
                Set up a new template — you'll design the layout in the visual builder after creation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client *</Label>
                  <Select value={createForm.client_id} onValueChange={v => setCreateForm(p => ({ ...p, client_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                    <SelectContent>
                      {clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Report Type *</Label>
                  <Select value={createForm.report_type} onValueChange={v => setCreateForm(p => ({ ...p, report_type: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {REPORT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Configuration Name *</Label>
                <Input
                  value={createForm.config_name}
                  onChange={e => setCreateForm(p => ({ ...p, config_name: e.target.value }))}
                  placeholder="e.g., FI Report - Standard"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch checked={createForm.is_active} onCheckedChange={v => setCreateForm(p => ({ ...p, is_active: v }))} />
                <Label>Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createConfig.isPending}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <Select value={selectedClient || 'all'} onValueChange={v => setSelectedClient(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[250px]"><SelectValue placeholder="Filter by Client" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : configs?.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {configs.map(config => {
            const tc = config.template_config as any;
            const blockCount = tc?.blocks?.length || 0;
            return (
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
                    <div className="text-xs text-muted-foreground">
                      {blockCount} block{blockCount !== 1 ? 's' : ''} configured
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => startEditing(config)}>
                        <Edit className="mr-1 h-3 w-3" /> Design
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(config.id)}>
                        <Trash2 className="mr-1 h-3 w-3" /> Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
    </div>
  );
}
