import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { useBranches, useCreateBranch, useUpdateBranch, useDeleteBranch } from '@/hooks/useBranches';
import type { Tables } from '@/integrations/supabase/types';

type Branch = Tables<'branches'>;

interface BranchFormData {
  name: string;
  code: string;
  city: string;
  state: string;
  branch_email: string;
  serviceable_pincodes: string[];
  is_active: boolean;
}

const initialFormData: BranchFormData = {
  name: '',
  code: '',
  city: '',
  state: '',
  branch_email: '',
  serviceable_pincodes: [],
  is_active: true,
};

export default function BranchesPage() {
  const { data: branches = [], isLoading } = useBranches();
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const deleteBranch = useDeleteBranch();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<BranchFormData>(initialFormData);
  const [pincodeInput, setPincodeInput] = useState('');

  const handleOpenDialog = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        name: branch.name,
        code: branch.code,
        city: branch.city,
        state: branch.state,
        branch_email: branch.branch_email || '',
        serviceable_pincodes: branch.serviceable_pincodes || [],
        is_active: branch.is_active ?? true,
      });
    } else {
      setEditingBranch(null);
      setFormData(initialFormData);
    }
    setPincodeInput('');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBranch(null);
    setFormData(initialFormData);
    setPincodeInput('');
  };

  const handleAddPincode = () => {
    const pincode = pincodeInput.trim();
    if (pincode && /^\d{6}$/.test(pincode) && !formData.serviceable_pincodes.includes(pincode)) {
      setFormData({
        ...formData,
        serviceable_pincodes: [...formData.serviceable_pincodes, pincode],
      });
      setPincodeInput('');
    }
  };

  const handleRemovePincode = (pincode: string) => {
    setFormData({
      ...formData,
      serviceable_pincodes: formData.serviceable_pincodes.filter(p => p !== pincode),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingBranch) {
        await updateBranch.mutateAsync({
          id: editingBranch.id,
          ...formData,
        });
      } else {
        await createBranch.mutateAsync(formData);
      }
      handleCloseDialog();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleDelete = async (id: string) => {
    await deleteBranch.mutateAsync(id);
  };

  const columns = [
    { key: 'code', header: 'Code', className: 'w-24' },
    { key: 'name', header: 'Branch Name' },
    { key: 'city', header: 'City' },
    { key: 'state', header: 'State' },
    {
      key: 'branch_email',
      header: 'Email Routing',
      render: (branch: Branch) => (
        branch.branch_email ? (
          <div className="flex items-center gap-1.5 text-sm">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate max-w-[180px]">{branch.branch_email}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">Not configured</span>
        )
      ),
    },
    {
      key: 'serviceable_pincodes',
      header: 'PIN Codes',
      render: (branch: Branch) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {(branch.serviceable_pincodes || []).slice(0, 3).map(pin => (
            <Badge key={pin} variant="secondary" className="text-xs">
              {pin}
            </Badge>
          ))}
          {(branch.serviceable_pincodes || []).length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{(branch.serviceable_pincodes || []).length - 3} more
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      className: 'w-24',
      render: (branch: Branch) => <StatusBadge active={branch.is_active ?? true} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'w-24',
      render: (branch: Branch) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDialog(branch);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
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
                <AlertDialogTitle>Delete Branch</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{branch.name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => handleDelete(branch.id)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Branch Management</h1>
          <p className="text-muted-foreground">Manage branches and serviceable PIN codes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Branch
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingBranch ? 'Edit Branch' : 'Add New Branch'}</DialogTitle>
              <DialogDescription>
                {editingBranch ? 'Update the branch details below.' : 'Fill in the details to create a new branch.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Branch Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., MUM"
                    required
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Branch Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Mumbai Central"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g., Mumbai"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="e.g., Maharashtra"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch_email">Branch Email (for Email Routing)</Label>
                <Input
                  id="branch_email"
                  type="email"
                  value={formData.branch_email}
                  onChange={(e) => setFormData({ ...formData, branch_email: e.target.value })}
                  placeholder="e.g., mumbai@company.com"
                />
                <p className="text-xs text-muted-foreground">
                  Emails sent to this address will be automatically routed to this branch
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincodes">Serviceable PIN Codes</Label>
                <div className="flex gap-2">
                  <Input
                    id="pincodes"
                    value={pincodeInput}
                    onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit PIN code"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPincode();
                      }
                    }}
                  />
                  <Button type="button" variant="secondary" onClick={handleAddPincode}>
                    Add
                  </Button>
                </div>
                {formData.serviceable_pincodes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.serviceable_pincodes.map(pin => (
                      <Badge key={pin} variant="secondary" className="pl-2 pr-1">
                        {pin}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-1 hover:bg-transparent"
                          onClick={() => handleRemovePincode(pin)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="is_active">Active Status</Label>
                  <p className="text-sm text-muted-foreground">Enable or disable this branch</p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createBranch.isPending || updateBranch.isPending}>
                  {editingBranch ? 'Update' : 'Create'} Branch
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Branches</CardTitle>
          <CardDescription>A list of all operation branches</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={branches}
            columns={columns}
            searchPlaceholder="Search branches..."
            searchKeys={['name', 'code', 'city', 'state']}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
