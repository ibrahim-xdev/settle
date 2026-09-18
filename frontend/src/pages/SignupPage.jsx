import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

export default function SignupPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
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
      // 1. Send registration data to Express backend
      await axios.post("http://localhost:5001/api/auth/register", form);

      // 2. Automatically log the user in to receive their JWT token
      const loginRes = await axios.post(
        "http://localhost:5001/api/auth/login",
        {
          email: form.email,
          password: form.password,
        },
      );

      // 3. Store JWT token in localStorage
      localStorage.setItem("token", loginRes.data.token);

      // 4. Redirect to the protected dashboard
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.error || "Registration failed. Please try again.",
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
          to="/login"
          className="text-[14px] font-medium text-[#6E6A5E] hover:text-[#17140F] transition-colors"
        >
          Already have an account? Log in
        </Link>
      </header>

      {/* Signup Card */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="settle-form w-full max-w-[400px] bg-white rounded-[12px] border border-[#DEDACD] shadow-[0_15px_35px_-15px_rgba(23,20,15,0.12)] p-8">
          <div className="text-center mb-8">
            <h1 className="font-display text-[28px] tracking-tight">
              Start settling invoices
            </h1>
            <p className="text-[14px] text-[#6E6A5E] mt-2 leading-[1.5]">
              Create an account in seconds. No credit card required.
            </p>
          </div>

          {/* Social Auth Placeholder */}
          <button
            type="button"
            className="w-full h-11 flex items-center justify-center gap-3 rounded-[6px] border border-[#DEDACD] bg-white text-[14px] font-medium text-[#17140F] hover:bg-[#F4F2ED] transition-all active:scale-[0.98]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="my-6 flex items-center justify-center gap-3">
            <div className="h-[1px] flex-1 bg-[#EDEAE1]" />
            <span className="text-[12px] uppercase text-[#6E6A5E] tracking-wider font-medium">
              or
            </span>
            <div className="h-[1px] flex-1 bg-[#EDEAE1]" />
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
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ibrahim Malik"
                required
                className="w-full h-11 px-3.5 rounded-[6px] border border-[#DEDACD] bg-[#F4F2ED]/40 text-[14px] text-[#17140F] placeholder-[#9E9A8E] focus:outline-none focus:border-[#17140F] focus:bg-white transition-all"
              />
            </div>

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
              <label className="block text-[13px] font-medium text-[#17140F] mb-1.5">
                Password
              </label>
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
              {loading ? "Creating account..." : "Create free account"}
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
