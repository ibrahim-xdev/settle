import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useOutletContext } from "react-router-dom";

export default function SettingsPage() {
  const { openSidebar } = useOutletContext();

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    smtp_user: "",
    smtp_pass: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    fetchUserSettings();
  }, []);

  const fetchUserSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5001/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile({
        name: res.data.name || "",
        email: res.data.email || "",
        smtp_user: res.data.smtp_user || res.data.email || "",
        smtp_pass: res.data.smtp_pass || "",
      });
    } catch (err) {
      console.error("Failed to fetch settings", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: "", message: "" });

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "http://localhost:5001/api/auth/settings",
        {
          name: profile.name,
          smtp_user: profile.smtp_user,
          smtp_pass: profile.smtp_pass,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setStatus({
        type: "success",
        message: "Settings updated successfully.",
      });
    } catch (err) {
      setStatus({
        type: "error",
        message: err.response?.data?.error || "Failed to save settings.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-[#6E6A5E] text-[14px] font-body">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-2 font-body max-w-5xl">
      {/* Page Header */}
      <div className="h-16 bg-white rounded-[10px] rounded-sm border-b border-[#DEDACD] px-6 md:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={openSidebar}
            aria-label="Open sidebar"
            title="Open navigation"
            className="md:hidden shrink-0 p-1.5 -ml-1 text-[#17140F] hover:bg-[#F4F2ED] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#DEDACD] transition-all active:scale-90"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <h2 className="font-display text-[18px] tracking-tight text-[#17140F] whitespace-nowrap">
            Account Settings
          </h2>
        </div>

        <p className="text-[13px] text-[#6E6A5E] mt-0.5 text-right hidden sm:block">
          Manage your account profile and custom email SMTP credentials for
          sending invoices.
        </p>
      </div>

      <AnimatePresence>
        {status.message && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className={`p-3.5 rounded-[6px] text-[13px] border ${
              status.type === "error"
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          >
            {status.message}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Details Card */}
        <div className="bg-white rounded-[10px] border border-[#DEDACD] shadow-sm p-6 space-y-2">
          <h3 className="font-display text-[18px] text-[#17140F]">
            Personal Information
          </h3>
          <p className="text-[13px] text-[#6E6A5E] -mt-2">
            This name appears on the invoice header as the sender.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-[13px] font-medium text-[#17140F] mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
                required
                className="w-full h-11 px-3.5 rounded-[6px] border border-[#DEDACD] bg-[#F4F2ED]/40 text-[14px] text-[#17140F] focus:outline-none focus:border-[#17140F] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#17140F] mb-1.5">
                Account Email (Read-only)
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full h-11 px-3.5 rounded-[6px] border border-[#DEDACD] bg-[#F4F2ED]/20 text-[14px] text-[#6E6A5E] cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* SMTP Configuration Card */}
        <div className="bg-white rounded-[10px] border border-[#DEDACD] shadow-sm p-6 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display text-[18px] text-[#17140F]">
                Email Dispatch Configuration (Gmail SMTP)
              </h3>
              <p className="text-[13px] text-[#6E6A5E] mt-0.5">
                Settle sends PDFs directly from your Gmail account using a
                16-character App Password.
              </p>
            </div>
            <a
              href="https://myaccount.google.com/apppasswords"
              target="_blank"
              rel="noreferrer"
              className="text-[12px] font-medium text-[#96742B] hover:underline"
            >
              Get App Password ↗
            </a>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-[13px] font-medium text-[#17140F] mb-1.5">
                SMTP Username (Gmail Email)
              </label>
              <input
                type="email"
                name="smtp_user"
                value={profile.smtp_user}
                onChange={handleChange}
                placeholder="your.email@gmail.com"
                required
                className="w-full h-11 px-3.5 rounded-[6px] border border-[#DEDACD] bg-[#F4F2ED]/40 text-[14px] text-[#17140F] placeholder-[#9E9A8E] focus:outline-none focus:border-[#17140F] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#17140F] mb-1.5">
                Gmail App Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="smtp_pass"
                  value={profile.smtp_pass}
                  onChange={handleChange}
                  placeholder="xxxx xxxx xxxx xxxx"
                  required
                  className="w-full h-11 pl-3.5 pr-12 rounded-[6px] border border-[#DEDACD] bg-[#F4F2ED]/40 text-[14px] text-[#17140F] placeholder-[#9E9A8E] focus:outline-none focus:border-[#17140F] focus:bg-white transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] font-medium text-[#6E6A5E] hover:text-[#17140F] transition-all active:scale-95"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <p className="text-[11px] text-[#6E6A5E] mt-1.5">
                Stored securely to authenticate Nodemailer dispatches. Do not
                use your standard Google password.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-[6px] bg-[#17140F] text-[#F4F2ED] text-[14px] font-medium hover:bg-[#2B2621] transition-all active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
          >
            {saving ? "Saving Changes..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
