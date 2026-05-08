import {
  CRMUser,
  CRMClient,
  CRMProject,
  CRMTask,
  CRMUpdate,
  CRMClientSubmission,
  CRMPayment,
  RejectedLog,
  CommunicationEntry,
} from "@/store/useCRMStore";

// ============================================================
// USERS
// ============================================================

export const mockUsers: CRMUser[] = [
  { id: "u1", name: "Ankit Sharma", role: "admin", email: "admin@klawtax.com", phone: "+91 98001 10001" },
  { id: "u2", name: "Priya Desai", role: "employee", email: "priya@klawtax.com", phone: "+91 98001 20001" },
  { id: "u3", name: "Rahul Mehta", role: "employee", email: "rahul@klawtax.com", phone: "+91 98001 20002" },
  { id: "u4", name: "Sneha Patel", role: "employee", email: "sneha@klawtax.com", phone: "+91 98001 20003" },
  { id: "u5", name: "Green Earth Foundation", role: "client", email: "contact@greenearth.org", clientId: "c1" },
  { id: "u6", name: "Shiksha Trust", role: "client", email: "info@shikshatrust.org", clientId: "c2" },
  { id: "u7", name: "Aarav Innovations LLP", role: "client", email: "legal@aaravinnovations.in", clientId: "c3" },
  { id: "u8", name: "Sakhi Women NGO", role: "client", email: "connect@sakhiwomen.org", clientId: "c4" },
];

// ============================================================
// CLIENTS
// ============================================================

export const mockClients: CRMClient[] = [
  {
    id: "c1",
    name: "Green Earth Foundation",
    email: "contact@greenearth.org",
    phone: "+91 98765 43210",
    city: "Pune, Maharashtra",
    service: "Section 8 Company Registration",
    status: "active",
    createdAt: "2026-04-01",
  },
  {
    id: "c2",
    name: "Shiksha Trust",
    email: "info@shikshatrust.org",
    phone: "+91 87654 32109",
    city: "Jaipur, Rajasthan",
    service: "Trust Registration + 12A/80G",
    status: "pending",
    createdAt: "2026-04-18",
  },
  {
    id: "c3",
    name: "Aarav Innovations LLP",
    email: "legal@aaravinnovations.in",
    phone: "+91 76543 21098",
    city: "Bengaluru, Karnataka",
    service: "LLP Registration + GST",
    status: "active",
    createdAt: "2026-03-22",
  },
  {
    id: "c4",
    name: "Sakhi Women NGO",
    email: "connect@sakhiwomen.org",
    phone: "+91 91234 56789",
    city: "Delhi, NCR",
    service: "12A + 80G + NGO DARPAN",
    status: "active",
    createdAt: "2026-02-14",
  },
  {
    id: "c5",
    name: "Horizon Healthcare Pvt Ltd",
    email: "accounts@horizonhealthcare.co",
    phone: "+91 99887 76655",
    city: "Chennai, Tamil Nadu",
    service: "Pvt Ltd Registration + FSSAI",
    status: "completed",
    createdAt: "2026-01-10",
  },
  {
    id: "c6",
    name: "Krishi Vikas Samiti",
    email: "kvsamiti@gmail.com",
    phone: "+91 80090 12345",
    city: "Bhopal, Madhya Pradesh",
    service: "NGO DARPAN + E-Anudan",
    status: "active",
    createdAt: "2026-04-28",
  },
];

// ============================================================
// PROJECTS
// ============================================================

