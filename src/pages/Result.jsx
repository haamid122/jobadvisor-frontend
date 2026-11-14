import { useLocation, useNavigate } from "react-router-dom";

function toSkillList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

export default function Result() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const result = state?.result;

  if (!result) {
    return (
      <main className="public-page">
        <section className="public-result-card">
          <h1>Application result unavailable</h1>
          <p>The result is not available in this page session. Please submit your application again to view the result.</p>
          <button className="auth-submit-button" onClick={() => navigate("/jobs")}>Browse jobs</button>
        </section>
      </main>
    );
  }

  const job = result.job || {};
  const matched = toSkillList(result.matchedSkills);
  const missing = toSkillList(result.missingSkills);
  const score = Number(result.matchScore ?? 0);

  return (
    <main className="public-page">
      <section className="public-result-card">
        <div className="result-success-icon">✓</div>
        <p className="eyebrow">APPLICATION SUBMITTED</p>
        <h1>Thank you, {result.applicantName || "applicant"}!</h1>
        <p className="public-muted">Your application has been submitted successfully.</p>
        <div className="result-job-summary">
          <h2>{job.jobTitle || `Job #${result.jobId}`}</h2>
          <p>{job.track || ""} {job.location ? `· ${job.location}` : ""}</p>
          <span>Application ID: {result.id}</span>
        </div>
        <div className="result-score">
          <span>Resume match score</span>
          <strong>{score}%</strong>
          <div className="result-score-track"><div style={{ width: `${Math.max(0, Math.min(100, score))}%` }} /></div>
        </div>
        <div className="result-skill-columns">
          <section>
            <h3>Matched skills ({matched.length})</h3>
            {matched.length ? <div className="skill-list">{matched.map((skill) => <span className="skill-tag" key={skill}>✓ {skill}</span>)}</div> : <p className="public-muted">No required skills matched.</p>}
          </section>
          <section>
            <h3>Skills to pick up ({missing.length})</h3>
            {missing.length ? <div className="skill-list">{missing.map((skill) => <span className="skill-tag" key={skill}>{skill}</span>)}</div> : <p className="public-muted">All listed required skills matched.</p>}
          </section>
        </div>
        <p className="public-muted result-status">Application status: {result.status || "SUBMITTED"}</p>
        <button className="auth-submit-button" onClick={() => navigate("/jobs")}>Browse more jobs</button>
      </section>
    </main>
  );
}
