import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmails, EmailWithAttachments } from '@/hooks/useEmails';
import { useBranches } from '@/hooks/useBranches';
import { DataTable } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Paperclip, Eye, FileText, Plus } from 'lucide-react';
import { format } from 'date-fns';

export default function EmailInboxPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'unprocessed' | 'processed' | 'all'>('unprocessed');
  
  const filter = activeTab === 'all' ? undefined : { processed: activeTab === 'processed' };
  const { data: emails, isLoading } = useEmails(filter);
  const { data: branches } = useBranches();

  const getBranchName = (branchId: string | null) => {
    if (!branchId) return 'Unassigned';
    const branch = branches?.find(b => b.id === branchId);
    return branch?.name || 'Unknown';
  };

  const handleViewEmail = (email: EmailWithAttachments) => {
    navigate(`/emails/${email.id}`);
  };

  const handleCreateLeadFromEmail = (email: EmailWithAttachments) => {
    navigate(`/leads/new?emailId=${email.id}`);
  };

  const columns = [
    {
      key: 'sender',
      header: 'From',
      render: (email: EmailWithAttachments) => (
        <div className="flex flex-col">
          <span className="font-medium">{email.sender_name || email.sender_email}</span>
          {email.sender_name && (
            <span className="text-xs text-muted-foreground">{email.sender_email}</span>
          )}
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (email: EmailWithAttachments) => (
        <div className="flex items-center gap-2">
          <span className="truncate max-w-xs">{email.subject}</span>
          {email.attachments.length > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              {email.attachments.length}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'received_at',
      header: 'Received',
      render: (email: EmailWithAttachments) => (
        <span className="text-sm">
          {format(new Date(email.received_at), 'MMM dd, yyyy HH:mm')}
        </span>
      ),
    },
    {
      key: 'branch_id',
      header: 'Branch',
      render: (email: EmailWithAttachments) => (
        <Badge variant={email.branch_id ? 'secondary' : 'outline'}>
          {getBranchName(email.branch_id)}
        </Badge>
      ),
    },
    {
      key: 'is_processed',
      header: 'Status',
      render: (email: EmailWithAttachments) => (
        <StatusBadge 
          active={email.is_processed || false} 
          activeLabel="Processed"
          inactiveLabel="Pending"
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (email: EmailWithAttachments) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleViewEmail(email)} title="View Email">
            <Eye className="h-4 w-4" />
          </Button>
          {!email.is_processed && (
            <Button variant="ghost" size="icon" onClick={() => handleCreateLeadFromEmail(email)} title="Create Lead">
              <FileText className="h-4 w-4 text-primary" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const unprocessedCount = emails?.filter(e => !e.is_processed).length || 0;
  const processedCount = emails?.filter(e => e.is_processed).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6" />
            Email Inbox
          </h1>
          <p className="text-muted-foreground">Process verification request emails and create leads</p>
        </div>
        <Button onClick={() => navigate('/leads/new')}>
          <Plus className="h-4 w-4 mr-2" /> Create Lead Manually
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unprocessed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{unprocessedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Processed Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{processedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Emails</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{emails?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Email List */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="unprocessed">
            Unprocessed
            {unprocessedCount > 0 && (
              <Badge variant="destructive" className="ml-2">{unprocessedCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="processed">Processed</TabsTrigger>
          <TabsTrigger value="all">All Emails</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-4">
          <DataTable
            data={emails || []}
            columns={columns}
            searchPlaceholder="Search emails..."
            searchKeys={['subject', 'sender_email', 'sender_name']}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