export const mockProjects: CRMProject[] = [
  {
    id: "p1",
    title: "Section 8 Registration — Green Earth Foundation",
    serviceType: "Section 8 Company Registration",
    clientId: "c1",
    assignedTo: "u2",
    status: "active",
    progress: 65,
    startDate: "2026-04-05",
    deadline: "2026-05-30",
    totalAmount: 13500,
    notes: "Client wants expedited processing. MOA reviewed and approved.",
  },
  {
    id: "p2",
    title: "12A & 80G Registration — Green Earth Foundation",
    serviceType: "12A & 80G Certification",
    clientId: "c1",
    assignedTo: "u2",
    status: "pending",
    progress: 10,
    startDate: "2026-05-01",
    deadline: "2026-06-30",
    totalAmount: 7000,
    notes: "Waiting for Section 8 certificate before proceeding.",
  },
  {
    id: "p3",
    title: "Trust Registration + 12A/80G — Shiksha Trust",
    serviceType: "Trust Registration",
    clientId: "c2",
    assignedTo: "u3",
    status: "waiting-client",
    progress: 30,
    startDate: "2026-04-20",
    deadline: "2026-06-15",
    totalAmount: 15000,
    notes: "Waiting for notarized trust deed from client.",
  },
  {
    id: "p4",
    title: "LLP Registration — Aarav Innovations",
    serviceType: "LLP Registration",
    clientId: "c3",
    assignedTo: "u2",
    status: "review",
    progress: 85,
    startDate: "2026-03-25",
    deadline: "2026-05-10",
    totalAmount: 7000,
    notes: "LLP agreement drafted. Final review in progress.",
  },
  {
    id: "p5",
    title: "GST Registration — Aarav Innovations",
    serviceType: "GST Registration",
    clientId: "c3",
    assignedTo: "u4",
    status: "completed",
    progress: 100,
    startDate: "2026-03-25",
    deadline: "2026-04-15",
    totalAmount: 1000,
    notes: "GSTIN issued. Certificate delivered.",
  },
  {
    id: "p6",
    title: "12A + 80G + DARPAN — Sakhi Women NGO",
    serviceType: "12A, 80G & DARPAN Bundle",
    clientId: "c4",
    assignedTo: "u3",
    status: "active",
    progress: 50,
    startDate: "2026-02-20",
    deadline: "2026-05-20",
    totalAmount: 9500,
    notes: "12A filed, 80G application in progress.",
  },
  {
    id: "p7",
    title: "Pvt Ltd Registration — Horizon Healthcare",
    serviceType: "Pvt Ltd Registration",
    clientId: "c5",
    assignedTo: "u4",
    status: "completed",
    progress: 100,
    startDate: "2026-01-12",
    deadline: "2026-02-28",
    totalAmount: 7500,
    notes: "Company incorporated. Certificate issued.",
  },
  {
    id: "p8",
    title: "NGO DARPAN + E-Anudan — Krishi Vikas Samiti",
    serviceType: "NGO DARPAN + E-Anudan",
    clientId: "c6",
    assignedTo: null,
    status: "pending",
    progress: 0,
    startDate: "2026-04-28",
    deadline: "2026-05-28",
    totalAmount: 3500,
    notes: "New client. Employee assignment pending.",
  },
];

// ============================================================
// TASKS
// ============================================================

