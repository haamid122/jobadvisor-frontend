
import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import { getJobById } from "../api/jobApi";

import archintxLogo from "../assets/archintx-logo.png";

function getSkills(job) {
  const skills = job?.requiredSkills || job?.skills || [];

  if (Array.isArray(skills)) {
    return skills
      .map((skill) =>
        typeof skill === "string" ? skill : skill?.name
      )
      .filter(Boolean);
  }

  if (typeof skills === "string") {
    return skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
  }

  return [];
}

export default function JobDetails() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadJob() {
      setLoading(true);
      setError("");

      try {
        const data = await getJobById(jobId);

        if (active) {
          setJob(data);
        }
      } catch (requestError) {
        console.error("Unable to load job details:", requestError);

        if (active) {
          setError(
            "Unable to load job details. Please try again."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadJob();

    return () => {
      active = false;
    };
  }, [jobId]);

  if (loading) {
    return (
      <main className="public-jobs-page">
        <p>Loading job details...</p>
      </main>
    );
  }

  if (error || !job) {
    return (
      <main className="public-jobs-page">
        <div className="empty-state">
          <h2>Job details unavailable</h2>
          <p>{error || "Job not found."}</p>

          <button onClick={() => navigate("/jobs")}>
            Back to Jobs
          </button>
        </div>
      </main>
    );
  }

  const skills = getSkills(job);

  return (
    <>
      <header className="public-site-header">
        <div className="public-site-header-inner">
          <a
            className="public-brand"
            href="/jobs"
            aria-label="ArchintX Jobs home"
          >
            <img
              className="public-brand-logo"
              src={archintxLogo}
              alt="ArchintX logo"
            />

            <span>
              Archint<span>X</span>
            </span>
          </a>

          <nav className="public-header-nav">
            <button
              type="button"
              className="public-header-link"
              onClick={() => navigate("/jobs")}
            >
              ← Back to Jobs
            </button>
          </nav>
        </div>
      </header>

      <main className="public-jobs-page">
        <section className="job-details-card">
          <p className="public-jobs-eyebrow">
            JOB OPPORTUNITY
          </p>

          <h1>
            {job.jobTitle || job.title || "Job Title"}
          </h1>

          <div className="job-details-meta">
            <span>{job.track || "Track not specified"}</span>
            <span>{job.location || "Location not specified"}</span>
            <span>{job.experienceLevel || "Not specified"}</span>
          </div>

          <section>
            <h2>Job Description</h2>
            <p>
              {job.jobDescription || "No description available."}
            </p>
          </section>

          <section>
            <h2>Required Skills</h2>

            <div className="public-skill-tags">
              {skills.length ? (
                skills.map((skill, index) => (
                  <span
                    className="public-skill-tag"
                    key={`${skill}-${index}`}
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p>Skills not specified.</p>
              )}
            </div>
          </section>

          <button
            type="button"
            className="public-apply-button"
            onClick={() =>
              navigate(`/apply/${jobId}`, {
                state: { job },
              })
            }
          >
            Apply Now →
          </button>
        </section>
      </main>
    </>
  );
}
