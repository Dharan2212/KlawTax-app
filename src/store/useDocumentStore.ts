import { create } from "zustand";

interface DocumentItem {
  id: string;
  name: string;
  description: string;
  category: string;
  isChecked: boolean;
  required: boolean;
}

interface DocumentState {
  documents: DocumentItem[];
  uploadedFiles: { name: string; size: number }[];
  toggleDocument: (id: string) => void;
  addFile: (file: { name: string; size: number }) => void;
  removeFile: (name: string) => void;
  completedCount: () => number;
  requiredCount: () => number;
}

const defaultDocs: DocumentItem[] = [
  { id: "d1", name: "Aadhaar Card", description: "Front & back copy of all directors", category: "Directors", isChecked: false, required: true },
  { id: "d2", name: "PAN Card", description: "Clear copy of PAN card", category: "Directors", isChecked: false, required: true },
  { id: "d3", name: "Passport Photo", description: "Recent passport-size photograph", category: "Directors", isChecked: false, required: true },
  { id: "d4", name: "Address Proof", description: "Utility bill or bank statement", category: "Directors", isChecked: false, required: true },
  { id: "d5", name: "Office Address Proof", description: "Rent agreement or property papers", category: "Registered Office", isChecked: false, required: true },
  { id: "d6", name: "Utility Bill", description: "Not older than 2 months", category: "Registered Office", isChecked: false, required: true },
  { id: "d7", name: "NOC from Owner", description: "If rented premises", category: "Registered Office", isChecked: false, required: true },
  { id: "d8", name: "Board Resolution", description: "If applicable", category: "Additional", isChecked: false, required: false },
];

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: defaultDocs,
  uploadedFiles: [],
  toggleDocument: (id) =>
    set((s) => ({ documents: s.documents.map((d) => (d.id === id ? { ...d, isChecked: !d.isChecked } : d)) })),
  addFile: (file) => set((s) => ({ uploadedFiles: [...s.uploadedFiles, file] })),
  removeFile: (name) => set((s) => ({ uploadedFiles: s.uploadedFiles.filter((f) => f.name !== name) })),
  completedCount: () => get().documents.filter((d) => d.isChecked).length,
  requiredCount: () => get().documents.filter((d) => d.required).length,
}));
