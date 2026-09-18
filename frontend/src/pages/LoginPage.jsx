import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

export default function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Authenticate with Express backend
      const res = await axios.post(
        "http://localhost:5001/api/auth/login",
        form,
      );

      // 2. Persist JWT session token
      localStorage.setItem("token", res.data.token);

      if (onLoginSuccess) {
        onLoginSuccess(res.data.user);
      }

      // 3. Redirect user to protected invoice dashboard
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Invalid email or password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F2ED] text-[#17140F] antialiased flex flex-col justify-between font-body">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap');

        .font-display { font-family: 'Fraunces', serif; }
        .font-body { font-family: 'Inter', sans-serif; }

        @keyframes settle-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .settle-form { animation: settle-in 0.5s ease-out both; }
      `}</style>

      {/* Header */}
      <header className="max-w-6xl w-full mx-auto px-6 md:px-10 pt-7 flex items-center justify-between">
        <Link
          to="/"
          className="font-display text-[20px] tracking-tight hover:opacity-80 transition-opacity"
        >
          Settle
        </Link>
        <Link
          to="/signup"
          className="text-[14px] font-medium text-[#6E6A5E] hover:text-[#17140F] transition-colors"
        >
          Need an account? Sign up
        </Link>
      </header>

      {/* Login Card */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="settle-form w-full max-w-[400px] bg-white rounded-[12px] border border-[#DEDACD] shadow-[0_15px_35px_-15px_rgba(23,20,15,0.12)] p-8">
          <div className="text-center mb-8">
            <h1 className="font-display text-[28px] tracking-tight">
              Welcome back to Settle
            </h1>
            <p className="text-[14px] text-[#6E6A5E] mt-2 leading-[1.5]">
              Enter your details to manage and send your invoices.
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-3 rounded-[6px] bg-red-50 border border-red-200 text-red-700 text-[13px]">
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-[#17140F] mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="ibrahim@example.com"
                required
                className="w-full h-11 px-3.5 rounded-[6px] border border-[#DEDACD] bg-[#F4F2ED]/40 text-[14px] text-[#17140F] placeholder-[#9E9A8E] focus:outline-none focus:border-[#17140F] focus:bg-white transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[13px] font-medium text-[#17140F]">
                  Password
                </label>
                <a
                  href="#"
                  className="text-[12px] text-[#96742B] hover:underline font-medium"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full h-11 pl-3.5 pr-12 rounded-[6px] border border-[#DEDACD] bg-[#F4F2ED]/40 text-[14px] text-[#17140F] placeholder-[#9E9A8E] focus:outline-none focus:border-[#17140F] focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] font-medium text-[#6E6A5E] hover:text-[#17140F] transition-all active:scale-95"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 rounded-[6px] bg-[#17140F] text-[#F4F2ED] text-[14px] font-medium hover:bg-[#2B2621] transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          {/* Legal Disclosures */}
          <p className="mt-6 text-center text-[12px] leading-[1.5] text-[#6E6A5E]">
            By continuing, you agree to Settle's{" "}
            <a
              href="#"
              className="text-[#17140F] underline hover:text-[#96742B]"
            >
              Terms of Service
            </a>{" "}
            and acknowledge our{" "}
            <a
              href="#"
              className="text-[#17140F] underline hover:text-[#96742B]"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto px-6 md:px-10 py-6 text-center text-[13px] text-[#6E6A5E]">
        Built by Ibrahim — Settle © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
