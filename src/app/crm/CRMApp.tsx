/**
 * CRMApp — Batch 3
 *
 * Role-based CRM routing. On mount, syncs real auth user into
 * useCRMStore so legacy components that read currentRole work.
 */

import { useEffect } from "react";
import SEO from "@/components/shared/SEO";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import CRMLayout from "@/components/crm/CRMLayout";
import { syncAuthToCRMStore } from "./initCRMData";

// Admin
import AdminDashboard       from "@/components/crm/admin/AdminDashboard";
import ClientManagement    from "@/components/crm/admin/ClientManagement";
import EmployeeManagement  from "@/components/crm/admin/EmployeeManagement";
import ProjectManagement   from "@/components/crm/admin/ProjectManagement";
import ProjectDetail     from "@/components/crm/admin/ProjectDetail";
import ApprovalQueue     from "@/components/crm/admin/ApprovalQueue";
import PaymentsPanel     from "@/components/crm/admin/PaymentsPanel";
import ReportsPanel      from "@/components/crm/admin/ReportsPanel";
import FollowUpCenter    from "@/components/crm/admin/FollowUpCenter";
import LeadsManagement   from "@/components/crm/admin/LeadsManagement";
import SupportManagement from "@/components/crm/admin/SupportManagement";

// Employee
import EmployeeDashboard from "@/components/crm/employee/EmployeeDashboard";
import MyProjects        from "@/components/crm/employee/MyProjects";
import ProjectWorkspace  from "@/components/crm/employee/ProjectWorkspace";

// Client
import ClientDashboard   from "@/components/crm/client/ClientDashboard";
import ClientProjects    from "@/components/crm/client/ClientProjects";
import ClientProjectView from "@/components/crm/client/ClientProjectView";
import ClientSubmission  from "@/components/crm/client/ClientSubmission";
import ClientPayments    from "@/components/crm/client/ClientPayments";
import ClientDocuments   from "@/components/crm/client/ClientDocuments";
import ClientSupport     from "@/components/crm/client/ClientSupport";

function AdminPanel() {
  return (
    <Routes>
      <Route path="/"                    element={<AdminDashboard />} />
      <Route path="/clients"             element={<ClientManagement />} />
      <Route path="/employees"           element={<EmployeeManagement />} />
      <Route path="/projects"            element={<ProjectManagement />} />
      <Route path="/projects/:projectId" element={<ProjectDetail />} />
      <Route path="/approvals"           element={<ApprovalQueue />} />
      <Route path="/payments"            element={<PaymentsPanel />} />
      <Route path="/reports"             element={<ReportsPanel />} />
      <Route path="/followups"           element={<FollowUpCenter />} />
      <Route path="/leads"               element={<LeadsManagement />} />
      <Route path="/support"             element={<SupportManagement />} />
      <Route path="*"                    element={<Navigate to="/crm/admin" replace />} />
    </Routes>
  );
}

function EmployeePanel() {
  return (
    <Routes>
      <Route path="/"                      element={<EmployeeDashboard />} />
      <Route path="/projects"              element={<MyProjects />} />
      <Route path="/project/:projectId"    element={<ProjectWorkspace />} />
      <Route path="*"                      element={<Navigate to="/crm/employee" replace />} />
    </Routes>
  );
}

function ClientPanel() {
  return (
    <Routes>
      <Route path="/"          element={<ClientDashboard />} />
      <Route path="/projects"  element={<ClientProjects />} />
      <Route path="/project"   element={<ClientProjectView />} />
      <Route path="/submit"    element={<ClientSubmission />} />
      <Route path="/payments"  element={<ClientPayments />} />
      <Route path="/documents" element={<ClientDocuments />} />
      <Route path="/support"   element={<ClientSupport />} />
      <Route path="*"          element={<Navigate to="/crm/client" replace />} />
    </Routes>
  );
}

function CRMDefaultRedirect() {
  const { role } = useAuth();
  if (role === "employee") return <Navigate to="/crm/employee" replace />;
  if (role === "client")   return <Navigate to="/crm/client"   replace />;
  return <Navigate to="/crm/admin" replace />;
}

export default function CRMApp() {
  const { user, role } = useAuth();

  // Sync real auth user into the CRM store once on mount
  useEffect(() => {
    if (user?.userId && role) {
      syncAuthToCRMStore(user.userId, role);
    }
  }, [user?.userId, role]);

  return (
    <>
      <SEO title="CRM | KlawTax" noindex={true} />
      <CRMLayout>
        <Routes>
          <Route path="/"           element={<CRMDefaultRedirect />} />
          <Route path="/admin/*"    element={<AdminPanel />} />
          <Route path="/employee/*" element={<EmployeePanel />} />
          <Route path="/client/*"   element={<ClientPanel />} />
          <Route path="*"           element={<CRMDefaultRedirect />} />
        </Routes>
      </CRMLayout>
    </>
  );
}
