import { 
  LayoutDashboard, 
  Mail, 
  FileText, 
  ClipboardList, 
  Users, 
  Building2, 
  Settings,
  UserCheck,
  CheckSquare,
  BarChart3,
  MapPin,
  Package,
  Bell,
  LogOut,
  ChevronDown,
  RefreshCw,
  History,
  FileSearch,
  FileCode,
  ShieldCheck,
  Building,
  UserPlus,
  Lock,
  Upload
} from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

type AppRole = 'admin' | 'intake' | 'analyst' | 'field_executive' | 'qc' | 'ops_manager' | 'client_viewer';

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: AppRole[];
  children?: Omit<NavItem, 'children'>[];
}

const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Client Portal',
    url: '/client-portal',
    icon: Building,
    roles: ['client_viewer'],
  },
  {
    title: 'Email Inbox',
    url: '/emails',
    icon: Mail,
    roles: ['admin', 'intake'],
  },
  {
    title: 'Leads',
    url: '/leads',
    icon: FileText,
    roles: ['admin', 'intake', 'ops_manager'],
  },
  {
    title: 'Tasks',
    url: '/tasks',
    icon: ClipboardList,
    roles: ['admin', 'ops_manager', 'qc', 'analyst', 'field_executive'],
  },
  {
    title: 'My Tasks',
    url: '/my-tasks',
    icon: CheckSquare,
    roles: ['analyst', 'field_executive'],
  },
  {
    title: 'QC Review',
    url: '/qc-review',
    icon: UserCheck,
    roles: ['admin', 'qc', 'ops_manager'],
  },
];

const adminNavItems: NavItem[] = [
  {
    title: 'Administration',
    url: '/admin',
    icon: Settings,
    roles: ['admin', 'ops_manager'],
    children: [
      { title: 'Clients', url: '/admin/clients', icon: Building2 },
      { title: 'Branches', url: '/admin/branches', icon: MapPin },
      { title: 'Users', url: '/admin/users', icon: Users },
      { title: 'Field Executives', url: '/admin/field-executives', icon: UserCheck },
      { title: 'Products', url: '/admin/products', icon: Package },
      { title: 'Verification Types', url: '/admin/verification-types', icon: ShieldCheck, roles: ['admin'] },
      { title: 'Client Assignments', url: '/admin/client-assignments', icon: UserPlus, roles: ['admin'] },
      { title: 'Screen Permissions', url: '/admin/screen-permissions', icon: Lock, roles: ['admin'] },
      { title: 'Report Config', url: '/admin/report-config', icon: FileCode, roles: ['admin'] },
    ],
  },
];

const reportsNavItems: NavItem[] = [
  {
    title: 'Reports',
    url: '/reports',
    icon: BarChart3,
    roles: ['admin', 'ops_manager', 'client_viewer'],
    children: [
      { title: 'Volume Report', url: '/reports/volume', icon: BarChart3 },
      { title: 'TAT Report', url: '/reports/tat', icon: BarChart3 },
      { title: 'FE Productivity', url: '/reports/productivity', icon: BarChart3 },
      { title: 'SLA Monitoring', url: '/reports/sla', icon: BarChart3 },
      { title: 'Reassignment', url: '/reports/reassignment', icon: RefreshCw },
      { title: 'Audit Logs', url: '/reports/audit', icon: FileSearch },
      { title: 'Report History', url: '/reports/history', icon: History },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { profile, roles, signOut, hasAnyRole } = useAuth();

  const isActive = (url: string) => {
    if (url === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(url);
  };

  const canAccess = (item: NavItem) => {
    if (!item.roles) return true;
    return hasAnyRole(item.roles);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderNavItem = (item: NavItem) => {
    if (!canAccess(item)) return null;

    if (item.children) {
      return (
        <Collapsible key={item.url} defaultOpen={isActive(item.url)} className="group/collapsible">
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip={item.title}>
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
                <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.children.map(child => (
                  <SidebarMenuSubItem key={child.url}>
                    <SidebarMenuSubButton asChild isActive={isActive(child.url)}>
                      <Link to={child.url}>
                        <child.icon className="h-4 w-4" />
                        <span>{child.title}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      );
    }

    return (
      <SidebarMenuItem key={item.url}>
        <SidebarMenuButton asChild tooltip={item.title} isActive={isActive(item.url)}>
          <Link to={item.url}>
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-lg">
            RCU
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-foreground">RCU Platform</span>
            <span className="text-xs text-sidebar-muted">Verification System</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin">
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {hasAnyRole(['admin', 'ops_manager']) && (
          <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map(renderNavItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {hasAnyRole(['admin', 'ops_manager', 'client_viewer']) && (
          <SidebarGroup>
            <SidebarGroupLabel>Analytics</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {reportsNavItems.map(renderNavItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="w-full justify-start gap-3 data-[state=open]:bg-sidebar-accent"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                      {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start group-data-[collapsible=icon]:hidden">
                    <span className="text-sm font-medium text-sidebar-foreground truncate max-w-[140px]">
                      {profile?.full_name || 'User'}
                    </span>
                    <span className="text-xs text-sidebar-muted capitalize">
                      {roles[0]?.replace('_', ' ') || 'No Role'}
                    </span>
                  </div>
                  <ChevronDown className="ml-auto h-4 w-4 text-sidebar-muted group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/notifications" className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <span>Notifications</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}