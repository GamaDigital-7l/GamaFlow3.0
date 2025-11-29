import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";
import { AppShell } from "./components/AppShell";
import { ThemeProvider } from "next-themes";
import { SessionContextProvider } from "./components/SessionContextProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { withRole } from "./components/withRole";
import ProfilePage from "./pages/ProfilePage";
import PostApprovalPage from "./pages/PostApprovalPage";
import ApprovalConfirmationPage from "./pages/ApprovalConfirmationPage";
import ErrorBoundary from "./components/ErrorBoundary";
import { Loader2 } from "lucide-react";

const Index = lazy(() => import("./pages/Index"));
const Clients = lazy(() => import("./pages/Clients"));
const Reports = lazy(() => import("./pages/Reports"));
const ClientWorkspacePage = lazy(() => import("./pages/ClientWorkspacePage"));
const Login = lazy(() => import("./pages/Login"));
const TasksConfigPage = lazy(() => import("./pages/TasksConfigPage"));
const UserManagementPage = lazy(() => import("./pages/UserManagementPage"));
const ClientApprovalListPage = lazy(() => import("./pages/ClientApprovalListPage"));
const AppSettingsPage = lazy(() => import("./pages/AppSettingsPage"));
const ClientFeedbackPage = lazy(() => import("./pages/ClientFeedbackPage"));
const Playbook = lazy(() => import("./pages/Playbook"));
const GoalsPage = lazy(() => import("./pages/GoalsPage"));
const CrmPage = lazy(() => import("./pages/CrmPage")); 
const FinanceiroPage = lazy(() => import("./pages/FinanceiroPage"));
const BriefingsPage = lazy(() => import("./pages/BriefingsPage"));
const PublicBriefingPage = lazy(() => import("./pages/PublicBriefingPage"));
const BriefingTemplatesPage = lazy(() => import("./pages/BriefingTemplatesPage"));
const ProposalsPage = lazy(() => import("./pages/ProposalsPage"));
const PublicProposalPage = lazy(() => import("./pages/PublicProposalPage"));
const NotesPage = lazy(() => import("./pages/NotesPage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage")); // Importando OnboardingPage

const queryClient = new QueryClient();

// Componentes protegidos por role
const AdminReports = withRole(Reports, "admin");
const AdminUserManagement = withRole(UserManagementPage, "admin");
const AdminClients = withRole(Clients, "admin");
const AdminTasksConfig = withRole(TasksConfigPage, "admin");
const AdminDashboard = withRole(Index, ["admin", "user"]); // Dashboard agora é para admin/user
const AdminAppSettings = withRole(AppSettingsPage, "admin");
const AdminClientFeedback = withRole(ClientFeedbackPage, "admin");
const AuthenticatedGoals = withRole(GoalsPage, ["admin", "user"]);
const FinanceiroPage = withRole(FinanceiroPage, "admin");
const AdminBriefings = withRole(BriefingsPage, "admin");
const AdminBriefingTemplates = withRole(BriefingTemplatesPage, "admin");
const AdminProposals = withRole(ProposalsPage, "admin");
const AuthenticatedNotes = withRole(NotesPage, ["admin", "user"]);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SessionContextProvider>
          <ErrorBoundary>
            <Routes>
              {/* Rotas Públicas */}
              <Route path="/approval/client/:clientId" element={<ClientApprovalListPage />} />
              <Route path="/approval/:clientId/:postId" element={<PostApprovalPage />} />
              <Route path="/approval/confirmation" element={<ApprovalConfirmationPage />} />
              <Route path="/briefing/public/:formId" element={<PublicBriefingPage />} />
              <Route path="/proposal/public/:publicId" element={<PublicProposalPage />} />
              <Route path="/onboarding/:clientId" element={<OnboardingPage />} /> {/* NOVA ROTA PÚBLICA */}
              <Route path="/login" element={<Login />} />
              
              {/* Rota Dedicada ao Playbook do Cliente (Protegida por Sessão) */}
              <Route 
                path="/playbook/:clientId/*" 
                element={
                  <ProtectedRoute>
                    <Playbook /> 
                  </ProtectedRoute>
                } 
              />
              
              {/* Layout Principal Protegido (AppShell) - Apenas para Admin/User */}
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <AppShell />
                  </ProtectedRoute>
                }
              >
                {/* Rotas Filhas (Renderizadas via Outlet no AppShell) */}
                {/* O Dashboard agora usa withRole para proteger contra clientes */}
                <Route index element={<Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-dyad-500 mx-auto" />}><AdminDashboard /></Suspense>} /> 
                <Route path="tasks" element={<Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-dyad-500 mx-auto" />}><AdminTasksConfig /></Suspense>} />
                <Route path="goals" element={<Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-dyad-500 mx-auto" />}><AuthenticatedGoals /></Suspense>} />
                <Route path="clients" element={<Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-dyad-500 mx-auto" />}><AdminClients /></Suspense>} />
                <Route path="crm" element={<Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-dyad-500 mx-auto" />}><CrmPage /></Suspense>} /> 
                <Route path="proposals" element={<Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-dyad-500 mx-auto" />}><AdminProposals /></Suspense>} />
                
                {/* Rota de Briefings (Contém a rota de templates aninhada) */}
                <Route path="briefings">
                    <Route index element={<Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-dyad-500 mx-auto" />}><AdminBriefings /></Suspense>} />
                    <Route path="templates" element={<Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-dyad-500 mx-auto" />}><AdminBriefingTemplates /></Suspense>} />
                </Route>
                
                <Route path="financeiro" element={<Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-dyad-500 mx-auto" />}><FinanceiroPage /></Suspense>} />
                <Route path="notes" element={<Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-dyad-500 mx-auto" />}><AuthenticatedNotes /></Suspense>} />
                
                {/* ClientWorkspacePage agora é APENAS para Admin (Kanban/Config Onboarding) */}
                <Route path="clients/:clientId/*" element={<Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-dyad-500 mx-auto" />}><ClientWorkspacePage /></Suspense>} /> 
                
                <Route path="reports" element={<Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-dyad-500 mx-auto" />}><AdminReports /></Suspense>} />
                <Route path="admin/users" element={<Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-dyad-500 mx-auto" />}><AdminUserManagement /></Suspense>} />
                <Route path="admin/feedback" element={<Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-dyad-500 mx-auto" />}><AdminClientFeedback /></Suspense>} />
                <Route path="admin/settings" element={<Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-dyad-500 mx-auto" />}><AdminAppSettings /></Suspense>} />
                <Route path="profile" element={<ProfilePage />} />
                
                {/* 404 dentro do AppShell */}
                <Route path="*" element={<NotFound />} />
              </Route>
              
              {/* Rota de fallback para 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </ErrorBoundary>
          </SessionContextProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;