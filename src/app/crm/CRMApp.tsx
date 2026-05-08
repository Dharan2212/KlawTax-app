import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { initCRMData } from "./initCRMData";
import CRMLayout from "@/components/crm/CRMLayout";
import CRMEntryPage from "@/pages/crm/CRMEntryPage";
import AdminDashboard from "@/components/crm/admin/AdminDashboard";
import ClientManagement from "@/components/crm/admin/ClientManagement";
import ProjectManagement from "@/components/crm/admin/ProjectManagement";
import ProjectDetail from "@/components/crm/admin/ProjectDetail";
import ApprovalQueue from "@/components/crm/admin/ApprovalQueue";
import PaymentsPanel from "@/components/crm/admin/PaymentsPanel";
import ReportsPanel from "@/components/crm/admin/ReportsPanel";
import EmployeeDashboard from "@/components/crm/employee/EmployeeDashboard";
import MyProjects from "@/components/crm/employee/MyProjects";
import ProjectWorkspace from "@/components/crm/employee/ProjectWorkspace";
import ClientDashboard from "@/components/crm/client/ClientDashboard";
import ClientProjects from "@/components/crm/client/ClientProjects";
import ClientProjectView from "@/components/crm/client/ClientProjectView";
import ClientSubmission from "@/components/crm/client/ClientSubmission";
import ClientPayments from "@/components/crm/client/ClientPayments";
import ClientDocuments from "@/components/crm/client/ClientDocuments";
import ClientSupport from "@/components/crm/client/ClientSupport";

function AdminPanel() {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
      <Route path="/clients" element={<ClientManagement />} />
      <Route path="/projects" element={<ProjectManagement />} />
      <Route path="/projects/:projectId" element={<ProjectDetail />} />
      <Route path="/approvals" element={<ApprovalQueue />} />
      <Route path="/payments" element={<PaymentsPanel />} />
      <Route path="/reports" element={<ReportsPanel />} />
    </Routes>
  );
}

function EmployeePanel() {
  return (
    <Routes>
      <Route path="/" element={<EmployeeDashboard />} />
      <Route path="/projects" element={<MyProjects />} />
      <Route path="/project/:projectId" element={<ProjectWorkspace />} />
      <Route path="*" element={<Navigate to="/crm/employee" replace />} />
    </Routes>
  );
}

function ClientPanel() {
  return (
    <Routes>
      <Route path="/" element={<ClientDashboard />} />
      <Route path="/projects" element={<ClientProjects />} />
      <Route path="/project" element={<ClientProjectView />} />
      <Route path="/submit" element={<ClientSubmission />} />
      <Route path="/payments" element={<ClientPayments />} />
      <Route path="/documents" element={<ClientDocuments />} />
      <Route path="/support" element={<ClientSupport />} />
      <Route path="*" element={<Navigate to="/crm/client" replace />} />
    </Routes>
  );
}

export default function CRMApp() {
  useEffect(() => {
    initCRMData();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/crm/admin" replace />} />
      <Route path="/admin/*" element={<AdminPanel />} />
      <Route path="/employee/*" element={<EmployeePanel />} />
      <Route path="/client/*" element={<ClientPanel />} />
      <Route path="/entry" element={<CRMEntryPage />} />
      <Route path="*" element={<Navigate to="/crm/admin" replace />} />
    </Routes>
  );
}
