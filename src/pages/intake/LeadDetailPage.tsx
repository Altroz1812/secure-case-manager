import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  FileText, 
  User, 
  Building, 
  MapPin, 
  Calendar,
  ClipboardList,
  Users
} from 'lucide-react';
import { format } from 'date-fns';
import { MultiApplicantForm } from '@/components/intake/MultiApplicantForm';
import type { Database } from '@/integrations/supabase/types';

type PriorityLevel = Database['public']['Enums']['priority_level'];
type VerificationType = Database['public']['Enums']['verification_type'];

const priorityColors: Record<string, string> = {
  normal: 'bg-blue-100 text-blue-700',
  urgent: 'bg-red-100 text-red-700',
};

const verificationTypeLabels: Record<VerificationType, string> = {
  profile: 'Profile Check',
  bgv: 'Background Verification',
  residential: 'Residential Verification',
  business: 'Business Verification',
  itr: 'ITR Verification',
  bank: 'Bank Verification',
  property: 'Property Verification',
  end_use: 'End Use Verification',
};

interface LeadDetails {
  id: string;
  lead_number: string;
  applicant_name: string;
  application_number: string | null;
  loan_number: string | null;
  address: string | null;
  pincode: string | null;
  priority: PriorityLevel | null;
  verification_types: VerificationType[];
  created_at: string;
  updated_at: string;
  client: { id: string; name: string; code: string } | null;
  branch: { id: string; name: string; code: string; city: string } | null;
  product: { id: string; name: string; code: string } | null;
  tasks: Array<{
    id: string;
    task_number: string;
    verification_type: VerificationType;
    status: string;
    assigned_at: string | null;
    completed_at: string | null;
  }>;
}

function useLeadDetails(leadId: string | undefined) {
  return useQuery({
    queryKey: ['lead-details', leadId],
    queryFn: async () => {
      if (!leadId) throw new Error('Lead ID required');

      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          client:clients(id, name, code),
          branch:branches!leads_branch_id_fkey(id, name, code, city),
          product:products(id, name, code),
          tasks(id, task_number, verification_type, status, assigned_at, completed_at)
        `)
        .eq('id', leadId)
        .single();

      if (error) throw error;
      return data as LeadDetails;
    },
    enabled: !!leadId,
  });
}

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: lead, isLoading, error } = useLeadDetails(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Lead not found</h2>
        <Button variant="link" onClick={() => navigate('/leads')}>
          Back to Leads
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/leads')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              {lead.lead_number}
            </h1>
            <p className="text-muted-foreground">{lead.applicant_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={priorityColors[lead.priority || 'normal']}>
            {(lead.priority || 'normal').toUpperCase()}
          </Badge>
          <Badge variant="outline">{lead.client?.code || 'N/A'}</Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <User className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="applicants" className="gap-2">
            <Users className="h-4 w-4" />
            Applicants
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Tasks ({lead.tasks?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Lead Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Lead Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Lead Number</p>
                    <p className="font-mono font-medium">{lead.lead_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Applicant Name</p>
                    <p className="font-medium">{lead.applicant_name}</p>
                  </div>
                  {lead.application_number && (
                    <div>
                      <p className="text-sm text-muted-foreground">Application No.</p>
                      <p className="font-medium">{lead.application_number}</p>
                    </div>
                  )}
                  {lead.loan_number && (
                    <div>
                      <p className="text-sm text-muted-foreground">Loan Number</p>
                      <p className="font-medium">{lead.loan_number}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Address */}
              {lead.address && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{lead.address}</p>
                    {lead.pincode && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Pincode: {lead.pincode}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Verification Types */}
              <Card>
                <CardHeader>
                  <CardTitle>Verification Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {lead.verification_types.map((type) => (
                      <Badge key={type} variant="secondary">
                        {verificationTypeLabels[type] || type}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Client & Product
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Client</p>
                    <p className="font-medium">{lead.client?.name || 'N/A'}</p>
                    {lead.client?.code && (
                      <Badge variant="outline" className="mt-1">{lead.client.code}</Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Product</p>
                    <p className="font-medium">{lead.product?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Branch</p>
                    <p className="font-medium">{lead.branch?.name || 'N/A'}</p>
                    {lead.branch?.city && (
                      <p className="text-sm text-muted-foreground">{lead.branch.city}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p>{format(new Date(lead.created_at), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p>{format(new Date(lead.updated_at), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Applicants Tab - Phase 1 Integration */}
        <TabsContent value="applicants">
          <MultiApplicantForm leadId={lead.id} />
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Associated Tasks</CardTitle>
              <CardDescription>
                Verification tasks generated from this lead
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!lead.tasks || lead.tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tasks created yet for this lead.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lead.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/tasks/${task.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-mono font-medium">{task.task_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {verificationTypeLabels[task.verification_type] || task.verification_type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={
                            task.status === 'approved' ? 'default' :
                            task.status === 'rejected' ? 'destructive' :
                            'secondary'
                          }
                        >
                          {task.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          View →
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
