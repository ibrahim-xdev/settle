import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { staggerContainer, fadeUpItem } from "../components/motionVariants";
import CreateInvoiceModal from "../components/CreateInvoiceModel";

export default function DashboardOverview() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { openSidebar } = useOutletContext();
  const [updatingId, setUpdatingId] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5001/api/invoices", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInvoices(res.data);
      } catch (err) {
        console.error("Failed to fetch invoices", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  // Compute metrics dynamically from fetched invoices
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
      const token = localStorage.getItem("token");
      const res = await axios.patch(
        `http://localhost:5001/api/invoices/${inv.id}/status`,
        { status: nextStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setInvoices((prev) =>
        prev.map((i) => (i.id === inv.id ? res.data.invoice : i)),
      );
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <motion.div
      className="space-y-2 font-body max-w-6xl"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      <header className="h-16 bg-white rounded-[10px] rounded-sm border-b border-[#DEDACD] px-6 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={openSidebar}
            className="md:hidden text-[#17140F] focus:outline-none transition-transform active:scale-90"
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
          <h1 className="font-display text-[18px] tracking-tight">Overview</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsInvoiceModalOpen(true)}
            className="px-4 py-2 rounded-[6px] bg-[#17140F] text-[#F4F2ED] text-[13px] font-medium hover:bg-[#2B2621] transition-all active:scale-[0.97]"
          >
            + Create Invoice
          </button>
        </div>
      </header>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* Total Revenue */}
        <motion.div
          variants={fadeUpItem}
          className="bg-white p-6 rounded-[10px] border border-[#DEDACD] shadow-sm"
        >
          <p className="text-[12px] font-medium uppercase tracking-wider text-[#6E6A5E]">
            Total Invoiced
          </p>
          <h2 className="font-display text-[32px] tracking-tight text-[#17140F] mt-2">
            {loading ? "..." : formatCurrency(totalRevenue)}
          </h2>
          <p className="text-[12px] text-[#6E6A5E] mt-1">
            Across {totalInvoices} created invoice
            {totalInvoices === 1 ? "" : "s"}
          </p>
        </motion.div>

        {/* Invoice Count */}
        <motion.div
          variants={fadeUpItem}
          className="bg-white p-6 rounded-[10px] border border-[#DEDACD] shadow-sm"
        >
          <p className="text-[12px] font-medium uppercase tracking-wider text-[#6E6A5E]">
            Invoices Sent
          </p>
          <h2 className="font-display text-[32px] tracking-tight text-[#17140F] mt-2">
            {loading ? "..." : totalInvoices}
          </h2>
          <p className="text-[12px] text-[#6E6A5E] mt-1">
            Automated PDF dispatch
          </p>
        </motion.div>

        {/* Average Value */}
        <motion.div
          variants={fadeUpItem}
          className="bg-white p-6 rounded-[10px] border border-[#DEDACD] shadow-sm"
        >
          <p className="text-[12px] font-medium uppercase tracking-wider text-[#6E6A5E]">
            Average Invoice
          </p>
          <h2 className="font-display text-[32px] tracking-tight text-[#17140F] mt-2">
            {loading
              ? "..."
              : formatCurrency(
                  totalInvoices ? totalRevenue / totalInvoices : 0,
                )}
          </h2>
          <p className="text-[12px] text-[#6E6A5E] mt-1">
            Per client agreement
          </p>
        </motion.div>
      </div>

      {/* Recent Activity Table */}
      <motion.div
        variants={fadeUpItem}
        className="bg-white rounded-[10px] border border-[#DEDACD] shadow-sm overflow-hidden"
      >
        <div className="p-3 border-b border-[#EDEAE1] flex items-center justify-between">
          <div>
            <h3 className="font-display text-[20px] tracking-tight text-[#17140F]">
              Recent Invoices
            </h3>
            <p className="text-[13px] text-[#6E6A5E] mt-0.5">
              Summary of recent billing events and generated invoices.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-[#6E6A5E] text-[14px]">
            Loading invoices...
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-display text-[18px] text-[#17140F]">
              No invoices generated yet
            </p>
            <p className="text-[13px] text-[#6E6A5E] mt-1">
              Create your first invoice to populate real-time activity metrics.
            </p>
            <button
              onClick={openInvoiceModal}
              className="inline-block mt-4 px-4 py-2 rounded-[6px] bg-[#17140F] text-[#F4F2ED] text-[13px] font-medium hover:bg-[#2B2621] transition-all active:scale-[0.97]"
            >
              Create Invoice
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EDEAE1] bg-[#F4F2ED]/50 text-[12px] font-medium uppercase tracking-wider text-[#6E6A5E]">
                  <th className="py-3 px-6">Invoice</th>
                  <th className="py-3 px-6">Client</th>
                  <th className="py-3 px-6">Due Date</th>
                  <th className="py-3 px-6">Amount</th>
                  <th className="py-3 px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDEAE1] text-[14px]">
                {invoices.slice(0, 5).map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-[#F4F2ED]/30 transition-colors"
                  >
                    <td className="py-4 px-6 font-medium text-[#17140F]">
                      {inv.invoice_number}
                    </td>
                    <td className="py-4 px-6 text-[#17140F]">
                      <div>{inv.client_name}</div>
                      <div className="text-[12px] text-[#6E6A5E]">
                        {inv.client_email}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-[#6E6A5E]">
                      {new Date(inv.due_date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 font-medium text-[#17140F]">
                      {formatCurrency(inv.amount)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {(() => {
                        const isPaid = inv.status?.toLowerCase() === "paid";
                        return (
                          <button
                            onClick={() => toggleStatus(inv)}
                            disabled={updatingId === inv.id}
                            title={isPaid ? "Mark as pending" : "Mark as paid"}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${
                              isPaid
                                ? "bg-[#EEF4EC] text-[#3F6B3A] border-[#CBDDC6] hover:bg-[#E3EDE0]"
                                : "bg-[#F4F2ED] text-[#96742B] border-[#DEDACD] hover:bg-[#EDEAE1]"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isPaid ? "bg-[#3F6B3A]" : "bg-[#96742B]"
                              }`}
                            />
                            {updatingId === inv.id
                              ? "Saving..."
                              : isPaid
                                ? "Paid"
                                : "Pending"}
                          </button>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <CreateInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
      />
    </motion.div>
  );
}
