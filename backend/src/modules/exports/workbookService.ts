/**
 * WorkbookService — Excel workbook generation for KlawTax CRM exports.
 * Uses exceljs to produce multi-sheet XLSX workbooks.
 */

import ExcelJS from 'exceljs';
import { Types } from 'mongoose';
import { User } from '../../models/index';
import { ClientProfile } from '../../models/clientProfile';
import { EmployeeProfile } from '../../models/employeeProfile';
import { ProjectModel } from '../../models/project';
import { Invoice } from '../../models/invoice';
import { Lead } from '../../models/lead';
import { SupportTicket } from '../../models/supportTicket';

// ─── Style constants ──────────────────────────────────────────────────────────

const NAVY      = 'FF0F1B4C';
const GOLD      = 'FFD97706';
const LT_BLUE   = 'FFDBEAFE';
const LT_GRAY   = 'FFF1F5F9';
const WHITE     = 'FFFFFFFF';
const DARK_TEXT = 'FF334155';

// ─── Style helpers ────────────────────────────────────────────────────────────

function styleHeader(row: ExcelJS.Row): void {
  row.eachCell((cell) => {
    cell.font      = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Arial', size: 10 };
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    cell.border    = { bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
  });
  row.height = 22;
}

function styleSectionHeader(row: ExcelJS.Row): void {
  row.eachCell((cell) => {
    cell.font      = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Arial', size: 10 };
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: GOLD } };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
  });
  row.height = 22;
}

function styleData(row: ExcelJS.Row, even: boolean): void {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: even ? LT_GRAY : WHITE } };
    cell.font      = { name: 'Arial', size: 9.5, color: { argb: DARK_TEXT } };
    cell.alignment = { vertical: 'middle' };
    cell.border    = { bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } } };
  });
  row.height = 18;
}

function addTitle(ws: ExcelJS.Worksheet, title: string, cols: number): void {
  ws.mergeCells(1, 1, 1, cols);
  const c = ws.getCell(1, 1);
  c.value     = title;
  c.font      = { bold: true, size: 13, name: 'Arial', color: { argb: NAVY } };
  c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: LT_BLUE } };
  c.alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getRow(1).height = 28;
  ws.addRow([]);
}

