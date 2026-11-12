
import { Link } from "react-router-dom";

export default function Dashboard({
  jobs,
  applications,
  onRefresh,
}) {
  return (
    <>
      <div className="topbar">
        <div>
          <p className="eyebrow">JOB SEARCH</p>
          <h1>Dashboard</h1>
        </div>

        <button className="refresh-button" onClick={onRefresh}>
          Refresh
        </button>
      </div>

      <section className="welcome-section">
        <div>
          <h2>Find your next role</h2>
          <p>
            Explore jobs, check your skill match, and track your
            applications.
          </p>
        </div>

        <div className="welcome-symbol">✦</div>
      </section>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Available Jobs</span>
          <strong>{jobs.length}</strong>
        </div>

        <div className="stat-card">
          <span className="stat-label">Applications Tracked</span>
          <strong>{applications.length}</strong>
        </div>
      </div>

      <section className="dashboard-links">
        <h2>Quick Access</h2>

        <Link to="/jobs" className="dashboard-link">
          <span>⌕</span>
          <div>
            <h3>Find Jobs</h3>
            <p>Search and explore available opportunities.</p>
          </div>
          <span>→</span>
        </Link>

        <Link to="/applications" className="dashboard-link">
          <span>▤</span>
          <div>
            <h3>My Applications</h3>
            <p>View jobs you have marked as applied.</p>
          </div>
          <span>→</span>
        </Link>

        <Link to="/skill-gap" className="dashboard-link">
          <span>◇</span>
          <div>
            <h3>Skill Gap Analysis</h3>
            <p>See skills required by available jobs.</p>
          </div>
          <span>→</span>
        </Link>
      </section>
    </>
  );
}
