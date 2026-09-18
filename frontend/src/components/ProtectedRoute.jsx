import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  // Check for stored authentication token
  const token = localStorage.getItem("token");

  if (!token) {
    // Redirect unauthenticated users to /login and preserve state
    return <Navigate to="/login" replace />;
  }

  // Render child components or nested routes
  return children ? children : <Outlet />;
}
