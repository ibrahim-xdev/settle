import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const hasRequested = useRef(false); // Prevents double-fetching in React Strict Mode

  useEffect(() => {
    // Stop duplicate calls in development
    if (hasRequested.current) return;

    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }

    hasRequested.current = true;

    api
      .get(`/api/auth/verify-email?token=${token}`)
      .then((res) => {
        setStatus("success");
        setMessage(res.data.message || "Email verified successfully!");
        setTimeout(() => navigate("/login"), 3000);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(
          err.response?.data?.error ||
            "Failed to connect to verification server.",
        );
      });
  }, [searchParams, navigate]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#F4F2ED] dark:bg-[#121212] font-body transition-colors duration-200">
      <div className="bg-white dark:bg-[#1E1E1E] p-8 rounded-lg border border-[#DEDACD] dark:border-[#2C2C2C] text-center max-w-md w-full shadow-sm transition-colors duration-200">
        <h2 className="font-display text-2xl mb-4 font-semibold text-[#17140F] dark:text-[#E5E5E5]">
          Email Verification
        </h2>

        {status === "verifying" && (
          <p className="text-[#6E6A5E] dark:text-[#A0A0A0]">
            Verifying your email address...
          </p>
        )}

        {status === "success" && (
          <div className="space-y-2">
            <p className="text-emerald-600 dark:text-emerald-400 font-medium">
              {message}
            </p>
            <p className="text-xs text-[#6E6A5E] dark:text-[#A0A0A0]">
              Redirecting to login in 3 seconds...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <p className="text-red-600 dark:text-red-400 font-medium">
              {message}
            </p>
            <button
              onClick={() => navigate("/login")}
              className="mt-2 px-4 py-2 bg-[#17140F] dark:bg-[#E5E5E5] text-white dark:text-[#17140F] rounded-[6px] text-sm font-medium hover:bg-[#2B2621] dark:hover:bg-white transition-all active:scale-[0.97]"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
