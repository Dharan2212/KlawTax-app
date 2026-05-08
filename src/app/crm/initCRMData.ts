import { useCRMStore } from "@/store/useCRMStore";
import {
  mockUsers,
  mockClients,
  mockProjects,
  mockTasks,
  mockUpdates,
  mockClientSubmissions,
  mockPayments,
  mockRejectedLog,
  mockCommunicationLog,
} from "@/lib/crmData";

export function initCRMData() {
  const adminUser = mockUsers.find((u) => u.role === "admin");
  useCRMStore.setState({
    currentUserId: adminUser?.id ?? null,
    currentRole: "admin",
    users: mockUsers,
    clients: mockClients,
    projects: mockProjects,
    tasks: mockTasks,
    updates: mockUpdates,
    clientSubmissions: mockClientSubmissions,
    payments: mockPayments,
    rejectedLog: mockRejectedLog,
    communicationLog: mockCommunicationLog,
  });
}
