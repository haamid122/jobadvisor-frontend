
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAllApplications } from "../api/jobApi";

function getDisplayStatus(status) {
  const value = String(status || "SUBMITTED").toUpperCase();

  return value === "APPLIED" ? "SUBMITTED" : value;
}

function getStatusClass(status) {
  return getDisplayStatus(status).toLowerCase();
}

function formatStatus(status) {
  const value = getDisplayStatus(status);

  return value.charAt(0) + value.slice(1).toLowerCase();
}

function parseSkills(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  return String(value)
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}

export default function ApplicationDetails() {
  const { id } = useParams();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDetails = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);

      setError("");

      const data = await getAllApplications();
      const applications = Array.isArray(data) ? data : [];

      const selected = applications.find(
        (item) => String(item.id) === String(id)
      );

      if (!selected) {
        setApplication(null);
        setError("Application not found.");
        return;
      }

      setApplication(selected);
    } catch (err) {
      console.error("Application details error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load application details."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetails();

    // Refresh when the user returns to this browser tab.
    function handleFocus() {
      loadDetails(false);
    }

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadDetails]);

  if (loading) {
    return (
      <div className="loading-screen">
        Loading applicant details...
      </div>
    );
  }

  if (error) {
    return (
      <section className="application-details-page">
        <Link to="/admin/applications" className="details-back-button">
          ← Back to Applications
        </Link>

        <div className="auth-error">{error}</div>

        <button
          className="refresh-button"
          onClick={() => loadDetails()}
        >
          Try Again
        </button>
      </section>
    );
  }

  if (!application) return null;

  const job = application.job;
  const score = Number(application.matchScore ?? 0);
  const status = getDisplayStatus(application.status);

  const matchedSkills = parseSkills(application.matchedSkills);
  const missingSkills = parseSkills(application.missingSkills);

  return (
    <section className="application-details-page">
      <div className="details-header">
        <div>
          <p className="eyebrow">ADMINISTRATION</p>
          <h1>Application Details</h1>
          <p>Application #{application.id}</p>
        </div>

        <div className="details-header-actions">
          <button
            className="refresh-button"
            onClick={() => loadDetails(false)}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "Refresh Details"}
          </button>

          <Link
            to="/admin/applications"
            className="details-back-button"
          >
            ← Back to Applications
          </Link>
        </div>
      </div>

      <div className="details-card">
        <h2>Applicant Information</h2>

        <div className="details-info-grid">
          <div>
            <span>Full Name</span>
            <strong>{application.applicantName || "Not provided"}</strong>
          </div>

          <div>
            <span>Email Address</span>
            <strong>{application.applicantEmail || "Not provided"}</strong>
          </div>

          <div>
            <span>Application Date</span>
            <strong>{application.appliedDate || "Not available"}</strong>
          </div>

          <div>
            <span>Application Status</span>
            <strong>
              <span className={`details-status-badge ${getStatusClass(status)}`}>
                {formatStatus(status)}
              </span>
            </strong>
          </div>
        </div>
      </div>

      <div className="details-card">
        <h2>Job Information</h2>

        <div className="details-info-grid">
          <div>
            <span>Job Title</span>
            <strong>{job?.jobTitle || "Not available"}</strong>
          </div>

          <div>
            <span>Track</span>
            <strong>{job?.track || "Not available"}</strong>
          </div>

          <div>
            <span>Location</span>
            <strong>{job?.location || "Not available"}</strong>
          </div>

          <div>
            <span>Experience Level</span>
            <strong>{job?.experienceLevel || "Not available"}</strong>
          </div>
        </div>
      </div>

      <div className="details-card">
        <div className="match-heading">
          <h2>Skill Match Analysis</h2>
          <div className="match-score">{score}%</div>
        </div>

        <div className="match-progress">
          <div
            className="match-progress-fill"
            style={{
              width: `${Math.max(0, Math.min(score, 100))}%`,
            }}
          />
        </div>

        <div className="skills-details-grid">
          <div className="skill-group">
            <h3>Matched Skills ({matchedSkills.length})</h3>

            <div className="skill-tags">
              {matchedSkills.length ? (
                matchedSkills.map((skill, index) => (
                  <span className="matched-skill-tag" key={index}>
                    {skill}
                  </span>
                ))
              ) : (
                <p>No matched skills.</p>
              )}
            </div>
          </div>

          <div className="skill-group">
            <h3>Missing Skills ({missingSkills.length})</h3>

            <div className="skill-tags">
              {missingSkills.length ? (
                missingSkills.map((skill, index) => (
                  <span className="missing-skill-tag" key={index}>
                    {skill}
                  </span>
                ))
              ) : (
                <p>No missing skills.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="details-card">
        <h2>Applicant Resume</h2>

        <div className="resume-content">
          {application.resumeText || "Resume text was not provided."}
        </div>
      </div>

      <div className="details-footer">
        <Link to="/admin/applications" className="details-back-button">
          ← Back to Applications
        </Link>
      </div>
    </section>
  );
}
