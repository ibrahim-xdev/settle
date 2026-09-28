import { useState, useEffect } from "react";
import { Link, useNavigate, Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import api from "../api/axios";

export default function DashboardLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState({ name: "Loading...", email: "..." });

  // Fetch user profile on layout load
  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        // Uses centralized Axios instance with automatic JWT interceptor
        const response = await api.get("/api/auth/me");
        setUser({ name: response.data.name, email: response.data.email });
      } catch (error) {
        console.error("Failed to load user profile from DB:", error);
        // Clean up invalid/expired token and redirect to login
        localStorage.removeItem("token");
        navigate("/login");
      }
    };

    fetchUserProfile();
  }, [navigate]);

  // Handler to manually update user state across child components
  const updateUserProfile = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: (
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
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      ),
    },
    {
      name: "Settings",
      path: "/dashboard/settings",
      icon: (
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
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F4F2ED] dark:bg-[#121212] text-[#17140F] dark:text-[#E5E5E5] antialiased flex font-body transition-colors duration-200">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-body { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-[#17140F]/30 dark:bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          />
        )}
      </AnimatePresence>

      {/* Left Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 h-screen w-64 shrink-0 bg-white dark:bg-[#1E1E1E] border-r border-[#DEDACD] dark:border-[#2C2C2C] flex flex-col justify-between transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div>
          {/* Brand Logo Header */}
          <div className="h-16 px-6 border-b border-[#EDEAE1] dark:border-[#2C2C2C] flex items-center justify-between">
            <Link
              to="/dashboard"
              className="font-display text-[22px] tracking-tight text-[#17140F] dark:text-[#E5E5E5]"
            >
              Settle
            </Link>

            <div className="flex items-center gap-2">
              {/* Theme Toggle Switch */}
              <button
                onClick={toggleTheme}
                title="Toggle Theme"
                className="p-1.5 rounded-[6px] text-[#6E6A5E] dark:text-[#A0A0A0] hover:text-[#17140F] dark:hover:text-white hover:bg-[#F4F2ED] dark:hover:bg-[#2A2A2A] transition-colors"
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

              <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden text-[#6E6A5E] dark:text-[#A0A0A0] hover:text-[#17140F] dark:hover:text-white transition-transform active:scale-90"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[6px] text-[14px] font-medium transition-all active:scale-[0.98] ${
                    isActive
                      ? "bg-[#F4F2ED] dark:bg-[#2A2A2A] text-[#17140F] dark:text-[#FFFFFF]"
                      : "text-[#6E6A5E] dark:text-[#A0A0A0] hover:bg-[#F4F2ED]/60 dark:hover:bg-[#2A2A2A]/50 hover:text-[#17140F] dark:hover:text-[#FFFFFF]"
                  }`}
                >
                  <span
                    className={
                      isActive
                        ? "text-[#17140F] dark:text-[#FFFFFF]"
                        : "text-[#6E6A5E] dark:text-[#A0A0A0]"
                    }
                  >
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Dynamic Database User Account Details */}
        <div className="p-4 border-t border-[#EDEAE1] dark:border-[#2C2C2C]">
          <div className="flex items-center justify-between px-2 py-1">
            <div className="overflow-hidden">
              <p className="text-[13px] font-medium text-[#17140F] dark:text-[#E5E5E5] truncate">
                {user.name}
              </p>
              <p
                className="text-[11px] text-[#6E6A5E] dark:text-[#A0A0A0] truncate max-w-[130px]"
                title={user.email}
              >
                {user.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="p-1.5 text-[#6E6A5E] dark:text-[#A0A0A0] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-[4px] transition-all active:scale-90"
            >
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
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        <main className="flex-1 p-2 overflow-y-auto">
          {children ? (
            children
          ) : (
            <Outlet
              context={{
                openSidebar: () => setSidebarOpen(true),
                updateUserProfile,
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
