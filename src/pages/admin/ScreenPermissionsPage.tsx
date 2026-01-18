import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, Save, RefreshCw } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { useUserScreenPermissions, useBulkSetScreenPermissions, AVAILABLE_SCREENS } from '@/hooks/useScreenPermissions';

export default function ScreenPermissionsPage() {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);
  
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: userPermissions, isLoading: permissionsLoading } = useUserScreenPermissions(selectedUserId);
  const bulkSetPermissions = useBulkSetScreenPermissions();
  
  // Initialize permissions when user is selected or permissions load
  useEffect(() => {
    if (selectedUserId) {
      const permissionMap: Record<string, boolean> = {};
      AVAILABLE_SCREENS.forEach(screen => {
        // Default to allowed (true), check if explicitly denied
        const existingPermission = userPermissions?.find(p => p.screen_path === screen.path);
        permissionMap[screen.path] = existingPermission ? existingPermission.is_allowed : true;
      });
      setPermissions(permissionMap);
      setHasChanges(false);
    }
  }, [selectedUserId, userPermissions]);
  
  const handlePermissionChange = (screenPath: string, allowed: boolean) => {
    setPermissions(prev => ({ ...prev, [screenPath]: allowed }));
    setHasChanges(true);
  };
  
  const handleSave = () => {
    if (!selectedUserId) return;
    
    const permissionsList = AVAILABLE_SCREENS.map(screen => ({
      screen_path: screen.path,
      screen_name: screen.name,
      is_allowed: permissions[screen.path] ?? true,
    }));
    
    bulkSetPermissions.mutate({ userId: selectedUserId, permissions: permissionsList });
    setHasChanges(false);
  };
  
  const handleReset = () => {
    // Reset all to allowed
    const permissionMap: Record<string, boolean> = {};
    AVAILABLE_SCREENS.forEach(screen => {
      permissionMap[screen.path] = true;
    });
    setPermissions(permissionMap);
    setHasChanges(true);
  };
  
  const selectedUser = users?.find(u => u.user_id === selectedUserId);
  
  // Group screens by category
  const screenGroups = {
    'Main': AVAILABLE_SCREENS.filter(s => ['/dashboard', '/notifications', '/settings'].includes(s.path)),
    'Intake': AVAILABLE_SCREENS.filter(s => s.path.startsWith('/emails') || s.path.startsWith('/leads')),
    'Tasks': AVAILABLE_SCREENS.filter(s => s.path.startsWith('/tasks') || s.path.startsWith('/my-tasks') || s.path.startsWith('/qc')),
    'Administration': AVAILABLE_SCREENS.filter(s => s.path.startsWith('/admin')),
    'Reports': AVAILABLE_SCREENS.filter(s => s.path.startsWith('/reports')),
    'Client': AVAILABLE_SCREENS.filter(s => s.path.startsWith('/client')),
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Screen Permissions</h1>
          <p className="text-muted-foreground">
            Configure which screens each user can access
          </p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            User Screen Access Control
          </CardTitle>
          <CardDescription>
            Select a user to configure their screen access permissions. Denied screens will show "Access Denied" when the user tries to access them.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Selector */}
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user to configure..." />
                </SelectTrigger>
                <SelectContent>
                  {usersLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    users?.map(user => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        <div className="flex items-center gap-2">
                          <span>{user.full_name}</span>
                          <span className="text-muted-foreground">({user.email})</span>
                          {user.roles.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {user.roles[0].replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {selectedUserId && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleReset}
                  disabled={bulkSetPermissions.isPending}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset All
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSave}
                  disabled={!hasChanges || bulkSetPermissions.isPending}
                >
                  {bulkSetPermissions.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            )}
          </div>
          
          {/* User Info */}
          {selectedUser && (
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">{selectedUser.full_name}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>
              <div className="flex gap-2">
                {selectedUser.roles.map(role => (
                  <Badge key={role} variant="secondary">
                    {role.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Permission Grid */}
          {selectedUserId && (
            <div className="space-y-6">
              {permissionsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                Object.entries(screenGroups).map(([groupName, screens]) => (
                  screens.length > 0 && (
                    <div key={groupName} className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        {groupName}
                      </h3>
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {screens.map(screen => (
                          <div 
                            key={screen.path}
                            className="flex items-center justify-between p-3 border rounded-lg bg-card"
                          >
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium">{screen.name}</p>
                              <p className="text-xs text-muted-foreground">{screen.path}</p>
                            </div>
                            <Switch
                              checked={permissions[screen.path] ?? true}
                              onCheckedChange={(checked) => handlePermissionChange(screen.path, checked)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))
              )}
            </div>
          )}
          
          {!selectedUserId && (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              Select a user to configure their screen permissions
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
