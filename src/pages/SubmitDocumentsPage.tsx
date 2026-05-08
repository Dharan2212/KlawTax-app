import { motion } from "framer-motion";
import { useState, useCallback, useRef } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/shared/SEO";
import { useDocumentStore } from "@/store/useDocumentStore";
import { useCheckoutStore } from "@/store/useCheckoutStore";
import {
  CheckCircle2, Phone, UploadCloud, MessageCircle, FileText,
  X, AlertCircle, ArrowRight, Folder, Shield,
} from "lucide-react";
import { scaleIn, fadeInDown, staggerContainer, staggerItem, fadeIn, useIsMobile } from "@/lib/motion";

export default function SubmitDocumentsPage() {
  const { documents, uploadedFiles, toggleDocument, addFile, removeFile, completedCount, requiredCount } = useDocumentStore();
  const { orderId, serviceName } = useCheckoutStore();
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const isMobile = useIsMobile();

  const totalDocs = documents.length;
  const checkedCount = completedCount();
  const progress = totalDocs > 0 ? Math.round((checkedCount / totalDocs) * 100) : 0;
  const allRequired = documents.filter((d) => d.required).every((d) => d.isChecked);

  const categories = [...new Set(documents.map((d) => d.category))];

  const processFiles = useCallback((files: File[]) => {
    setErrorMsg("");
    let hasError = false;
    files.forEach((f) => {
      if (!/\.(pdf|jpg|jpeg|png)$/i.test(f.name)) {
        setErrorMsg("Only PDF, JPG, and PNG files are allowed.");
        hasError = true;
      } else if (f.size > 5 * 1024 * 1024) {
        setErrorMsg("Each file must be under 5MB.");
        hasError = true;
      } else {
        addFile({ name: f.name, size: f.size });
      }
    });
    if (!hasError && files.length > 0) setTimeout(() => setErrorMsg(""), 3000);
  }, [addFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(Array.from(e.dataTransfer.files));
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleFileClick = () => fileInputRef.current?.click();

  /* ── Success Screen ─────────────────────────────────────── */
  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main role="main" className="pt-28 pb-16 flex-1 flex items-center justify-center px-4">
          <motion.div variants={scaleIn} initial="hidden" animate="visible" className="max-w-lg w-full text-center premium-card p-10">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-success" />
              </div>
            </div>
            <h1 className="page-title text-foreground mb-2">Documents Submitted!</h1>
            <p className="text-muted-foreground mb-8">Our team will review and start processing your application within 24 hours.</p>
            <a
              href={`https://wa.me/919999999999?text=Documents%20submitted%20for%20order%20${orderId || "my order"}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 btn-premium mb-3"
            >
              <MessageCircle className="w-4 h-4" />Confirm on WhatsApp<ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(var(--color-neutral-50))]">
      <SEO title="Submit Documents | KlawTax" noindex={true} />
      <Navbar />
      <main role="main" className="pt-28 pb-20 flex-1">
        <div className="container mx-auto px-4">

          {/* Status Banner */}
          <motion.div
            variants={fadeInDown} initial="hidden" animate="visible"
            className="max-w-4xl mx-auto mb-6"
          >
            <div className="flex items-center gap-4 p-4 rounded-xl bg-success/8 border border-success/25">
              <div className="w-9 h-9 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground">Payment Confirmed — Ready for Document Submission</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Order: <span className="font-mono font-semibold">{orderId || "KT-DEMO"}</span>
                  {serviceName && <> &nbsp;·&nbsp; {serviceName}</>}
                </p>
              </div>
            </div>
          </motion.div>

          <div className="max-w-4xl mx-auto">

            {/* Progress Card */}
            <div className="premium-card p-6 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="font-heading font-semibold text-foreground">Document Checklist</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {checkedCount} of {totalDocs} marked · {requiredCount()} required
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-2xl text-primary">{progress}%</span>
                  <p className="text-xs text-muted-foreground">complete</p>
                </div>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-success rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
                />
              </div>
              {allRequired && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-success font-medium mt-2.5 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />All required documents are confirmed — you can submit now.
                </motion.p>
              )}
            </div>

            {/* Checklist */}
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6 mb-8">
              {categories.map((cat) => (
                <div key={cat} className="premium-card overflow-hidden">
                  {/* Category header */}
                  <div className="flex items-center gap-2.5 px-6 py-4 border-b border-border bg-muted/40">
                    <Folder className="w-4 h-4 text-primary" />
                    <h3 className="font-heading font-semibold text-foreground text-sm">{cat}</h3>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {documents.filter((d) => d.category === cat && d.isChecked).length}/{documents.filter((d) => d.category === cat).length} ready
                    </span>
                  </div>

                  {/* Items */}
                  <div className="divide-y divide-border">
                    {documents.filter((d) => d.category === cat).map((d, idx) => {
                      const isStaggered = idx < 6;
                      const Tag = isStaggered ? motion.button : "button";
                      const props = isStaggered
                        ? { variants: isMobile ? fadeIn : staggerItem, initial: "hidden" as const, whileInView: "visible" as const, viewport: { once: true }, whileTap: { scale: 0.99 } }
                        : { whileTap: { scale: 0.99 } };
                      return (
                        <Tag
                          key={d.id}
                          onClick={() => toggleDocument(d.id)}
                          aria-label={`Toggle ${d.name}`}
                          aria-pressed={d.isChecked}
                          className={`w-full flex items-start gap-3 px-6 py-4 text-left transition-colors hover:bg-muted/30 ${d.isChecked ? "bg-success/4" : ""}`}
                          {...props}
                        >
                          <div className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border transition-colors ${d.isChecked ? "bg-success border-success" : "border-border bg-white"}`}>
                            {d.isChecked && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground flex items-center gap-1.5 flex-wrap">
                              {d.name}
                              {d.required && <span className="text-[10px] font-bold text-destructive border border-destructive/30 px-1.5 py-0.5 rounded">REQUIRED</span>}
                            </p>
                            {d.description && <p className="text-xs text-muted-foreground mt-0.5">{d.description}</p>}
                          </div>
                          {d.isChecked && <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />}
                        </Tag>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Submission Options */}
            <div className="grid md:grid-cols-2 gap-5 mb-6">
              {/* WhatsApp — primary */}
              <div className="premium-card p-6 border-l-4 border-l-success">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-foreground text-sm mb-0.5">Send via WhatsApp</h3>
                    <p className="text-xs text-muted-foreground">Fastest & easiest — recommended</p>
                  </div>
                </div>
                <a
                  href={`https://wa.me/919999999999?text=Submitting%20docs%20for%20${orderId || "my order"}%20-%20${encodeURIComponent(serviceName || "service")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-success text-white font-semibold hover:opacity-90 transition-opacity text-sm"
                >
                  <MessageCircle className="w-4 h-4" />Send Documents on WhatsApp
                </a>
              </div>

              {/* Upload */}
              <div className="premium-card p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[hsl(var(--color-primary-100))] flex items-center justify-center flex-shrink-0">
                    <UploadCloud className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-foreground text-sm mb-0.5">Upload Files Directly</h3>
                    <p className="text-xs text-muted-foreground">PDF, JPG, PNG — max 5MB each</p>
                  </div>
                </div>

                {errorMsg && (
                  <div className="mb-3 p-3 bg-destructive/8 text-destructive text-xs rounded-lg border border-destructive/20 flex items-center gap-2" role="alert">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />{errorMsg}
                  </div>
                )}

                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${isDragging ? "border-primary bg-[hsl(var(--color-primary-50))] scale-[1.01]" : "border-border hover:border-primary/40 hover:bg-muted/40"}`}
                  onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onClick={handleFileClick}
                >
                  <UploadCloud className={`w-8 h-8 mx-auto mb-2 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                  <p className="text-sm font-medium text-foreground mb-0.5">Drag & drop files here</p>
                  <p className="text-xs text-muted-foreground">or click to browse</p>
                  <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" ref={fileInputRef}
                    onChange={(e) => processFiles(Array.from(e.target.files || []))} aria-label="Upload documents" />
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {uploadedFiles.map((f, i) => (
                      <div key={`${f.name}-${i}`} className="flex items-center justify-between text-xs bg-muted rounded-lg px-3 py-2.5">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                          <span className="text-foreground truncate font-medium">{f.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-muted-foreground">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                          <button onClick={() => removeFile(f.name)} className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors" aria-label={`Remove ${f.name}`}>
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit CTA */}
            <button
              onClick={() => setSubmitted(true)} disabled={!allRequired}
              className="w-full py-4 btn-premium disabled:opacity-40 flex items-center justify-center gap-2 text-base mb-6"
            >
              <CheckCircle2 className="w-5 h-5" />Submit All Documents<ArrowRight className="w-4 h-4" />
            </button>

            {!allRequired && (
              <p className="text-center text-xs text-muted-foreground mb-6 flex items-center justify-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-warning" />
                Please confirm all required documents before submitting.
              </p>
            )}

            {/* Help Box */}
            <div className="rounded-xl bg-muted/60 border border-border p-5">
              <div className="flex items-start gap-3 mb-4">
                <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Need help with documents?</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Our team is available Mon–Sat, 9AM–7PM IST to guide you through the process.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href="tel:+919999999999" className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-white text-sm font-medium text-foreground hover:bg-muted transition-colors">
                  <Phone className="w-4 h-4 text-primary" />Call Support
                </a>
                <a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-success/10 text-success text-sm font-semibold hover:bg-success/20 transition-colors">
                  <MessageCircle className="w-4 h-4" />WhatsApp Help
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