function autoWidth(ws: ExcelJS.Worksheet, min = 10, max = 42): void {
  ws.columns.forEach((col) => {
    let w = min;
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = String(cell.value ?? '').length;
      if (len > w) w = len;
    });
    col.width = Math.min(w + 2, max);
  });
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtDate(d?: Date | string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtRupee(n?: number | null): string {
  if (n == null) return '—';
  return '₹' + n.toLocaleString('en-IN');
}

function cap(s?: string | null): string {
  if (!s) return '—';
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Filter helpers ───────────────────────────────────────────────────────────

export interface ExportFilters {
  search?:        string;
  status?:        string;
  assignedTo?:    string;
  dateFrom?:      string;
  dateTo?:        string;
  paymentStatus?: string;
  priority?:      string;
}

function mkDateRange(f: ExportFilters): { $gte?: Date; $lte?: Date } | undefined {
  if (!f.dateFrom && !f.dateTo) return undefined;
  const r: { $gte?: Date; $lte?: Date } = {};
  if (f.dateFrom) r.$gte = new Date(f.dateFrom);
  if (f.dateTo)   { const d = new Date(f.dateTo); d.setHours(23, 59, 59, 999); r.$lte = d; }
  return r;
}

// ─── Sheet builders ───────────────────────────────────────────────────────────

async function addSummarySheet(wb: ExcelJS.Workbook): Promise<void> {
  const ws = wb.addWorksheet('Summary');

  const [
    totalClients, totalEmployees, totalProjects,
    activeProjectsRes, overdueProjectsRes,
    totalLeads, openTicketsRes,
    revenueRes, pendingRes,
  ] = await Promise.all([
    ClientProfile.countDocuments({}),
    EmployeeProfile.countDocuments({}),
    ProjectModel.countDocuments({}),
    ProjectModel.countDocuments({ projectStatus: { $in: ['in_progress','under_review','onboarding','waiting_client'] } }),
    ProjectModel.countDocuments({ isOverdue: true }),
    Lead.countDocuments({}),
    SupportTicket.countDocuments({ ticketStatus: { $in: ['open','in_progress'] } }),
    Invoice.aggregate([
      { $match: { invoiceStatus: 'paid' } },
      { $group: { _id: null, t: { $sum: '$totalAmount' } } },
    ]),
    Invoice.aggregate([
      { $match: { invoiceStatus: { $in: ['pending','partial_paid','overdue'] } } },
      { $group: { _id: null, t: { $sum: '$amountDue' } } },
    ]),
  ]);

  const revenue = (revenueRes[0] as { t?: number } | undefined)?.t ?? 0;
  const pending = (pendingRes[0] as { t?: number } | undefined)?.t ?? 0;
  const genDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  ws.mergeCells('A1:C1');
  const hCell = ws.getCell('A1');
  hCell.value     = 'KlawTax CRM — Operational Summary Report';
  hCell.font      = { bold: true, size: 15, name: 'Arial', color: { argb: NAVY } };
  hCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: LT_BLUE } };
  hCell.alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getRow(1).height = 32;

  ws.mergeCells('A2:C2');
  ws.getCell('A2').value = `Generated: ${genDate}`;
  ws.getCell('A2').font  = { name: 'Arial', size: 9.5, color: { argb: 'FF64748B' } };
  ws.addRow([]);

  const sections: Array<[string, Array<[string, string | number]>]> = [
    ['Clients & Employees', [
      ['Total Clients',   totalClients],
      ['Total Employees', totalEmployees],
    ]],
    ['Projects', [
      ['Total Projects',    totalProjects],
      ['Active Projects',   activeProjectsRes],
      ['Overdue Projects',  overdueProjectsRes],
    ]],
    ['Revenue', [
      ['Total Revenue Collected', fmtRupee(revenue)],
      ['Pending Payments',        fmtRupee(pending)],
    ]],
    ['Leads & Support', [
      ['Total Leads',          totalLeads],
      ['Open Support Tickets', openTicketsRes],
    ]],
  ];

  for (const [title, rows] of sections) {
    const hRow = ws.addRow([title, '']);
    styleSectionHeader(hRow);
    ws.mergeCells(hRow.number, 1, hRow.number, 2);

    rows.forEach(([label, value], i) => {
      const dr = ws.addRow([label, value]);
      styleData(dr, i % 2 === 0);
      dr.getCell(2).font = { bold: true, name: 'Arial', size: 9.5, color: { argb: NAVY } };
    });
    ws.addRow([]);
  }

  ws.getColumn(1).width = 34;
  ws.getColumn(2).width = 26;
}

