import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

type AppRole = 'admin' | 'intake' | 'analyst' | 'field_executive' | 'qc' | 'ops_manager' | 'client_viewer';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, roles, isLoading, hasAnyRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If no roles assigned yet, show a pending state
  if (roles.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="max-w-md text-center p-8">
          <div className="mb-4 flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-warning/10">
            <Loader2 className="h-8 w-8 text-warning" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Access Pending</h2>
          <p className="text-muted-foreground">
            Your account is pending role assignment. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  // Check role-based access
  if (allowedRoles && !hasAnyRole(allowedRoles) && !hasAnyRole(['admin'])) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="max-w-md text-center p-8">
          <div className="mb-4 flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-destructive/10">
            <span className="text-2xl">🚫</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}