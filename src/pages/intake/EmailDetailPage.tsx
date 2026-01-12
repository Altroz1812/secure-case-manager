import { useParams, useNavigate } from 'react-router-dom';
import { useEmail, useAssignEmailBranch } from '@/hooks/useEmails';
import { useBranches } from '@/hooks/useBranches';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Mail, Paperclip, Calendar, User, Building2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

export default function EmailDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: email, isLoading } = useEmail(id);
  const { data: branches } = useBranches();
  const assignBranch = useAssignEmailBranch();
  
  const [selectedBranch, setSelectedBranch] = useState<string>('');

  const handleAssignBranch = () => {
    if (!id || !selectedBranch) return;
    assignBranch.mutate({ id, branchId: selectedBranch }, {
      onSuccess: () => setSelectedBranch(''),
    });
  };

  const handleCreateLead = () => {
    navigate(`/leads/new?emailId=${id}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!email) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Email not found</p>
        <Button variant="link" onClick={() => navigate('/emails')}>
          Back to Inbox
        </Button>
      </div>
    );
  }

  const activeBranches = branches?.filter(b => b.is_active) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/emails')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Mail className="h-6 w-6" />
              Email Details
            </h1>
            <p className="text-muted-foreground">Review and process this email</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!email.is_processed && (
            <Button onClick={handleCreateLead}>
              <FileText className="h-4 w-4 mr-2" /> Create Lead from Email
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email Content */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{email.subject}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sender Info */}
              <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{email.sender_name || 'Unknown Sender'}</p>
                  <p className="text-sm text-muted-foreground">{email.sender_email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(email.received_at), 'MMM dd, yyyy')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(email.received_at), 'HH:mm')}
                  </p>
                </div>
              </div>

              {/* Email Body */}
              <div className="border rounded-lg p-4">
                {email.body_html ? (
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: email.body_html }}
                  />
                ) : (
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {email.body_preview || 'No content available'}
                  </p>
                )}
              </div>

              {/* Attachments */}
              {email.attachments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Attachments ({email.attachments.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {email.attachments.map(attachment => (
                      <div 
                        key={attachment.id}
                        className="flex items-center gap-2 p-2 border rounded hover:bg-muted cursor-pointer"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{attachment.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {attachment.file_type} • {attachment.file_size ? `${Math.round(attachment.file_size / 1024)} KB` : 'Unknown size'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={email.is_processed ? 'default' : 'destructive'} className="text-sm">
                {email.is_processed ? 'Processed' : 'Pending'}
              </Badge>
              {email.is_processed && email.processed_at && (
                <p className="text-xs text-muted-foreground mt-2">
                  Processed on {format(new Date(email.processed_at), 'MMM dd, yyyy HH:mm')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Branch Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Branch Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {email.branch_id ? (
                <Badge variant="secondary">
                  {branches?.find(b => b.id === email.branch_id)?.name || 'Unknown Branch'}
                </Badge>
              ) : (
                <p className="text-sm text-muted-foreground">No branch assigned</p>
              )}
              
              {!email.is_processed && (
                <div className="flex gap-2">
                  <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeBranches.map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name} ({branch.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    size="sm" 
                    onClick={handleAssignBranch}
                    disabled={!selectedBranch || assignBranch.isPending}
                  >
                    Assign
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {!email.is_processed && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full" 
                  onClick={handleCreateLead}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Create Lead
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
