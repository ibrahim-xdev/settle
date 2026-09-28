import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axios";

export default function EditInvoiceModal({
  isOpen,
  onClose,
  invoice,
  onInvoiceUpdated,
}) {
  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    projectDescription: "",
    amount: "",
    dueDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Populate form with existing invoice details when opened
  useEffect(() => {
    if (invoice) {
      setForm({
        clientName: invoice.client_name || "",
        clientEmail: invoice.client_email || "",
        projectDescription: invoice.project_description || "",
        amount: invoice.amount || "",
        dueDate: invoice.due_date
          ? new Date(invoice.due_date).toISOString().split("T")[0]
          : "",
      });
    }
  }, [invoice]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        clientName: form.clientName,
        clientEmail: form.clientEmail,
        projectDescription: form.projectDescription,
        amount: parseFloat(form.amount),
        dueDate: form.dueDate,
      };

      const res = await api.put(`/api/invoices/${invoice.id}`, payload);

      // Trigger update in parent list
      if (onInvoiceUpdated) {
        onInvoiceUpdated(res.data.invoice || res.data);
      }

      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update invoice.");
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
                  Edit Invoice {invoice?.invoice_number}
                </h2>
                <p className="text-[13px] text-[#6E6A5E] dark:text-[#A0A0A0] mt-0.5">
                  Update invoice details, amounts, or due date.
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
              <div className="mt-4 p-3.5 rounded-[6px] bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-[13px]">
                {error}
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
                  required
                  className="w-full h-10 px-3.5 rounded-[6px] border border-[#DEDACD] dark:border-[#2C2C2C] bg-[#F4F2ED]/40 dark:bg-[#121212] text-[14px] text-[#17140F] dark:text-white focus:outline-none focus:border-[#17140F] dark:focus:border-[#888888] focus:bg-white dark:focus:bg-[#181818] transition-all"
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
                  required
                  className="w-full h-10 px-3.5 rounded-[6px] border border-[#DEDACD] dark:border-[#2C2C2C] bg-[#F4F2ED]/40 dark:bg-[#121212] text-[14px] text-[#17140F] dark:text-white focus:outline-none focus:border-[#17140F] dark:focus:border-[#888888] focus:bg-white dark:focus:bg-[#181818] transition-all"
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
                  required
                  rows={3}
                  className="w-full p-3 rounded-[6px] border border-[#DEDACD] dark:border-[#2C2C2C] bg-[#F4F2ED]/40 dark:bg-[#121212] text-[14px] text-[#17140F] dark:text-white focus:outline-none focus:border-[#17140F] dark:focus:border-[#888888] focus:bg-white dark:focus:bg-[#181818] transition-all resize-none"
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
                    required
                    className="w-full h-10 px-3.5 rounded-[6px] border border-[#DEDACD] dark:border-[#2C2C2C] bg-[#F4F2ED]/40 dark:bg-[#121212] text-[14px] text-[#17140F] dark:text-white focus:outline-none focus:border-[#17140F] dark:focus:border-[#888888] focus:bg-white dark:focus:bg-[#181818] transition-all"
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
                  className="px-5 py-2 rounded-[6px] bg-[#17140F] dark:bg-[#E5E5E5] text-[#F4F2ED] dark:text-[#17140F] text-[13px] font-medium hover:bg-[#2B2621] dark:hover:bg-white transition-all active:scale-[0.97] disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Update Invoice"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
