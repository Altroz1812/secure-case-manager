import { useState } from 'react';
import { Pencil, Shield, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { useUsers, useUpdateProfile, useAssignRole, useRemoveRole, useAssignBranch, useRemoveBranch, type UserWithDetails } from '@/hooks/useUsers';
import { useBranches } from '@/hooks/useBranches';

const ALL_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'intake', label: 'Intake' },
  { value: 'analyst', label: 'Analyst' },
  { value: 'field_executive', label: 'Field Executive' },
  { value: 'qc', label: 'QC' },
  { value: 'ops_manager', label: 'Ops Manager' },
  { value: 'client_viewer', label: 'Client Viewer' },
] as const;

type AppRole = typeof ALL_ROLES[number]['value'];

export default function UsersPage() {
  const { data: users = [], isLoading } = useUsers();
  const { data: branches = [] } = useBranches();
  const updateProfile = useUpdateProfile();
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();
  const assignBranch = useAssignBranch();
  const removeBranch = useRemoveBranch();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithDetails | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    is_active: true,
  });
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');

  const handleOpenDialog = (user: UserWithDetails) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name,
      phone: user.phone || '',
      is_active: user.is_active ?? true,
    });
    setSelectedRole('');
    setSelectedBranch('');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingUser(null);
    setSelectedRole('');
    setSelectedBranch('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      await updateProfile.mutateAsync({
        id: editingUser.id,
        ...formData,
      });
      handleCloseDialog();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleAddRole = async () => {
    if (!editingUser || !selectedRole) return;
    await assignRole.mutateAsync({ userId: editingUser.user_id, role: selectedRole as AppRole });
    setSelectedRole('');
  };

  const handleRemoveRole = async (role: string) => {
    if (!editingUser) return;
    await removeRole.mutateAsync({ userId: editingUser.user_id, role: role as AppRole });
  };

  const handleAddBranch = async () => {
    if (!editingUser || !selectedBranch) return;
    const isPrimary = editingUser.branches.length === 0;
    await assignBranch.mutateAsync({ userId: editingUser.user_id, branchId: selectedBranch, isPrimary });
    setSelectedBranch('');
  };

  const handleRemoveBranch = async (branchId: string) => {
    if (!editingUser) return;
    await removeBranch.mutateAsync({ userId: editingUser.user_id, branchId });
  };

  const availableRoles = ALL_ROLES.filter(role => !editingUser?.roles.includes(role.value));
  const availableBranches = branches.filter(b => !editingUser?.branches.some(ub => ub.id === b.id));

  const columns = [
    { key: 'full_name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    {
      key: 'roles',
      header: 'Roles',
      render: (user: UserWithDetails) => (
        <div className="flex flex-wrap gap-1">
          {user.roles.length === 0 ? (
            <Badge variant="outline" className="text-xs text-muted-foreground">No roles</Badge>
          ) : (
            user.roles.map(role => (
              <Badge key={role} variant="secondary" className="text-xs capitalize">
                {role.replace('_', ' ')}
              </Badge>
            ))
          )}
        </div>
      ),
    },
    {
      key: 'branches',
      header: 'Branches',
      render: (user: UserWithDetails) => (
        <div className="flex flex-wrap gap-1">
          {user.branches.length === 0 ? (
            <Badge variant="outline" className="text-xs text-muted-foreground">No branches</Badge>
          ) : (
            user.branches.slice(0, 2).map(branch => (
              <Badge 
                key={branch.id} 
                variant={branch.is_primary ? 'default' : 'secondary'} 
                className="text-xs"
              >
                {branch.name}
              </Badge>
            ))
          )}
          {user.branches.length > 2 && (
            <Badge variant="outline" className="text-xs">+{user.branches.length - 2}</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      className: 'w-24',
      render: (user: UserWithDetails) => <StatusBadge active={user.is_active ?? true} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'w-20',
      render: (user: UserWithDetails) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenDialog(user);
          }}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">Manage users, roles, and branch assignments</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Users are created when they sign up. You can assign roles and branches here.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={users}
            columns={columns}
            searchPlaceholder="Search users..."
            searchKeys={['full_name', 'email']}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user profile, roles, and branch assignments.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={editingUser?.email || ''} disabled className="bg-muted" />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">Active Status</Label>
                <p className="text-sm text-muted-foreground">Inactive users cannot log in</p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            {/* Roles Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <Label>Roles</Label>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[32px] p-2 border rounded-md bg-muted/30">
                {editingUser?.roles.length === 0 ? (
                  <span className="text-sm text-muted-foreground">No roles assigned</span>
                ) : (
                  editingUser?.roles.map(role => (
                    <Badge key={role} variant="secondary" className="pl-2 pr-1 capitalize">
                      {role.replace('_', ' ')}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 ml-1 hover:bg-transparent"
                        onClick={() => handleRemoveRole(role)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))
                )}
              </div>
              {availableRoles.length > 0 && (
                <div className="flex gap-2">
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a role to add" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map(role => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="secondary" onClick={handleAddRole} disabled={!selectedRole}>
                    Add Role
                  </Button>
                </div>
              )}
            </div>

            {/* Branches Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Label>Branch Assignments</Label>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[32px] p-2 border rounded-md bg-muted/30">
                {editingUser?.branches.length === 0 ? (
                  <span className="text-sm text-muted-foreground">No branches assigned</span>
                ) : (
                  editingUser?.branches.map(branch => (
                    <Badge key={branch.id} variant={branch.is_primary ? 'default' : 'secondary'} className="pl-2 pr-1">
                      {branch.name} {branch.is_primary && '(Primary)'}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 ml-1 hover:bg-transparent"
                        onClick={() => handleRemoveBranch(branch.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))
                )}
              </div>
              {availableBranches.length > 0 && (
                <div className="flex gap-2">
                  <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a branch to add" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBranches.map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name} ({branch.city})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="secondary" onClick={handleAddBranch} disabled={!selectedBranch}>
                    Add Branch
                  </Button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateProfile.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
