
import { useState } from "react";
import {
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

import {
  getLoggedInUser,
  logoutUser,
} from "./api/jobApi";

import FindJobs from "./pages/FindJobs";
import JobDetails from "./pages/JobDetails";
import Apply from "./pages/Apply";
import Result from "./pages/Result";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import AdminJobs from "./pages/AdminJobs";
import AdminApplications from "./pages/AdminApplications";
import ApplicationDetails from "./pages/ApplicationDetails";

import "./App.css";

function StaffLayout({ staff, onLogout }) {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">J</span>
          <span>JobAdvisor Staff</span>
        </div>

        <p className="sidebar-label">STAFF MENU</p>

        <nav className="sidebar-nav">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/admin/jobs"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            Manage Jobs
          </NavLink>

          <NavLink
            to="/admin/applications"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            Applications
          </NavLink>
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <strong>{staff?.name || "Staff"}</strong>
            <span>{staff?.email}</span>
          </div>

          <button
            className="logout-button"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

function StaffOnly({ staff, children }) {
  if (!staff) {
    return <Navigate to="/staff-login" replace />;
  }

  if (staff.role !== "ADMIN") {
    return <Navigate to="/jobs" replace />;
  }

  return children;
}

export default function App() {
  const [staff, setStaff] = useState(() => {
    const token = localStorage.getItem("jobadvisor_token");

    return token ? getLoggedInUser() : null;
  });

  const navigate = useNavigate();

  function handleLogout() {
    logoutUser();
    setStaff(null);

    navigate("/jobs", { replace: true });
  }

  function handleLogin(user) {
    if (user?.role !== "ADMIN") {
      logoutUser();
      throw new Error(
        "This login is for staff accounts only."
      );
    }

    setStaff(user);
  }

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/jobs" replace />}
      />

      {/* Public job pages */}
      <Route
        path="/jobs"
        element={<FindJobs />}
      />

      <Route
        path="/jobs/:jobId"
        element={<JobDetails />}
      />

      <Route
        path="/apply/:jobId"
        element={<Apply />}
      />

      <Route
        path="/result"
        element={<Result />}
      />

      {/* Staff login */}
      <Route
        path="/staff-login"
        element={
          staff?.role === "ADMIN" ? (
            <Navigate to="/admin" replace />
          ) : (
            <Login onLogin={handleLogin} />
          )
        }
      />

      <Route
        path="/login"
        element={<Navigate to="/staff-login" replace />}
      />

      {/* Protected admin pages */}
      <Route
        path="/admin"
        element={
          <StaffOnly staff={staff}>
            <StaffLayout
              staff={staff}
              onLogout={handleLogout}
            />
          </StaffOnly>
        }
      >
        <Route
          index
          element={<AdminDashboard />}
        />

        <Route
          path="jobs"
          element={<AdminJobs />}
        />

        <Route
          path="applications"
          element={<AdminApplications />}
        />

        <Route
          path="applications/:id"
          element={<ApplicationDetails />}
        />
      </Route>

      {/* Fallback */}
      <Route
        path="*"
        element={<Navigate to="/jobs" replace />}
      />
    </Routes>
  );
}