export const mockTasks: CRMTask[] = [
  // Project p1
  { id: "t1", projectId: "p1", title: "Verify director KYC documents", assignedTo: "u2", status: "done", priority: "high", dueDate: "2026-04-15" },
  { id: "t2", projectId: "p1", title: "Draft MOA & AOA", assignedTo: "u2", status: "done", priority: "high", dueDate: "2026-04-25" },
  { id: "t3", projectId: "p1", title: "Submit name approval via RUN", assignedTo: "u2", status: "done", priority: "medium", dueDate: "2026-04-28" },
  { id: "t4", projectId: "p1", title: "File incorporation with ROC", assignedTo: "u2", status: "active", priority: "high", dueDate: "2026-05-10" },
  { id: "t5", projectId: "p1", title: "Obtain PAN & TAN", assignedTo: "u2", status: "todo", priority: "medium", dueDate: "2026-05-20" },

  // Project p3
  { id: "t6", projectId: "p3", title: "Request notarized trust deed", assignedTo: "u3", status: "active", priority: "high", dueDate: "2026-05-02" },
  { id: "t7", projectId: "p3", title: "Prepare trustee declaration forms", assignedTo: "u3", status: "todo", priority: "medium", dueDate: "2026-05-12" },
  { id: "t8", projectId: "p3", title: "File with Sub-Registrar office", assignedTo: "u3", status: "todo", priority: "high", dueDate: "2026-05-25" },

  // Project p4
  { id: "t9", projectId: "p4", title: "Draft LLP agreement", assignedTo: "u2", status: "done", priority: "high", dueDate: "2026-04-10" },
  { id: "t10", projectId: "p4", title: "Obtain DSC for partners", assignedTo: "u2", status: "done", priority: "medium", dueDate: "2026-04-15" },
  { id: "t11", projectId: "p4", title: "File Form 2 & Form 3 with MCA", assignedTo: "u2", status: "done", priority: "high", dueDate: "2026-04-30" },
  { id: "t12", projectId: "p4", title: "Review and confirm LLP certificate", assignedTo: "u2", status: "active", priority: "high", dueDate: "2026-05-08" },

  // Project p6
  { id: "t13", projectId: "p6", title: "Prepare 12A application", assignedTo: "u3", status: "done", priority: "high", dueDate: "2026-03-10" },
  { id: "t14", projectId: "p6", title: "File 80G application on ITBA portal", assignedTo: "u3", status: "active", priority: "high", dueDate: "2026-05-05" },
  { id: "t15", projectId: "p6", title: "Register on NGO DARPAN portal", assignedTo: "u3", status: "todo", priority: "medium", dueDate: "2026-05-15" },

  // Project p8
  { id: "t16", projectId: "p8", title: "Initial document collection", assignedTo: "u2", status: "todo", priority: "medium", dueDate: "2026-05-05" },
];

// ============================================================
// PROJECT UPDATES (TIMELINE)
// ============================================================

export const mockUpdates: CRMUpdate[] = [
  { id: "upd1", projectId: "p1", from: "Priya Desai", fromType: "employee", message: "ROC application submitted. Reference number: ROC-MH-2026-4521. Awaiting department confirmation.", date: "2026-05-02", visibleToClient: true },
  { id: "upd2", projectId: "p1", from: "Priya Desai", fromType: "employee", message: "Name approval received for 'Green Earth Foundation Section 8 Company Ltd'.", date: "2026-04-28", visibleToClient: true },
  { id: "upd3", projectId: "p1", from: "Ankit Sharma", fromType: "admin", message: "Internal note: Director documents verified. Proceed with MOA drafting.", date: "2026-04-20", visibleToClient: false },
  { id: "upd4", projectId: "p3", from: "Rahul Mehta", fromType: "employee", message: "Sent document request to client. Awaiting notarized trust deed and trustee details.", date: "2026-04-22", visibleToClient: true },
  { id: "upd5", projectId: "p4", from: "Priya Desai", fromType: "employee", message: "LLP agreement drafted. Partners have reviewed. Final sign-off from admin pending.", date: "2026-04-30", visibleToClient: true },
  { id: "upd6", projectId: "p4", from: "Ankit Sharma", fromType: "admin", message: "Reviewed LLP agreement. Minor corrections requested on clause 7.2.", date: "2026-05-01", visibleToClient: false },
  { id: "upd7", projectId: "p5", from: "Sneha Patel", fromType: "employee", message: "GSTIN successfully issued. Certificate emailed to client. GST registration complete.", date: "2026-04-14", visibleToClient: true },
  { id: "upd8", projectId: "p6", from: "Rahul Mehta", fromType: "employee", message: "12A provisional approval received. Preparing 80G application.", date: "2026-04-10", visibleToClient: true },
  { id: "upd9", projectId: "p7", from: "Sneha Patel", fromType: "employee", message: "Incorporation certificate received from MCA. Certificate of incorporation issued. All documents delivered to client.", date: "2026-02-26", visibleToClient: true },
  { id: "upd10", projectId: "p2", from: "Ankit Sharma", fromType: "admin", message: "12A/80G registration scheduled to begin post Section 8 incorporation completion.", date: "2026-05-01", visibleToClient: true },
];

