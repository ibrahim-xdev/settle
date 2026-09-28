import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axios";

export default function CreateInvoiceModal({
  isOpen,
  onClose,
  onInvoiceCreated,
}) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    projectDescription: "",
    amount: "",
    dueDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSmtpMissing, setIsSmtpMissing] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setIsSmtpMissing(false);

    try {
      const payload = { ...form, amount: parseFloat(form.amount) };

      // 1. Create Invoice & trigger Nodemailer send on backend
      const res = await api.post("/api/invoices", payload);

      // 2. Fetch and trigger PDF download Blob
      try {
        const pdfResponse = await api.get(`/api/invoices/${res.data.id}/pdf`, {
          responseType: "blob",
        });

        const blob = new Blob([pdfResponse.data], { type: "application/pdf" });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.setAttribute(
          "download",
          `${res.data.invoiceNumber || "invoice"}.pdf`,
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
      } catch (pdfErr) {
        console.error("PDF download stream failed:", pdfErr);
      }

      // Reset form state & trigger callbacks
      setForm({
        clientName: "",
        clientEmail: "",
        projectDescription: "",
        amount: "",
        dueDate: "",
      });

      if (onInvoiceCreated) onInvoiceCreated();
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to create invoice.";
      setError(errorMsg);

      if (errorMsg.toLowerCase().includes("smtp")) {
        setIsSmtpMissing(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#17140F]/40 dark:bg-black/60 backdrop-blur-sm p-4 font-body"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            className="w-full max-w-lg bg-white dark:bg-[#1E1E1E] rounded-[12px] border border-[#DEDACD] dark:border-[#2C2C2C] shadow-[0_20px_50px_-15px_rgba(23,20,15,0.2)] dark:shadow-none p-6 md:p-8 transition-colors duration-200"
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#EDEAE1] dark:border-[#2C2C2C]">
              <div>
                <h2 className="font-display text-[22px] tracking-tight text-[#17140F] dark:text-[#E5E5E5]">
                  Create Invoice
                </h2>
                <p className="text-[13px] text-[#6E6A5E] dark:text-[#A0A0A0] mt-0.5">
                  Draft a new invoice, generate the PDF, and send it directly.
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-[#6E6A5E] dark:text-[#A0A0A0] hover:text-[#17140F] dark:hover:text-white p-1.5 rounded-[4px] hover:bg-[#F4F2ED] dark:hover:bg-[#2A2A2A] transition-colors active:scale-90"
              >
                ✕
              </button>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="mt-4 p-3.5 rounded-[6px] bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-[13px] flex flex-col gap-2">
                <span>{error}</span>
                {isSmtpMissing && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate("/dashboard/settings");
                    }}
                    className="self-start text-[12px] font-semibold underline text-red-800 dark:text-red-300 hover:text-red-950 dark:hover:text-red-100"
                  >
                    Go to Settings →
                  </button>
                )}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#17140F] dark:text-[#E5E5E5] mb-1">
                  Client Name
                </label>
                <input
                  type="text"
                  name="clientName"
                  value={form.clientName}
                  onChange={handleChange}
                  placeholder="West Construction Group"
                  required
                  className="w-full h-10 px-3.5 rounded-[6px] border border-[#DEDACD] dark:border-[#2C2C2C] bg-[#F4F2ED]/40 dark:bg-[#121212] text-[14px] text-[#17140F] dark:text-white placeholder-[#9E9A8E] dark:placeholder-[#666666] focus:outline-none focus:border-[#17140F] dark:focus:border-[#888888] focus:bg-white dark:focus:bg-[#181818] transition-all"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#17140F] dark:text-[#E5E5E5] mb-1">
                  Client Email
                </label>
                <input
                  type="email"
                  name="clientEmail"
                  value={form.clientEmail}
                  onChange={handleChange}
                  placeholder="billing@westconstruction.com"
                  required
                  className="w-full h-10 px-3.5 rounded-[6px] border border-[#DEDACD] dark:border-[#2C2C2C] bg-[#F4F2ED]/40 dark:bg-[#121212] text-[14px] text-[#17140F] dark:text-white placeholder-[#9E9A8E] dark:placeholder-[#666666] focus:outline-none focus:border-[#17140F] dark:focus:border-[#888888] focus:bg-white dark:focus:bg-[#181818] transition-all"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#17140F] dark:text-[#E5E5E5] mb-1">
                  Project Description
                </label>
                <textarea
                  name="projectDescription"
                  value={form.projectDescription}
                  onChange={handleChange}
                  placeholder="Landing page redesign and full frontend implementation"
                  required
                  rows={3}
                  className="w-full p-3 rounded-[6px] border border-[#DEDACD] dark:border-[#2C2C2C] bg-[#F4F2ED]/40 dark:bg-[#121212] text-[14px] text-[#17140F] dark:text-white placeholder-[#9E9A8E] dark:placeholder-[#666666] focus:outline-none focus:border-[#17140F] dark:focus:border-[#888888] focus:bg-white dark:focus:bg-[#181818] transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#17140F] dark:text-[#E5E5E5] mb-1">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="300.00"
                    required
                    className="w-full h-10 px-3.5 rounded-[6px] border border-[#DEDACD] dark:border-[#2C2C2C] bg-[#F4F2ED]/40 dark:bg-[#121212] text-[14px] text-[#17140F] dark:text-white placeholder-[#9E9A8E] dark:placeholder-[#666666] focus:outline-none focus:border-[#17140F] dark:focus:border-[#888888] focus:bg-white dark:focus:bg-[#181818] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#17140F] dark:text-[#E5E5E5] mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={form.dueDate}
                    onChange={handleChange}
                    required
                    className="w-full h-10 px-3.5 rounded-[6px] border border-[#DEDACD] dark:border-[#2C2C2C] bg-[#F4F2ED]/40 dark:bg-[#121212] text-[14px] text-[#17140F] dark:text-white focus:outline-none focus:border-[#17140F] dark:focus:border-[#888888] focus:bg-white dark:focus:bg-[#181818] transition-all [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#EDEAE1] dark:border-[#2C2C2C]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-[6px] border border-[#DEDACD] dark:border-[#2C2C2C] text-[13px] font-medium text-[#17140F] dark:text-[#E5E5E5] hover:bg-[#F4F2ED] dark:hover:bg-[#2A2A2A] transition-all active:scale-[0.97]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-[6px] bg-[#17140F] dark:bg-[#E5E5E5] text-[#F4F2ED] dark:text-[#17140F] text-[13px] font-medium hover:bg-[#2B2621] dark:hover:bg-white transition-all active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
                >
                  {loading ? "Processing..." : "Create & Send Invoice"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
