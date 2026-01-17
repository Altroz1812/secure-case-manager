import { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Phone, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotificationPreferences, useCreateOrUpdateNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { useAuth } from '@/hooks/useAuth';

interface PreferencesFormData {
  email_enabled: boolean;
  in_app_enabled: boolean;
  whatsapp_enabled: boolean;
  sms_enabled: boolean;
  task_assignment_enabled: boolean;
  sla_warning_enabled: boolean;
  reassignment_enabled: boolean;
  qc_result_enabled: boolean;
  daily_digest_enabled: boolean;
}

const defaultPreferences: PreferencesFormData = {
  email_enabled: true,
  in_app_enabled: true,
  whatsapp_enabled: false,
  sms_enabled: false,
  task_assignment_enabled: true,
  sla_warning_enabled: true,
  reassignment_enabled: true,
  qc_result_enabled: true,
  daily_digest_enabled: false,
};

export default function SettingsPage() {
  const { profile } = useAuth();
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updatePreferences = useCreateOrUpdateNotificationPreferences();
  
  const [formData, setFormData] = useState<PreferencesFormData>(defaultPreferences);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (preferences) {
      setFormData({
        email_enabled: preferences.email_enabled ?? true,
        in_app_enabled: preferences.in_app_enabled ?? true,
        whatsapp_enabled: preferences.whatsapp_enabled ?? false,
        sms_enabled: preferences.sms_enabled ?? false,
        task_assignment_enabled: preferences.task_assignment_enabled ?? true,
        sla_warning_enabled: preferences.sla_warning_enabled ?? true,
        reassignment_enabled: preferences.reassignment_enabled ?? true,
        qc_result_enabled: preferences.qc_result_enabled ?? true,
        daily_digest_enabled: preferences.daily_digest_enabled ?? false,
      });
    }
  }, [preferences]);

  const handleChange = (key: keyof PreferencesFormData, value: boolean) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updatePreferences.mutate(formData, {
      onSuccess: () => setHasChanges(false),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and notification preferences
          </p>
        </div>
        {hasChanges && (
          <Button onClick={handleSave} disabled={updatePreferences.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        )}
      </div>

      <Tabs defaultValue="notifications">
        <TabsList>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="account">
            Account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-6 mt-6">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <>
              {/* Notification Channels */}
              <Card>
                <CardHeader>
                  <CardTitle>Notification Channels</CardTitle>
                  <CardDescription>
                    Choose how you want to receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label htmlFor="in_app_enabled" className="font-medium">In-App Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications within the application
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="in_app_enabled"
                      checked={formData.in_app_enabled}
                      onCheckedChange={(v) => handleChange('in_app_enabled', v)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label htmlFor="email_enabled" className="font-medium">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via email
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="email_enabled"
                      checked={formData.email_enabled}
                      onCheckedChange={(v) => handleChange('email_enabled', v)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between opacity-60">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label htmlFor="whatsapp_enabled" className="font-medium">WhatsApp Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via WhatsApp (Coming Soon)
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="whatsapp_enabled"
                      checked={formData.whatsapp_enabled}
                      onCheckedChange={(v) => handleChange('whatsapp_enabled', v)}
                      disabled
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between opacity-60">
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label htmlFor="sms_enabled" className="font-medium">SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via SMS (Coming Soon)
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="sms_enabled"
                      checked={formData.sms_enabled}
                      onCheckedChange={(v) => handleChange('sms_enabled', v)}
                      disabled
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Notification Types */}
              <Card>
                <CardHeader>
                  <CardTitle>Notification Types</CardTitle>
                  <CardDescription>
                    Choose which events you want to be notified about
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="task_assignment_enabled" className="font-medium">Task Assignments</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when a task is assigned to you
                      </p>
                    </div>
                    <Switch
                      id="task_assignment_enabled"
                      checked={formData.task_assignment_enabled}
                      onCheckedChange={(v) => handleChange('task_assignment_enabled', v)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sla_warning_enabled" className="font-medium">SLA Warnings</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when tasks are approaching SLA deadline
                      </p>
                    </div>
                    <Switch
                      id="sla_warning_enabled"
                      checked={formData.sla_warning_enabled}
                      onCheckedChange={(v) => handleChange('sla_warning_enabled', v)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="reassignment_enabled" className="font-medium">Task Reassignments</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when tasks are reassigned
                      </p>
                    </div>
                    <Switch
                      id="reassignment_enabled"
                      checked={formData.reassignment_enabled}
                      onCheckedChange={(v) => handleChange('reassignment_enabled', v)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="qc_result_enabled" className="font-medium">QC Results</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when QC approves or rejects your work
                      </p>
                    </div>
                    <Switch
                      id="qc_result_enabled"
                      checked={formData.qc_result_enabled}
                      onCheckedChange={(v) => handleChange('qc_result_enabled', v)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="daily_digest_enabled" className="font-medium">Daily Digest</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive a daily summary of your tasks and activities
                      </p>
                    </div>
                    <Switch
                      id="daily_digest_enabled"
                      checked={formData.daily_digest_enabled}
                      onCheckedChange={(v) => handleChange('daily_digest_enabled', v)}
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="account" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground text-sm">Full Name</Label>
                <p className="font-medium">{profile?.full_name || 'Not set'}</p>
              </div>
              <Separator />
              <div>
                <Label className="text-muted-foreground text-sm">Email</Label>
                <p className="font-medium">{profile?.email || 'Not set'}</p>
              </div>
              <Separator />
              <div>
                <Label className="text-muted-foreground text-sm">Phone</Label>
                <p className="font-medium">{profile?.phone || 'Not set'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
