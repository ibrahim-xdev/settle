import { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { staggerContainer, fadeUpItem } from "../components/motionVariants";
import CreateInvoiceModal from "../components/CreateInvoiceModal";
import EditInvoiceModal from "../components/EditInvoiceModal";
import { useTheme } from "../context/ThemeContext";
import api from "../api/axios";

export default function DashboardOverview() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { openSidebar } = useOutletContext();
  const { theme, toggleTheme } = useTheme();
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Filter State
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal States
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await api.get("/api/invoices");
      setInvoices(res.data);
    } catch (err) {
      console.error("Failed to fetch invoices", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleEditClick = (inv) => {
    setSelectedInvoice(inv);
    setIsEditModalOpen(true);
  };

  const handleInvoiceUpdated = (updatedInv) => {
    setInvoices((prev) =>
      prev.map((item) => (item.id === updatedInv.id ? updatedInv : item)),
    );
  };

  const handleDeleteInvoice = async (inv) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete invoice ${inv.invoice_number}?`,
    );
    if (!confirmDelete) return;

    setDeletingId(inv.id);

    try {
      await api.delete(`/api/invoices/${inv.id}`);
      setInvoices((prev) => prev.filter((item) => item.id !== inv.id));
    } catch (err) {
      console.error("Failed to delete invoice:", err);
      alert(err.response?.data?.error || "Failed to delete invoice.");
    } finally {
      setDeletingId(null);
    }
  };

  const totalInvoices = invoices.length;
  const totalRevenue = invoices.reduce(
    (acc, inv) => acc + parseFloat(inv.amount || 0),
    0,
  );

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(val);

  const toggleStatus = async (inv) => {
    const nextStatus =
      inv.status?.toLowerCase() === "paid" ? "pending" : "paid";
    setUpdatingId(inv.id);

    try {
      const res = await api.patch(`/api/invoices/${inv.id}/status`, {
        status: nextStatus,
      });

      setInvoices((prev) =>
        prev.map((i) => (i.id === inv.id ? res.data.invoice : i)),
      );
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const isInvoiceOverdue = (inv) => {
    if (inv.status?.toLowerCase() === "paid") return false;
    const dueDate = new Date(inv.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const filteredInvoices = invoices.filter((inv) => {
    const status = inv.status?.toLowerCase();
    const overdue = isInvoiceOverdue(inv);

    if (statusFilter === "paid") return status === "paid";
    if (statusFilter === "pending") return status === "pending" && !overdue;
    if (statusFilter === "overdue") return overdue;
    return true;
  });

  return (
    <motion.div
      className="space-y-2 font-body max-w-6xl transition-colors duration-200"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      <header className="h-16 bg-white dark:bg-[#1E1E1E] rounded-[10px] rounded-sm border-b border-[#DEDACD] dark:border-[#2C2C2C] px-6 md:px-8 flex items-center justify-between transition-colors duration-200">
        <div className="flex items-center gap-4">
          <button
            onClick={openSidebar}
            className="md:hidden text-[#17140F] dark:text-[#E5E5E5] focus:outline-none transition-transform active:scale-90"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <h1 className="font-display text-[18px] tracking-tight text-[#17140F] dark:text-[#E5E5E5]">
            Overview
          </h1>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Dark Mode Toggle Switch */}
          <button
            onClick={toggleTheme}
            title="Toggle Dark Mode"
            className="p-2 rounded-[6px] border border-[#DEDACD] dark:border-[#2C2C2C] bg-[#F4F2ED]/60 dark:bg-[#121212] text-[#6E6A5E] dark:text-[#A0A0A0] hover:text-[#17140F] dark:hover:text-white hover:bg-white dark:hover:bg-[#2A2A2A] transition-all active:scale-95"
          >
            {theme === "dark" ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {/* Create Invoice Button */}
          <button
            onClick={() => setIsInvoiceModalOpen(true)}
            className="px-4 py-2 rounded-[6px] bg-[#17140F] dark:bg-[#E5E5E5] text-[#F4F2ED] dark:text-[#17140F] text-[13px] font-medium hover:bg-[#2B2621] dark:hover:bg-white transition-all active:scale-[0.97]"
          >
            + Create Invoice
          </button>
        </div>
      </header>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <motion.div
          variants={fadeUpItem}
          className="bg-white dark:bg-[#1E1E1E] p-6 rounded-[10px] border border-[#DEDACD] dark:border-[#2C2C2C] shadow-sm transition-colors duration-200"
        >
          <p className="text-[12px] font-medium uppercase tracking-wider text-[#6E6A5E] dark:text-[#A0A0A0]">
            Total Invoiced
          </p>
          <h2 className="font-display text-[32px] tracking-tight text-[#17140F] dark:text-[#E5E5E5] mt-2">
            {loading ? "..." : formatCurrency(totalRevenue)}
          </h2>
          <p className="text-[12px] text-[#6E6A5E] dark:text-[#A0A0A0] mt-1">
            Across {totalInvoices} created invoice
            {totalInvoices === 1 ? "" : "s"}
          </p>
        </motion.div>

        <motion.div
          variants={fadeUpItem}
          className="bg-white dark:bg-[#1E1E1E] p-6 rounded-[10px] border border-[#DEDACD] dark:border-[#2C2C2C] shadow-sm transition-colors duration-200"
        >
          <p className="text-[12px] font-medium uppercase tracking-wider text-[#6E6A5E] dark:text-[#A0A0A0]">
            Invoices Sent
          </p>
          <h2 className="font-display text-[32px] tracking-tight text-[#17140F] dark:text-[#E5E5E5] mt-2">
            {loading ? "..." : totalInvoices}
          </h2>
          <p className="text-[12px] text-[#6E6A5E] dark:text-[#A0A0A0] mt-1">
            Automated PDF dispatch
          </p>
        </motion.div>

        <motion.div
          variants={fadeUpItem}
          className="bg-white dark:bg-[#1E1E1E] p-6 rounded-[10px] border border-[#DEDACD] dark:border-[#2C2C2C] shadow-sm transition-colors duration-200"
        >
          <p className="text-[12px] font-medium uppercase tracking-wider text-[#6E6A5E] dark:text-[#A0A0A0]">
            Average Invoice
          </p>
          <h2 className="font-display text-[32px] tracking-tight text-[#17140F] dark:text-[#E5E5E5] mt-2">
            {loading
              ? "..."
              : formatCurrency(
                  totalInvoices ? totalRevenue / totalInvoices : 0,
                )}
          </h2>
          <p className="text-[12px] text-[#6E6A5E] dark:text-[#A0A0A0] mt-1">
            Per client agreement
          </p>
        </motion.div>
      </div>

      {/* Invoices Table */}
      <motion.div
        variants={fadeUpItem}
        className="bg-white dark:bg-[#1E1E1E] rounded-[10px] border border-[#DEDACD] dark:border-[#2C2C2C] shadow-sm overflow-hidden transition-colors duration-200"
      >
        <div className="p-4 border-b border-[#EDEAE1] dark:border-[#2C2C2C] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-[20px] tracking-tight text-[#17140F] dark:text-[#E5E5E5]">
              Recent Invoices
            </h3>
            <p className="text-[13px] text-[#6E6A5E] dark:text-[#A0A0A0] mt-0.5">
              Summary of recent billing events and generated invoices.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="status-filter"
              className="text-[12px] font-medium text-[#6E6A5E] dark:text-[#A0A0A0]"
            >
              Filter:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 pr-8 rounded-[6px] border border-[#DEDACD] dark:border-[#2C2C2C] bg-[#F4F2ED]/60 dark:bg-[#121212] text-[13px] text-[#17140F] dark:text-[#E5E5E5] font-medium focus:outline-none focus:border-[#17140F] dark:focus:border-[#888888] focus:bg-white dark:focus:bg-[#181818] transition-all cursor-pointer"
            >
              <option value="all">All Invoices</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-[#6E6A5E] dark:text-[#A0A0A0] text-[14px]">
            Loading invoices...
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-display text-[18px] text-[#17140F] dark:text-[#E5E5E5]">
              {invoices.length === 0
                ? "No invoices generated yet"
                : `No ${statusFilter} invoices found`}
            </p>
            <p className="text-[13px] text-[#6E6A5E] dark:text-[#A0A0A0] mt-1">
              {invoices.length === 0
                ? "Create your first invoice to populate real-time activity metrics."
                : `Try changing your filter option.`}
            </p>
            {invoices.length === 0 && (
              <button
                onClick={() => setIsInvoiceModalOpen(true)}
                className="inline-block mt-4 px-4 py-2 rounded-[6px] bg-[#17140F] dark:bg-[#E5E5E5] text-[#F4F2ED] dark:text-[#17140F] text-[13px] font-medium hover:bg-[#2B2621] dark:hover:bg-white transition-all active:scale-[0.97]"
              >
                Create Invoice
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EDEAE1] dark:border-[#2C2C2C] bg-[#F4F2ED]/50 dark:bg-[#121212]/50 text-[12px] font-medium uppercase tracking-wider text-[#6E6A5E] dark:text-[#A0A0A0]">
                  <th className="py-3 px-6">Invoice</th>
                  <th className="py-3 px-6">Client</th>
                  <th className="py-3 px-6">Due Date</th>
                  <th className="py-3 px-6">Amount</th>
                  <th className="py-3 px-6 text-center">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDEAE1] dark:divide-[#2C2C2C] text-[14px]">
                {filteredInvoices.map((inv) => {
                  const isPaid = inv.status?.toLowerCase() === "paid";
                  const overdue = isInvoiceOverdue(inv);

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-[#F4F2ED]/30 dark:hover:bg-[#252525]/50 transition-colors"
                    >
                      <td className="py-4 px-6 font-medium text-[#17140F] dark:text-[#E5E5E5]">
                        {inv.invoice_number}
                      </td>
                      <td className="py-4 px-6 text-[#17140F] dark:text-[#E5E5E5]">
                        <div>{inv.client_name}</div>
                        <div className="text-[12px] text-[#6E6A5E] dark:text-[#A0A0A0]">
                          {inv.client_email}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-[#6E6A5E] dark:text-[#A0A0A0]">
                        {new Date(inv.due_date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 font-medium text-[#17140F] dark:text-[#E5E5E5]">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => toggleStatus(inv)}
                          disabled={updatingId === inv.id}
                          title={isPaid ? "Mark as pending" : "Mark as paid"}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all active:scale-95 disabled:opacity-50 ${
                            isPaid
                              ? "bg-[#EEF4EC] dark:bg-[#1E301C] text-[#3F6B3A] dark:text-[#78B172] border-[#CBDDC6] dark:border-[#2D4D2A] hover:bg-[#E3EDE0] dark:hover:bg-[#253D23]"
                              : overdue
                                ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/60"
                                : "bg-[#F4F2ED] dark:bg-[#2A2A2A] text-[#96742B] dark:text-[#D4AF37] border-[#DEDACD] dark:border-[#383838] hover:bg-[#EDEAE1] dark:hover:bg-[#333333]"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isPaid
                                ? "bg-[#3F6B3A] dark:bg-[#78B172]"
                                : overdue
                                  ? "bg-red-600 dark:bg-red-400"
                                  : "bg-[#96742B] dark:bg-[#D4AF37]"
                            }`}
                          />
                          {updatingId === inv.id
                            ? "Saving..."
                            : isPaid
                              ? "Paid"
                              : overdue
                                ? "Overdue"
                                : "Pending"}
                        </button>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEditClick(inv)}
                            title="Edit invoice"
                            className="p-1.5 text-[#6E6A5E] dark:text-[#A0A0A0] hover:text-[#17140F] dark:hover:text-white hover:bg-[#F4F2ED] dark:hover:bg-[#2A2A2A] rounded-[4px] transition-all active:scale-90"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                            </svg>
                          </button>

                          <button
                            onClick={() => handleDeleteInvoice(inv)}
                            disabled={deletingId === inv.id}
                            title="Delete invoice"
                            className="p-1.5 text-[#6E6A5E] dark:text-[#A0A0A0] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-[4px] transition-all active:scale-90 disabled:opacity-40"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <CreateInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onInvoiceCreated={fetchInvoices}
      />

      <EditInvoiceModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        invoice={selectedInvoice}
        onInvoiceUpdated={handleInvoiceUpdated}
      />
    </motion.div>
  );
}