// ============================================================
// CLIENT SUBMISSIONS
// ============================================================

export const mockClientSubmissions: CRMClientSubmission[] = [
  {
    id: "cs1",
    clientId: "c1",
    projectId: "p1",
    title: "Director KYC Documents",
    description: "Aadhaar card, PAN card, and passport-size photos for 2 directors",
    fileHint: "director_kyc_bundle.pdf",
    status: "approved",
    submittedAt: "2026-04-08",
    reviewedAt: "2026-04-10",
    reviewedBy: "Ankit Sharma",
  },
  {
    id: "cs2",
    clientId: "c1",
    projectId: "p1",
    title: "Registered Office Proof",
    description: "Electricity bill and NOC from property owner for registered office address",
    fileHint: "office_proof.pdf",
    status: "approved",
    submittedAt: "2026-04-12",
    reviewedAt: "2026-04-13",
    reviewedBy: "Ankit Sharma",
  },
  {
    id: "cs3",
    clientId: "c1",
    projectId: "p1",
    title: "Notarized MOA & AOA",
    description: "Signed and notarized Memorandum and Articles of Association",
    fileHint: "moa_aoa_notarized.pdf",
    status: "pending",
    submittedAt: "2026-05-05",
  },
  {
    id: "cs4",
    clientId: "c2",
    projectId: "p3",
    title: "Trust Deed Draft",
    description: "Draft trust deed prepared by client's local lawyer — pending review",
    fileHint: "trust_deed_draft_v1.docx",
    status: "pending",
    submittedAt: "2026-05-03",
  },
  {
    id: "cs5",
    clientId: "c4",
    projectId: "p6",
    title: "NGO Bank Statement",
    description: "6 months bank statement for Sakhi Women NGO — required for 80G filing",
    fileHint: "bank_statement_6m.pdf",
    status: "approved",
    submittedAt: "2026-03-05",
    reviewedAt: "2026-03-07",
    reviewedBy: "Ankit Sharma",
  },
  {
    id: "cs6",
    clientId: "c4",
    projectId: "p6",
    title: "Annual Report FY 2024-25",
    description: "Annual report with audited balance sheet for past financial year",
    fileHint: "annual_report_fy2425.pdf",
    status: "pending",
    submittedAt: "2026-05-04",
  },
  {
    id: "cs7",
    clientId: "c3",
    projectId: "p4",
    title: "Partner Identity Documents",
    description: "KYC documents for all 3 LLP partners: Aadhaar, PAN, and address proof",
    fileHint: "partners_kyc.pdf",
    status: "approved",
    submittedAt: "2026-03-26",
    reviewedAt: "2026-03-27",
    reviewedBy: "Priya Desai",
  },
];

// ============================================================
// PAYMENTS
// ============================================================

