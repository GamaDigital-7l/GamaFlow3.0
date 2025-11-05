import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Clients from "./pages/Clients";
import Reports from "./pages/Reports";
import ClientWorkspacePage from "./pages/ClientWorkspacePage";
import Login from "./pages/Login";
import { AppShell } from "./components/AppShell";
import { ThemeProvider } from "next-themes";
import { SessionContextProvider } from "./components/SessionContextProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { withRole } from "./components/withRole";
import ProfilePage from "./pages/ProfilePage";
import PostApprovalPage from "./pages/PostApprovalPage";
import ApprovalConfirmationPage from "./pages/ApprovalConfirmationPage";
import TasksConfigPage from "./pages/TasksConfigPage";
import UserManagementPage from "./pages/UserManagementPage";
import ClientApprovalListPage from "./pages/ClientApprovalListPage";
import AppSettingsPage from "./pages/AppSettingsPage";
import ClientFeedbackPage from "./pages/ClientFeedbackPage";
import Playbook from "./pages/Playbook";
import GoalsPage from "./pages/GoalsPage";
import CrmPage from "./pages/CrmPage"; 
import FinanceiroPage from "./pages/FinanceiroPage";
import BriefingsPage from "./pages/BriefingsPage";
import PublicBriefingPage from "./pages/PublicBriefingPage";
import BriefingTemplatesPage from "./pages/BriefingTemplatesPage";
import ProposalsPage from "./pages/ProposalsPage";
import PublicProposalPage from "./pages/PublicProposalPage";
import NotesPage from "./pages/NotesPage";
import OnboardingPage from "./pages/OnboardingPage";
import { LibraryLayout } from "./components/library/LibraryLayout";
import LibraryHome from "./pages/library/LibraryHome";
import MyBooksPage from "./pages/library/MyBooksPage";
import CollectionsPage from "./pages/library/CollectionsPage"; // Importando
import CategoriesPage from "./pages/library/CategoriesPage"; // Importando
import StatsPage from "./pages/library/StatsPage"; // Importando

const queryClient = new QueryClient();

// Componentes protegidos por role
const AdminReports = withRole(Reports, "admin");
const AdminUserManagement = withRole(UserManagementPage, "admin");
const AdminClients = withRole(Clients, "admin");
const AdminTasksConfig = withRole(TasksConfigPage, "admin");
const AdminDashboard = withRole(Index, ["admin", "user"]);
const AdminAppSettings = withRole(AppSettingsPage, "admin");
const AdminClientFeedback = withRole(ClientFeedbackPage, "admin");
const AuthenticatedGoals = withRole(GoalsPage, ["admin", "user"]);
const AdminCrm = withRole(CrmPage, "admin");
const AdminFinanceiro = withRole(FinanceiroPage, "admin");
const AdminBriefings = withRole(BriefingsPage, "admin");
const AdminBriefingTemplates = withRole(BriefingTemplatesPage, "admin");
const AdminProposals = withRole(ProposalsPage, "admin");
const AuthenticatedNotes = withRole(NotesPage, ["admin", "user"]);

// Componentes da Biblioteca (Acesso para Admin/User)
const AuthenticatedLibraryHome = withRole(LibraryHome, ["admin", "user"]);
const AuthenticatedMyBooks = withRole(MyBooksPage, ["admin", "user"]);
const AuthenticatedCollections = withRole(CollectionsPage, ["admin", "user"]);
const AuthenticatedCategories = withRole(CategoriesPage, ["admin", "user"]);
const AuthenticatedStats = withRole(StatsPage, ["admin", "user"]);


const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SessionContextProvider>
            <Routes>
              {/* Rotas Públicas */}
              <Route path="/approval/client/:clientId" element={<ClientApprovalListPage />} />
              <Route path="/approval/:clientId/:postId" element={<PostApprovalPage />} />
              <Route path="/approval/confirmation" element={<ApprovalConfirmationPage />} />
              <Route path="/briefing/public/:formId" element={<PublicBriefingPage />} />
              <Route path="/proposal/public/:publicId" element={<PublicProposalPage />} />
              <Route path="/onboarding/:clientId" element={<OnboardingPage />} />
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
                <Route index element={<AdminDashboard />} /> 
                <Route path="tasks" element={<AdminTasksConfig />} />
                <Route path="goals" element={<AuthenticatedGoals />} />
                <Route path="clients" element={<AdminClients />} />
                <Route path="crm" element={<AdminCrm />} /> 
                <Route path="proposals" element={<AdminProposals />} />
                
                <Route path="briefings">
                    <Route index element={<AdminBriefings />} />
                    <Route path="templates" element={<AdminBriefingTemplates />} />
                </Route>
                
                <Route path="financeiro" element={<AdminFinanceiro />} />
                <Route path="notes" element={<AuthenticatedNotes />} />
                
                <Route path="clients/:clientId/*" element={<ClientWorkspacePage />} /> 
                
                <Route path="reports" element={<AdminReports />} />
                <Route path="admin/users" element={<AdminUserManagement />} />
                <Route path="admin/feedback" element={<AdminClientFeedback />} />
                <Route path="admin/settings" element={<AdminAppSettings />} />
                <Route path="profile" element={<ProfilePage />} />
                
                {/* 404 dentro do AppShell */}
                <Route path="*" element={<NotFound />} />
              </Route>
              
              {/* NOVO: Rotas da Biblioteca Digital (Layout Próprio) */}
              <Route 
                path="/library" 
                element={
                  <ProtectedRoute>
                    <LibraryLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AuthenticatedLibraryHome />} />
                <Route path="my-books" element={<AuthenticatedMyBooks />} />
                <Route path="collections" element={<AuthenticatedCollections />} />
                <Route path="categories" element={<AuthenticatedCategories />} />
                <Route path="stats" element={<AuthenticatedStats />} />
                {/* Rota do Leitor (A ser implementada) */}
                <Route path="reader/:bookId" element={<div>Leitor Avançado</div>} /> 
              </Route>
              
              {/* Rota de fallback para 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SessionContextProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;