import { useState } from 'react';
import { Plus, Trash2, Users, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { useClientUserAssignments, useClientViewerUsers, useCreateClientUserAssignment, useDeleteClientUserAssignment, ClientUserAssignmentWithDetails } from '@/hooks/useClientUserAssignments';
import { useClients } from '@/hooks/useClients';
import { format } from 'date-fns';

export default function ClientUserAssignmentsPage() {
  const { data: assignments = [], isLoading } = useClientUserAssignments();
  const { data: clientViewerUsers = [], isLoading: isLoadingUsers } = useClientViewerUsers();
  const { data: clients = [], isLoading: isLoadingClients } = useClients();
  const createAssignment = useCreateClientUserAssignment();
  const deleteAssignment = useDeleteClientUserAssignment();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  const activeClients = clients.filter(c => c.is_active);

  // Filter out users that are already assigned to the selected client
  const getAvailableUsersForClient = (clientId: string) => {
    const assignedUserIds = assignments
      .filter(a => a.client_id === clientId)
      .map(a => a.user_id);
    return clientViewerUsers.filter(u => !assignedUserIds.includes(u.user_id));
  };

  // Filter out clients that the selected user is already assigned to
  const getAvailableClientsForUser = (userId: string) => {
    const assignedClientIds = assignments
      .filter(a => a.user_id === userId)
      .map(a => a.client_id);
    return activeClients.filter(c => !assignedClientIds.includes(c.id));
  };

  const handleOpenDialog = () => {
    setSelectedUserId('');
    setSelectedClientId('');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedUserId('');
    setSelectedClientId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId || !selectedClientId) return;

    try {
      await createAssignment.mutateAsync({
        userId: selectedUserId,
        clientId: selectedClientId,
      });
      handleCloseDialog();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleDelete = async (id: string) => {
    await deleteAssignment.mutateAsync(id);
  };

  const columns = [
    {
      key: 'user',
      header: 'User',
      render: (assignment: ClientUserAssignmentWithDetails) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{assignment.user?.full_name || 'Unknown User'}</div>
            <div className="text-sm text-muted-foreground">{assignment.user?.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      render: (assignment: ClientUserAssignmentWithDetails) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{assignment.client?.name || 'Unknown Client'}</div>
            <Badge variant="outline" className="text-xs">{assignment.client?.code}</Badge>
          </div>
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Assigned On',
      render: (assignment: ClientUserAssignmentWithDetails) => (
        <span className="text-muted-foreground">
          {format(new Date(assignment.created_at), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'w-24',
      render: (assignment: ClientUserAssignmentWithDetails) => (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={(e) => e.stopPropagation()}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Assignment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove "{assignment.user?.full_name}" from "{assignment.client?.name}"? 
                This user will no longer have access to this client's data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => handleDelete(assignment.id)}
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ),
    },
  ];

  const availableClients = selectedUserId ? getAvailableClientsForUser(selectedUserId) : activeClients;
  const availableUsers = selectedClientId ? getAvailableUsersForClient(selectedClientId) : clientViewerUsers;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Client User Assignments</h1>
          <p className="text-muted-foreground">Manage which client portal users can access specific clients</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Assign User to Client</DialogTitle>
              <DialogDescription>
                Select a client portal user and assign them access to a client.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="user">Client Viewer User *</Label>
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        {isLoadingUsers ? 'Loading...' : 'No client viewer users available'}
                      </div>
                    ) : (
                      availableUsers.map(user => (
                        <SelectItem key={user.user_id} value={user.user_id}>
                          {user.full_name} ({user.email})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Only users with the "client_viewer" role are shown here.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <Select
                  value={selectedClientId}
                  onValueChange={setSelectedClientId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableClients.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        {isLoadingClients ? 'Loading...' : 'No clients available'}
                      </div>
                    ) : (
                      availableClients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} ({client.code})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={!selectedUserId || !selectedClientId || createAssignment.isPending}
                >
                  {createAssignment.isPending ? 'Assigning...' : 'Assign'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {clientViewerUsers.length === 0 && !isLoadingUsers && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-medium mb-2">No Client Viewer Users</h3>
              <p className="text-sm">
                To assign users to clients, first add the "client_viewer" role to users in the 
                <a href="/admin/users" className="text-primary hover:underline ml-1">User Management</a> page.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Assignments</CardTitle>
          <CardDescription>
            Client portal users and their assigned clients. Users can only see data for their assigned clients.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={assignments}
            columns={columns}
            searchPlaceholder="Search by user or client..."
            searchKeys={['user.full_name', 'user.email', 'client.name', 'client.code']}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