export const mockPayments: CRMPayment[] = [
  {
    id: "pay1",
    clientId: "c1",
    projectId: "p1",
    amount: 13500,
    paidAmount: 6750,
    type: "advance",
    status: "partial",
    dueDate: "2026-04-05",
    paidDate: "2026-04-06",
    notes: "50% advance paid at project start. Balance due on completion.",
  },
  {
    id: "pay2",
    clientId: "c1",
    projectId: "p2",
    amount: 7000,
    paidAmount: 0,
    type: "advance",
    status: "pending",
    dueDate: "2026-05-10",
    notes: "Payment pending. Will initiate after Section 8 certificate delivery.",
  },
  {
    id: "pay3",
    clientId: "c2",
    projectId: "p3",
    amount: 15000,
    paidAmount: 0,
    type: "advance",
    status: "overdue",
    dueDate: "2026-04-25",
    notes: "Advance payment overdue. Follow up with client.",
  },
  {
    id: "pay4",
    clientId: "c3",
    projectId: "p4",
    amount: 7000,
    paidAmount: 7000,
    type: "full",
    status: "paid",
    dueDate: "2026-03-26",
    paidDate: "2026-03-26",
    notes: "Full payment received upfront.",
  },
  {
    id: "pay5",
    clientId: "c3",
    projectId: "p5",
    amount: 1000,
    paidAmount: 1000,
    type: "full",
    status: "paid",
    dueDate: "2026-03-26",
    paidDate: "2026-03-27",
    notes: "GST registration payment complete.",
  },
  {
    id: "pay6",
    clientId: "c4",
    projectId: "p6",
    amount: 9500,
    paidAmount: 4750,
    type: "advance",
    status: "partial",
    dueDate: "2026-02-20",
    paidDate: "2026-02-21",
    notes: "50% advance. Balance payable before 80G certificate delivery.",
  },
  {
    id: "pay7",
    clientId: "c5",
    projectId: "p7",
    amount: 7500,
    paidAmount: 7500,
    type: "full",
    status: "paid",
    dueDate: "2026-01-12",
    paidDate: "2026-01-13",
    notes: "Paid in full. Project completed.",
  },
  {
    id: "pay8",
    clientId: "c6",
    projectId: "p8",
    amount: 3500,
    paidAmount: 0,
    type: "advance",
    status: "pending",
    dueDate: "2026-05-05",
    notes: "New client. Awaiting advance payment to begin work.",
  },
];

// ============================================================
// REJECTED LOG (pre-seeded history)
// ============================================================

export const mockRejectedLog: RejectedLog[] = [
  {
    id: "rej1",
    submissionId: "cs-old-01",
    clientId: "c2",
    projectId: "p3",
    title: "Handwritten Trust Deed",
    description: "Handwritten trust deed submitted by client — not acceptable for filing",
    rejectedBy: "u1",
    rejectedByName: "Ankit Sharma",
    reason: "Handwritten documents are not acceptable. Must be typed and notarized.",
    date: "2026-04-24",
  },
  {
    id: "rej2",
    submissionId: "cs-old-02",
    clientId: "c4",
    projectId: "p6",
    title: "Unaudited Financial Statement",
    description: "Financial statement submitted without CA audit certificate",
    rejectedBy: "u1",
    rejectedByName: "Ankit Sharma",
    reason: "Financial statements must be CA-certified with UDIN number.",
    date: "2026-03-12",
  },
];

// ============================================================
// COMMUNICATION LOG
// ============================================================

export const mockCommunicationLog: CommunicationEntry[] = [
  {
    id: "comm1",
    clientId: "c2",
    projectId: "p3",
    from: "Rahul Mehta",
    fromType: "employee",
    channel: "whatsapp",
    message: "Sent document checklist to client. Asked for notarized trust deed.",
    date: "2026-04-22",
  },
  {
    id: "comm2",
    clientId: "c2",
    projectId: "p3",
    from: "Ankit Sharma",
    fromType: "admin",
    channel: "call",
    message: "Called client regarding overdue advance payment. Client confirmed will pay by May 10.",
    date: "2026-04-30",
  },
  {
    id: "comm3",
    clientId: "c1",
    projectId: "p1",
    from: "Priya Desai",
    fromType: "employee",
    channel: "whatsapp",
    message: "Shared draft MOA for client review and approval before notarization.",
    date: "2026-04-24",
  },
  {
    id: "comm4",
    clientId: "c6",
    projectId: "p8",
    from: "Ankit Sharma",
    fromType: "admin",
    channel: "call",
    message: "Welcome call done. Explained DARPAN and E-Anudan process. Client to make advance payment this week.",
    date: "2026-04-28",
  },
  {
    id: "comm5",
    clientId: "c4",
    projectId: "p6",
    from: "Rahul Mehta",
    fromType: "employee",
    channel: "whatsapp",
    message: "12A provisional approval document shared with client on WhatsApp.",
    date: "2026-04-11",
  },
];
