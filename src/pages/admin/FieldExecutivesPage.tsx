import { useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { useFieldExecutives, useCreateFieldExecutive, useUpdateFieldExecutive, useDeleteFieldExecutive, type FieldExecutiveWithProfile } from '@/hooks/useFieldExecutives';
import { useUsers } from '@/hooks/useUsers';
import type { Enums } from '@/integrations/supabase/types';

type FESkill = Enums<'fe_skill'>;

const SKILLS: { value: FESkill; label: string }[] = [
  { value: 'residential', label: 'Residential' },
  { value: 'business', label: 'Business' },
  { value: 'end_use', label: 'End Use' },
];

interface FEFormData {
  user_id: string;
  employee_code: string;
  skills: FESkill[];
  mapped_pincodes: string[];
  max_workload: number;
  is_available: boolean;
}

const initialFormData: FEFormData = {
  user_id: '',
  employee_code: '',
  skills: [],
  mapped_pincodes: [],
  max_workload: 10,
  is_available: true,
};

export default function FieldExecutivesPage() {
  const { data: fieldExecutives = [], isLoading } = useFieldExecutives();
  const { data: users = [] } = useUsers();
  const createFE = useCreateFieldExecutive();
  const updateFE = useUpdateFieldExecutive();
  const deleteFE = useDeleteFieldExecutive();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFE, setEditingFE] = useState<FieldExecutiveWithProfile | null>(null);
  const [formData, setFormData] = useState<FEFormData>(initialFormData);
  const [pincodeInput, setPincodeInput] = useState('');

  // Users who have field_executive role but are not yet in field_executives table
  const availableUsers = users.filter(u => 
    u.roles.includes('field_executive') && 
    !fieldExecutives.some(fe => fe.user_id === u.user_id)
  );

  const handleOpenDialog = (fe?: FieldExecutiveWithProfile) => {
    if (fe) {
      setEditingFE(fe);
      setFormData({
        user_id: fe.user_id,
        employee_code: fe.employee_code,
        skills: (fe.skills || []) as FESkill[],
        mapped_pincodes: fe.mapped_pincodes || [],
        max_workload: fe.max_workload || 10,
        is_available: fe.is_available ?? true,
      });
    } else {
      setEditingFE(null);
      setFormData(initialFormData);
    }
    setPincodeInput('');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingFE(null);
    setFormData(initialFormData);
    setPincodeInput('');
  };

  const handleAddPincode = () => {
    const pincode = pincodeInput.trim();
    if (pincode && /^\d{6}$/.test(pincode) && !formData.mapped_pincodes.includes(pincode)) {
      setFormData({
        ...formData,
        mapped_pincodes: [...formData.mapped_pincodes, pincode],
      });
      setPincodeInput('');
    }
  };

  const handleRemovePincode = (pincode: string) => {
    setFormData({
      ...formData,
      mapped_pincodes: formData.mapped_pincodes.filter(p => p !== pincode),
    });
  };

  const handleToggleSkill = (skill: FESkill) => {
    setFormData({
      ...formData,
      skills: formData.skills.includes(skill)
        ? formData.skills.filter(s => s !== skill)
        : [...formData.skills, skill],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingFE) {
        await updateFE.mutateAsync({
          id: editingFE.id,
          employee_code: formData.employee_code,
          skills: formData.skills,
          mapped_pincodes: formData.mapped_pincodes,
          max_workload: formData.max_workload,
          is_available: formData.is_available,
        });
      } else {
        await createFE.mutateAsync(formData);
      }
      handleCloseDialog();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleDelete = async (id: string) => {
    await deleteFE.mutateAsync(id);
  };

  const columns = [
    { key: 'employee_code', header: 'Employee Code', className: 'w-32' },
    {
      key: 'profile.full_name',
      header: 'Name',
      render: (fe: FieldExecutiveWithProfile) => fe.profile?.full_name || 'N/A',
    },
    {
      key: 'profile.email',
      header: 'Email',
      render: (fe: FieldExecutiveWithProfile) => fe.profile?.email || 'N/A',
    },
    {
      key: 'skills',
      header: 'Skills',
      render: (fe: FieldExecutiveWithProfile) => (
        <div className="flex flex-wrap gap-1">
          {(fe.skills || []).length === 0 ? (
            <Badge variant="outline" className="text-xs text-muted-foreground">No skills</Badge>
          ) : (
            (fe.skills || []).map(skill => (
              <Badge key={skill} variant="secondary" className="text-xs capitalize">
                {skill.replace('_', ' ')}
              </Badge>
            ))
          )}
        </div>
      ),
    },
    {
      key: 'mapped_pincodes',
      header: 'PIN Codes',
      render: (fe: FieldExecutiveWithProfile) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {(fe.mapped_pincodes || []).slice(0, 3).map(pin => (
            <Badge key={pin} variant="outline" className="text-xs">
              {pin}
            </Badge>
          ))}
          {(fe.mapped_pincodes || []).length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{(fe.mapped_pincodes || []).length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'workload',
      header: 'Workload',
      className: 'w-24',
      render: (fe: FieldExecutiveWithProfile) => (
        <span className="text-sm">
          {fe.current_workload || 0} / {fe.max_workload || 10}
        </span>
      ),
    },
    {
      key: 'is_available',
      header: 'Status',
      className: 'w-24',
      render: (fe: FieldExecutiveWithProfile) => (
        <StatusBadge 
          active={fe.is_available ?? true} 
          activeLabel="Available"
          inactiveLabel="Unavailable"
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'w-24',
      render: (fe: FieldExecutiveWithProfile) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDialog(fe);
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
                <AlertDialogTitle>Delete Field Executive</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this field executive profile? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => handleDelete(fe.id)}
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
          <h1 className="text-2xl font-bold tracking-tight">Field Executive Management</h1>
          <p className="text-muted-foreground">Manage FE profiles, skills, and PIN code assignments</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} disabled={availableUsers.length === 0 && !editingFE}>
              <Plus className="h-4 w-4 mr-2" />
              Add FE Profile
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingFE ? 'Edit Field Executive' : 'Add Field Executive Profile'}</DialogTitle>
              <DialogDescription>
                {editingFE 
                  ? 'Update the field executive details below.' 
                  : 'Select a user with FE role and configure their profile.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {!editingFE && (
                <div className="space-y-2">
                  <Label htmlFor="user">User *</Label>
                  <Select 
                    value={formData.user_id} 
                    onValueChange={(value) => setFormData({ ...formData, user_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map(user => (
                        <SelectItem key={user.user_id} value={user.user_id}>
                          {user.full_name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availableUsers.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No users with Field Executive role available. Assign the role in User Management first.
                    </p>
                  )}
                </div>
              )}

              {editingFE && (
                <div className="space-y-2">
                  <Label>User</Label>
                  <Input value={editingFE.profile?.full_name || 'N/A'} disabled className="bg-muted" />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="employee_code">Employee Code *</Label>
                <Input
                  id="employee_code"
                  value={formData.employee_code}
                  onChange={(e) => setFormData({ ...formData, employee_code: e.target.value.toUpperCase() })}
                  placeholder="e.g., FE001"
                  required
                  maxLength={20}
                />
              </div>

              <div className="space-y-2">
                <Label>Skills</Label>
                <div className="flex flex-wrap gap-2">
                  {SKILLS.map(skill => (
                    <Badge
                      key={skill.value}
                      variant={formData.skills.includes(skill.value) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleToggleSkill(skill.value)}
                    >
                      {skill.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pincodes">Mapped PIN Codes</Label>
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
                {formData.mapped_pincodes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.mapped_pincodes.map(pin => (
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

              <div className="space-y-2">
                <Label htmlFor="max_workload">Max Workload</Label>
                <Input
                  id="max_workload"
                  type="number"
                  min={1}
                  max={50}
                  value={formData.max_workload}
                  onChange={(e) => setFormData({ ...formData, max_workload: parseInt(e.target.value) || 10 })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="is_available">Availability</Label>
                  <p className="text-sm text-muted-foreground">Can receive new task assignments</p>
                </div>
                <Switch
                  id="is_available"
                  checked={formData.is_available}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createFE.isPending || updateFE.isPending || (!editingFE && !formData.user_id)}
                >
                  {editingFE ? 'Update' : 'Create'} Profile
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Field Executives</CardTitle>
          <CardDescription>Manage field executive profiles and their configurations</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={fieldExecutives}
            columns={columns}
            searchPlaceholder="Search field executives..."
            searchKeys={['employee_code']}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
