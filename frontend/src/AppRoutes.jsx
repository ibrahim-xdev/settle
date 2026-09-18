import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import LandingPage from "./pages/landingPage";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./pages/DashboardLayout";
import DashboardOverview from "./pages/DashboardOverview";
import SettingsPage from "./pages/SettingsPage";
import PageTransition from "./components/PageTransition";

// Add new pages here as you build them — one <Route> per page.
// Example when you add a dashboard later:
// import Dashboard from './components/Dashboard';
// <Route path="/dashboard" element={<Dashboard />} />
//
// Wrap each page's element in <PageTransition> to keep the same fade/slide
// transition on every route — nothing else about the route needs to change.

export default function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/signup" element={<PageTransition><SignupPage /></PageTransition>} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<PageTransition><DashboardOverview /></PageTransition>} />
            <Route path="/dashboard/settings" element={<PageTransition><SettingsPage /></PageTransition>} />
          </Route>
        </Route>

        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}