async function addClientsSheet(wb: ExcelJS.Workbook, f: ExportFilters): Promise<void> {
  const ws = wb.addWorksheet('Clients');

  // Build user filter
  const uf: Record<string, unknown> = { role: 'client' };
  if (f.status) uf['accountStatus'] = f.status;
  const cr = mkDateRange(f);
  if (cr) uf['createdAt'] = cr;

  // Use aggregate to join profile (which has dynamic CRM fields)
  const pipeline: unknown[] = [
    { $match: uf },
    { $lookup: { from: 'clientprofiles', localField: '_id', foreignField: 'userId', as: 'profile' } },
    { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
  ];
  if (f.search) {
    const rx = new RegExp(f.search, 'i');
    (pipeline as Record<string, unknown>[]).push({
      $match: {
        $or: [
          { firstName: rx }, { lastName: rx }, { email: rx }, { phone: rx },
          { 'profile.organizationName': rx },
        ],
      },
    });
  }
  if (f.paymentStatus) {
    (pipeline as Record<string, unknown>[]).push({ $match: { 'profile.paymentStatus': f.paymentStatus } });
  }
  pipeline.push({ $sort: { createdAt: -1 } }, { $limit: 5000 });

  const docs = await User.aggregate(pipeline as never[]);

  const COLS = 9;
  addTitle(ws, 'KlawTax — Clients Export', COLS);
  const hr = ws.addRow(['Name','Email','Phone','City','Account Status','Work Status','Payment Status','Follow-up Date','Registered On']);
  styleHeader(hr);

  docs.forEach((u: Record<string, unknown>, i: number) => {
    const p = u['profile'] as Record<string, unknown> | null;
    const row = ws.addRow([
      `${u['firstName'] ?? ''} ${u['lastName'] ?? ''}`.trim(),
      u['email'] ?? '—',
      u['phone'] ?? '—',
      (p?.['city'] as string) ?? '—',
      cap(u['accountStatus'] as string),
      cap(p?.['workStatus'] as string),
      cap(p?.['paymentStatus'] as string),
      fmtDate(p?.['followUpDate'] as string),
      fmtDate(u['createdAt'] as string),
    ]);
    styleData(row, i % 2 === 0);
  });
  autoWidth(ws);
}

async function addEmployeesSheet(wb: ExcelJS.Workbook, f: ExportFilters): Promise<void> {
  const ws = wb.addWorksheet('Employees');

  const uf: Record<string, unknown> = { role: 'employee' };
  if (f.status) uf['accountStatus'] = f.status;
  if (f.search) {
    const rx = new RegExp(f.search, 'i');
    uf['$or'] = [{ firstName: rx }, { lastName: rx }, { email: rx }];
  }

  const users = await User.find(uf).lean().limit(2000);
  const userIds = users.map((u) => u._id);
  const profiles = await EmployeeProfile.find({ userId: { $in: userIds } }).lean();
  const profMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

  const counts = await ProjectModel.aggregate([
    { $match: { projectStatus: { $nin: ['completed','cancelled'] } } },
    { $unwind: '$assignedEmployees' },
    { $group: { _id: '$assignedEmployees.userId', n: { $sum: 1 } } },
  ]) as Array<{ _id: unknown; n: number }>;
  const cntMap = new Map(counts.map((x) => [String(x._id), x.n]));

  addTitle(ws, 'KlawTax — Employees Export', 7);
  const hr = ws.addRow(['Name','Email','Phone','Department','Employment Status','Account Status','Active Projects']);
  styleHeader(hr);

  users.forEach((u, i) => {
    const p = profMap.get(String(u._id));
    const row = ws.addRow([
      `${u.firstName} ${u.lastName}`.trim(),
      u.email,
      (u as Record<string, unknown>)['phone'] ?? '—',
      cap(p?.department),
      cap(p?.employmentStatus),
      cap(u.accountStatus),
      cntMap.get(String(u._id)) ?? 0,
    ]);
    styleData(row, i % 2 === 0);
  });
  autoWidth(ws);
}

async function addProjectsSheet(wb: ExcelJS.Workbook, f: ExportFilters): Promise<void> {
  const ws = wb.addWorksheet('Projects');

  const pf: Record<string, unknown> = {};
  if (f.status) pf['projectStatus'] = f.status;
  const cr = mkDateRange(f);
  if (cr) pf['createdAt'] = cr;
  if (f.assignedTo && Types.ObjectId.isValid(f.assignedTo)) {
    pf['assignedEmployees.userId'] = new Types.ObjectId(f.assignedTo);
  }

  const projects = await ProjectModel.find(pf)
    .populate('clientId', 'firstName lastName')
    .lean()
    .limit(5000);

  addTitle(ws, 'KlawTax — Projects Export', 9);
  const hr = ws.addRow(['Project Code','Title','Client','Status','Priority','Overdue','Stalled','Expected Delivery','Created On']);
  styleHeader(hr);

  projects.forEach((p, i) => {
    const client = p.clientId as unknown as { firstName?: string; lastName?: string } | null;
    const row = ws.addRow([
      p.projectCode ?? '—',
      p.title ?? '—',
      client ? `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim() : '—',
      cap(p.projectStatus),
      cap(p.projectPriority),
      p.isOverdue ? 'Yes' : 'No',
      p.isStalled ? 'Yes' : 'No',
      fmtDate(p.expectedDeliveryDate as unknown as Date),
      fmtDate((p as unknown as Record<string,unknown>)['createdAt'] as string),
    ]);
    styleData(row, i % 2 === 0);
    if (p.isOverdue) row.getCell(6).font = { bold: true, color: { argb: 'FFDC2626' }, name: 'Arial', size: 9.5 };
  });
  autoWidth(ws);
}

async function addPaymentsSheet(wb: ExcelJS.Workbook, f: ExportFilters): Promise<void> {
  const ws = wb.addWorksheet('Payments');

  const inf: Record<string, unknown> = {};
  const status = f.paymentStatus ?? f.status;
  if (status) inf['invoiceStatus'] = status;
  const cr = mkDateRange(f);
  if (cr) inf['createdAt'] = cr;

  const invoices = await Invoice.find(inf)
    .populate('clientId', 'firstName lastName')
    .populate('projectId', 'projectCode title')
    .lean()
    .limit(5000);

  addTitle(ws, 'KlawTax — Payments Export', 9);
  const hr = ws.addRow(['Invoice #','Client','Project','Status','Total Amount','Amount Paid','Amount Due','Due Date','Created On']);
  styleHeader(hr);

  invoices.forEach((inv, i) => {
    const client  = inv.clientId  as unknown as { firstName?: string; lastName?: string } | null;
    const project = inv.projectId as unknown as { projectCode?: string; title?: string }  | null;
    const row = ws.addRow([
      (inv as Record<string,unknown>)['invoiceNumber'] ?? '—',
      client  ? `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim() : '—',
      project ? `${project.projectCode ?? ''} ${project.title ?? ''}`.trim() : '—',
      cap((inv as Record<string,unknown>)['invoiceStatus'] as string),
      fmtRupee(inv.totalAmount),
      fmtRupee(inv.amountPaid),
      fmtRupee(inv.amountDue),
      fmtDate((inv as Record<string,unknown>)['dueDate'] as string),
      fmtDate(inv.createdAt),
    ]);
    styleData(row, i % 2 === 0);
    if ((inv as Record<string,unknown>)['invoiceStatus'] === 'overdue') {
      row.getCell(4).font = { bold: true, color: { argb: 'FFDC2626' }, name: 'Arial', size: 9.5 };
    }
  });
  autoWidth(ws);
}

async function addFollowupsSheet(wb: ExcelJS.Workbook): Promise<void> {
  const ws = wb.addWorksheet('Follow-ups');

  const today = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
  const weekEnd  = new Date(today); weekEnd.setDate(weekEnd.getDate()+7);

  // Use aggregate to get profile + user
  const docs = await ClientProfile.aggregate([
    { $match: { followUpDate: { $exists: true, $ne: null } } },
    { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    { $limit: 3000 },
  ]) as Array<Record<string, unknown>>;

  addTitle(ws, 'KlawTax — Follow-ups Export', 5);
  const hr = ws.addRow(['Client Name','Email','Phone','Follow-up Date','Status']);
  styleHeader(hr);

  docs.forEach((doc, i) => {
    const u = doc['user'] as Record<string,unknown> | null;
    if (!u) return;
    const fup = doc['followUpDate'] ? new Date(doc['followUpDate'] as string) : null;
    let status = 'Upcoming';
    if (fup) {
      if (fup < today)    status = 'Overdue';
      else if (fup < tomorrow) status = 'Today';
      else if (fup < weekEnd)  status = 'This Week';
    }
    const row = ws.addRow([
      `${u['firstName'] ?? ''} ${u['lastName'] ?? ''}`.trim(),
      u['email'] ?? '—',
      u['phone'] ?? '—',
      fmtDate(fup),
      status,
    ]);
    styleData(row, i % 2 === 0);
    if (status === 'Overdue') row.getCell(5).font = { bold: true, color: { argb: 'FFDC2626' }, name: 'Arial', size: 9.5 };
    if (status === 'Today')   row.getCell(5).font = { bold: true, color: { argb: 'FFD97706' }, name: 'Arial', size: 9.5 };
  });
  autoWidth(ws);
}

async function addLeadsSheet(wb: ExcelJS.Workbook, f: ExportFilters): Promise<void> {
  const ws = wb.addWorksheet('Leads');

  const lf: Record<string, unknown> = {};
  if (f.status)   lf['status']   = f.status;
  if (f.priority) lf['priority'] = f.priority;
  const cr = mkDateRange(f);
  if (cr) lf['createdAt'] = cr;
  if (f.assignedTo && Types.ObjectId.isValid(f.assignedTo)) {
    lf['assignedTo'] = new Types.ObjectId(f.assignedTo);
  }
  if (f.search) {
    const rx = new RegExp(f.search, 'i');
    lf['$or'] = [{ fullName: rx }, { email: rx }, { phone: rx }];
  }

  const leads = await Lead.find(lf).lean().limit(5000);

  addTitle(ws, 'KlawTax — Leads Export', 8);
  const hr = ws.addRow(['Name','Email','Phone','Service Interest','Status','Priority','Source','Created On']);
  styleHeader(hr);

  leads.forEach((l, i) => {
    const row = ws.addRow([
      l.fullName ?? '—',
      l.email ?? '—',
      l.phone ?? '—',
      (l.serviceInterestSlugs ?? []).join(', ') || '—',
      cap(l.status),
      cap(l.priority),
      cap(l.leadSource),
      fmtDate(l.createdAt),
    ]);
    styleData(row, i % 2 === 0);
  });
  autoWidth(ws);
}

async function addSupportSheet(wb: ExcelJS.Workbook, f: ExportFilters): Promise<void> {
  const ws = wb.addWorksheet('Support Tickets');

  const sf: Record<string, unknown> = {};
  if (f.status)   sf['ticketStatus'] = f.status;
  if (f.priority) sf['priority']     = f.priority;
  const cr = mkDateRange(f);
  if (cr) sf['createdAt'] = cr;

  const tickets = await SupportTicket.find(sf)
    .populate('clientId',    'firstName lastName')
    .populate('assignedToId','firstName lastName')
    .lean()
    .limit(5000);

  addTitle(ws, 'KlawTax — Support Tickets Export', 7);
  const hr = ws.addRow(['Ticket #','Subject','Client','Status','Priority','Assigned To','Created On']);
  styleHeader(hr);

  tickets.forEach((t, i) => {
    const client   = t.clientId    as unknown as { firstName?: string; lastName?: string } | null;
    const assigned = t.assignedToId as unknown as { firstName?: string; lastName?: string } | null;
    const raw = t as unknown as Record<string, unknown>;
    const row = ws.addRow([
      raw['ticketNumber'] ?? '—',
      t.subject ?? '—',
      client   ? `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim()   : '—',
      cap(raw['ticketStatus'] as string),
      cap(t.priority),
      assigned ? `${assigned.firstName ?? ''} ${assigned.lastName ?? ''}`.trim() : 'Unassigned',
      fmtDate(t.createdAt),
    ]);
    styleData(row, i % 2 === 0);
  });
  autoWidth(ws);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export type ExportSheetTarget =
  | 'clients' | 'employees' | 'projects' | 'payments'
  | 'followups' | 'leads' | 'support' | 'dashboard_report';

export interface BuildWorkbookOptions {
  target:   ExportSheetTarget;
  filters?: ExportFilters;
}

export async function buildWorkbook(opts: BuildWorkbookOptions): Promise<{ buffer: Buffer; filename: string }> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'KlawTax CRM';
  wb.created = new Date();

  const f    = opts.filters ?? {};
  const date = new Date().toISOString().slice(0, 10);

  if (opts.target === 'dashboard_report') {
    await addSummarySheet(wb);
    await addClientsSheet(wb, f);
    await addProjectsSheet(wb, f);
    await addPaymentsSheet(wb, f);
    await addFollowupsSheet(wb);
    await addLeadsSheet(wb, f);
    await addSupportSheet(wb, f);
    const buf = Buffer.from(await wb.xlsx.writeBuffer());
    return { buffer: buf, filename: `crm-summary-report-${date}.xlsx` };
  }

  const map: Record<ExportSheetTarget, () => Promise<void>> = {
    clients:          () => addClientsSheet(wb, f),
    employees:        () => addEmployeesSheet(wb, f),
    projects:         () => addProjectsSheet(wb, f),
    payments:         () => addPaymentsSheet(wb, f),
    followups:        () => addFollowupsSheet(wb),
    leads:            () => addLeadsSheet(wb, f),
    support:          () => addSupportSheet(wb, f),
    dashboard_report: () => Promise.resolve(),
  };

  await map[opts.target]();
  const buf = Buffer.from(await wb.xlsx.writeBuffer());
  return { buffer: buf, filename: `${opts.target.replace(/_/g, '-')}-export-${date}.xlsx` };
}
