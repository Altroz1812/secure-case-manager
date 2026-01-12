import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLeads, LeadWithDetails } from '@/hooks/useLeads';
import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Plus, Eye, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const verificationTypeLabels: Record<string, string> = {
  residence: 'RV',
  office: 'OV',
  business: 'BV',
  document_verification: 'DV',
  tele_verification: 'TV',
  reference_check: 'RC',
  asset_verification: 'AV',
  income_verification: 'IV',
  bank: 'BK',
  residential: 'RS',
};

export default function LeadsListPage() {
  const navigate = useNavigate();
  const { data: leads, isLoading } = useLeads();

  const handleViewLead = (lead: LeadWithDetails) => {
    navigate(`/leads/${lead.id}`);
  };

  const columns = [
    { 
      key: 'lead_number', 
      header: 'Lead #',
      render: (lead: LeadWithDetails) => (
        <span className="font-mono font-medium">{lead.lead_number}</span>
      ),
    },
    {
      key: 'applicant_name',
      header: 'Applicant',
      render: (lead: LeadWithDetails) => (
        <div>
          <p className="font-medium">{lead.applicant_name}</p>
          {lead.application_number && (
            <p className="text-xs text-muted-foreground">App: {lead.application_number}</p>
          )}
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      render: (lead: LeadWithDetails) => (
        <Badge variant="outline">{lead.client?.code || 'N/A'}</Badge>
      ),
    },
    {
      key: 'branch',
      header: 'Branch',
      render: (lead: LeadWithDetails) => (
        <span className="text-sm">{lead.branch?.name || 'N/A'}</span>
      ),
    },
    {
      key: 'verification_types',
      header: 'Verifications',
      render: (lead: LeadWithDetails) => (
        <div className="flex flex-wrap gap-1">
          {lead.verification_types.map(type => (
            <Badge key={type} variant="secondary" className="text-xs">
              {verificationTypeLabels[type] || type}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (lead: LeadWithDetails) => (
        <Badge className={priorityColors[lead.priority || 'normal']}>
          {(lead.priority || 'normal').toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (lead: LeadWithDetails) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(lead.created_at), 'MMM dd, yyyy')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (lead: LeadWithDetails) => (
        <Button variant="ghost" size="icon" onClick={() => handleViewLead(lead)}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const todayLeads = leads?.filter(l => {
    const today = new Date();
    const createdAt = new Date(l.created_at);
    return createdAt.toDateString() === today.toDateString();
  }).length || 0;

  const urgentLeads = leads?.filter(l => {
    const p = l.priority;
    return p === 'urgent' || p === 'high';
  }).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Leads
          </h1>
          <p className="text-muted-foreground">View and manage verification leads</p>
        </div>
        <Button onClick={() => navigate('/leads/new')}>
          <Plus className="h-4 w-4 mr-2" /> Create Lead
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{leads?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Created Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{todayLeads}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">High/Urgent Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{urgentLeads}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {leads?.filter(l => {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return new Date(l.created_at) > weekAgo;
              }).length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      <DataTable
        data={leads || []}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search leads..."
        searchKeys={['lead_number', 'applicant_name', 'application_number', 'loan_number']}
      />
    </div>
  );
}
