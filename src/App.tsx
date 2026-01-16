import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

// Pages
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

// Admin Pages
import ClientsPage from "./pages/admin/ClientsPage";
import BranchesPage from "./pages/admin/BranchesPage";
import UsersPage from "./pages/admin/UsersPage";
import FieldExecutivesPage from "./pages/admin/FieldExecutivesPage";

// Intake Pages
import EmailInboxPage from "./pages/intake/EmailInboxPage";
import EmailDetailPage from "./pages/intake/EmailDetailPage";
import LeadsListPage from "./pages/intake/LeadsListPage";
import LeadFormPage from "./pages/intake/LeadFormPage";

// Task Pages
import TasksListPage from "./pages/tasks/TasksListPage";
import MyTasksPage from "./pages/tasks/MyTasksPage";
import TaskDetailPage from "./pages/tasks/TaskDetailPage";
import QCReviewPage from "./pages/tasks/QCReviewPage";

// Report Pages
import VolumeReportPage from "./pages/reports/VolumeReportPage";
import TATReportPage from "./pages/reports/TATReportPage";
import ProductivityReportPage from "./pages/reports/ProductivityReportPage";
import SLAReportPage from "./pages/reports/SLAReportPage";
import ReassignmentReportPage from "./pages/reports/ReassignmentReportPage";
import AuditLogPage from "./pages/reports/AuditLogPage";
import ReportHistoryPage from "./pages/reports/ReportHistoryPage";

// Admin Pages (additional)
import ReportConfigPage from "./pages/admin/ReportConfigPage";

// Placeholder pages
import PlaceholderPage from "./pages/PlaceholderPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            {/* Email Inbox - Intake & Admin */}
            <Route
              path="/emails"
              element={
                <ProtectedRoute allowedRoles={['admin', 'intake']}>
                  <AppLayout>
                    <EmailInboxPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/emails/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'intake']}>
                  <AppLayout>
                    <EmailDetailPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            {/* Leads */}
            <Route
              path="/leads"
              element={
                <ProtectedRoute allowedRoles={['admin', 'intake', 'ops_manager']}>
                  <AppLayout>
                    <LeadsListPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/leads/new"
              element={
                <ProtectedRoute allowedRoles={['admin', 'intake']}>
                  <AppLayout>
                    <LeadFormPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            {/* Tasks */}
            <Route
              path="/tasks"
              element={
                <ProtectedRoute allowedRoles={['admin', 'ops_manager', 'qc']}>
                  <AppLayout>
                    <TasksListPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/tasks/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <TaskDetailPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/my-tasks"
              element={
                <ProtectedRoute allowedRoles={['analyst', 'field_executive']}>
                  <AppLayout>
                    <MyTasksPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            {/* QC Review */}
            <Route
              path="/qc-review"
              element={
                <ProtectedRoute allowedRoles={['admin', 'qc', 'ops_manager']}>
                  <AppLayout>
                    <QCReviewPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            {/* Admin Routes */}
            <Route
              path="/admin/clients"
              element={
                <ProtectedRoute allowedRoles={['admin', 'ops_manager']}>
                  <AppLayout>
                    <ClientsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin/branches"
              element={
                <ProtectedRoute allowedRoles={['admin', 'ops_manager']}>
                  <AppLayout>
                    <BranchesPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppLayout>
                    <UsersPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin/field-executives"
              element={
                <ProtectedRoute allowedRoles={['admin', 'ops_manager']}>
                  <AppLayout>
                    <FieldExecutivesPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppLayout>
                    <PlaceholderPage title="Products" description="Manage business products" />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            {/* Reports */}
            <Route
              path="/reports/volume"
              element={
                <ProtectedRoute allowedRoles={['admin', 'ops_manager', 'client_viewer']}>
                  <AppLayout>
                    <VolumeReportPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/reports/tat"
              element={
                <ProtectedRoute allowedRoles={['admin', 'ops_manager', 'client_viewer']}>
                  <AppLayout>
                    <TATReportPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/reports/productivity"
              element={
                <ProtectedRoute allowedRoles={['admin', 'ops_manager']}>
                  <AppLayout>
                    <ProductivityReportPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/reports/sla"
              element={
                <ProtectedRoute allowedRoles={['admin', 'ops_manager', 'client_viewer']}>
                  <AppLayout>
                    <SLAReportPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            {/* Notifications & Settings */}
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <PlaceholderPage title="Notifications" description="View your notifications" />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <PlaceholderPage title="Settings" description="Manage your account settings" />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;