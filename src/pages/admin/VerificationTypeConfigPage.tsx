import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Clock, Settings, Check, X, Plus, Pencil, Trash2, MapPin, Building } from 'lucide-react';
import {
  useVerificationTypeConfigs,
  useCreateVerificationTypeConfig,
  useUpdateVerificationTypeConfig,
  useDeleteVerificationTypeConfig,
  VerificationTypeConfig,
  VerificationType,
  VERIFICATION_TYPE_LABELS,
} from '@/hooks/useVerificationTypeConfig';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Constants } from '@/integrations/supabase/types';

const verificationTypes = Constants.public.Enums.verification_type;

const formSchema = z.object({
  type: z.enum(verificationTypes as unknown as [string, ...string[]]),
  display_name: z.string().min(2, 'Display name must be at least 2 characters'),
  sla_hours: z.coerce.number().min(1, 'SLA hours must be at least 1'),
  is_field_verification: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

export default function VerificationTypeConfigPage() {
  const { data: configs, isLoading } = useVerificationTypeConfigs();
  const createConfig = useCreateVerificationTypeConfig();
  const updateConfig = useUpdateVerificationTypeConfig();
  const deleteConfig = useDeleteVerificationTypeConfig();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<VerificationTypeConfig | null>(null);
  const [deletingConfig, setDeletingConfig] = useState<VerificationTypeConfig | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'profile',
      display_name: '',
      sla_hours: 24,
      is_field_verification: false,
      is_active: true,
    },
  });

  const configuredTypes = configs?.map(c => c.type) || [];
  const availableTypes = verificationTypes.filter(t => !configuredTypes.includes(t) || editingConfig?.type === t);

  const openCreateDialog = () => {
    form.reset({
      type: availableTypes[0] || 'profile',
      display_name: '',
      sla_hours: 24,
      is_field_verification: false,
      is_active: true,
    });
    setEditingConfig(null);
    setIsFormOpen(true);
  };

  const openEditDialog = (config: VerificationTypeConfig) => {
    form.reset({
      type: config.type,
      display_name: config.display_name,
      sla_hours: config.sla_hours,
      is_field_verification: config.is_field_verification ?? false,
      is_active: config.is_active ?? true,
    });
    setEditingConfig(config);
    setIsFormOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    if (editingConfig) {
      await updateConfig.mutateAsync({
        id: editingConfig.id,
        display_name: values.display_name,
        sla_hours: values.sla_hours,
        is_field_verification: values.is_field_verification,
        is_active: values.is_active,
      });
    } else {
      await createConfig.mutateAsync({
        type: values.type as VerificationType,
        display_name: values.display_name,
        sla_hours: values.sla_hours,
        is_field_verification: values.is_field_verification,
        is_active: values.is_active,
      });
    }
    setIsFormOpen(false);
  };

  const handleDelete = async () => {
    if (deletingConfig) {
      await deleteConfig.mutateAsync(deletingConfig.id);
      setDeletingConfig(null);
    }
  };

  const activeConfigs = configs?.filter(c => c.is_active) || [];
  const fieldVerificationConfigs = configs?.filter(c => c.is_field_verification) || [];
  const avgSlaHours = configs?.length 
    ? Math.round(configs.reduce((sum, c) => sum + c.sla_hours, 0) / configs.length) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Verification Type Configuration</h1>
          <p className="text-muted-foreground">
            Manage SLA hours and display settings for each verification type
          </p>
        </div>
        <Button onClick={openCreateDialog} disabled={availableTypes.length === 0}>
          <Plus className="mr-2 h-4 w-4" />
          Add Configuration
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Configured</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{configs?.length || 0}</div>
            <p className="text-xs text-muted-foreground">of {verificationTypes.length} types</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Types</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeConfigs.length}</div>
            <p className="text-xs text-muted-foreground">enabled for use</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Field Verifications</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fieldVerificationConfigs.length}</div>
            <p className="text-xs text-muted-foreground">require field visits</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg SLA Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSlaHours}h</div>
            <p className="text-xs text-muted-foreground">average deadline</p>
          </CardContent>
        </Card>
      </div>

      {/* Configuration List */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration List</CardTitle>
          <CardDescription>
            All verification types and their settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : configs?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Settings className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No configurations yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first verification type configuration to get started
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Configuration
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {configs?.map((config) => (
                <div
                  key={config.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      {config.is_field_verification ? (
                        <MapPin className="h-5 w-5 text-primary" />
                      ) : (
                        <Building className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{config.display_name}</span>
                        <Badge variant="outline" className="font-mono text-xs">
                          {config.type}
                        </Badge>
                        {!config.is_active && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {config.sla_hours} hours SLA
                        </span>
                        {config.is_field_verification && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Field Verification
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(config)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingConfig(config)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? 'Edit Configuration' : 'Add Configuration'}
            </DialogTitle>
            <DialogDescription>
              {editingConfig
                ? 'Update the verification type settings'
                : 'Configure a new verification type'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!!editingConfig}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(editingConfig ? [editingConfig.type] : availableTypes).map((type) => (
                          <SelectItem key={type} value={type}>
                            {VERIFICATION_TYPE_LABELS[type as VerificationType] || type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="display_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Residential Address Verification" {...field} />
                    </FormControl>
                    <FormDescription>
                      The name shown in the UI
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sla_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SLA Hours</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} placeholder="24" {...field} />
                    </FormControl>
                    <FormDescription>
                      Maximum hours to complete this verification
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_field_verification"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Field Verification</FormLabel>
                      <FormDescription>
                        Requires a physical site visit
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Enable this verification type
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createConfig.isPending || updateConfig.isPending}
                >
                  {editingConfig ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingConfig} onOpenChange={() => setDeletingConfig(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the configuration for "{deletingConfig?.display_name}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
