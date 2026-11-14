import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllAdminJobs, getAllApplications } from "../api/jobApi";

function formatDate(value) {
  if (!value) return "Date not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ applicants: 0, jobs: 0, applications: 0 });
  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      // Applicant information now lives on each application.
      // There is no longer a need to call the removed /api/users endpoint.
      const [jobsData, applicationsData] = await Promise.all([
        getAllAdminJobs(),
        getAllApplications(),
      ]);

      const applications = Array.isArray(applicationsData) ? applicationsData : [];
      const jobs = Array.isArray(jobsData?.content)
        ? jobsData.content
        : Array.isArray(jobsData)
          ? jobsData
          : [];

      const uniqueApplicants = new Set(
        applications
          .map((application) => String(application.applicantEmail || "").trim().toLowerCase())
          .filter(Boolean)
      );

      setStats({
        applicants: uniqueApplicants.size,
        jobs: Number(jobsData?.totalElements ?? jobs.length),
        applications: applications.length,
      });

      const sorted = [...applications].sort((a, b) => {
        const dateA = a.appliedDate ? new Date(a.appliedDate).getTime() : 0;
        const dateB = b.appliedDate ? new Date(b.appliedDate).getTime() : 0;
        return dateB - dateA || Number(b.id || 0) - Number(a.id || 0);
      });

      setRecentApplications(sorted.slice(0, 5));
    } catch (err) {
      console.error("Admin dashboard error:", err);
      setError(
        err.response?.status === 403
          ? "Access denied. Please sign in with an administrator account."
          : err.response?.data?.message || "Unable to load dashboard statistics."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="topbar">
  <div>
    <p className="eyebrow">ADMINISTRATION</p>
    <h1>Admin Dashboard</h1>
  </div>

  <div className="dashboard-header-actions">
    <Link to="/jobs" className="back-to-jobs-button">
      ← Back to Jobs
    </Link>

    <button
      className="refresh-button"
      onClick={loadDashboard}
      disabled={loading}
    >
      {loading ? "Loading..." : "Refresh"}
    </button>
  </div>
</div>

      <section className="welcome-section">
        <div>
          <h2>Welcome to JobAdvisor Admin</h2>
          <p>Monitor applicants, job listings and application activity.</p>
        </div>
        <div className="welcome-symbol">✦</div>
      </section>

      {error && <div className="auth-error" role="alert">{error}</div>}

      <div className="admin-stats-grid">
        <div className="admin-stat-card"><span>Total Applicants</span><strong>{loading ? "..." : stats.applicants}</strong></div>
        <div className="admin-stat-card"><span>Total Jobs</span><strong>{loading ? "..." : stats.jobs}</strong></div>
        <div className="admin-stat-card"><span>Total Applications</span><strong>{loading ? "..." : stats.applications}</strong></div>
      </div>

      <section className="dashboard-links">
        <h2>Management</h2>
        <Link to="/admin/jobs" className="dashboard-link">
          <span>▤</span><div><h3>Manage Jobs</h3><p>Add, edit and delete job listings.</p></div><span>→</span>
        </Link>
        <Link to="/admin/applications" className="dashboard-link">
          <span>▦</span><div><h3>Manage Applications</h3><p>Review applicants, resumes and skill-match results.</p></div><span>→</span>
        </Link>
      </section>

      <section className="admin-section">
        <h2>Recent Application Activity</h2>
        <p className="admin-section-subtitle">The five most recent applications, ordered by applied date.</p>
        {loading ? <div className="admin-empty">Loading recent activity...</div> :
          recentApplications.length === 0 ? <div className="admin-empty">No application activity yet.</div> :
          <div className="admin-recent-list">
            {recentApplications.map((application) => {
              const job = application.job;
              return (
                <div className="admin-recent-item" key={application.id}>
                  <div>
                    <strong>
                      {application.applicantName || "Applicant"} applied for {job?.jobTitle || `Job #${application.jobId ?? "-"}`}
                    </strong>
                    <span>
                      {application.applicantEmail || "Email unavailable"} · {job?.track || "Track unavailable"}
                    </span>
                  </div>
                  <div>
                    <span>{formatDate(application.appliedDate)} · {application.matchScore ?? 0}% match · {application.status || "UNKNOWN"}</span>
                  </div>
                </div>
              );
            })}
          </div>}
      </section>
    </>
  );
}
