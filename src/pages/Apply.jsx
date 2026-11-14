import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getJobById, submitApplication } from "../api/jobApi";

export default function Apply() {
  const { jobId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [job, setJob] = useState(location.state?.job || null);
  const [form, setForm] = useState({
    applicantName: "",
    applicantEmail: "",
    resumeText: "",
  });

  const [loadingJob, setLoadingJob] = useState(!location.state?.job);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (job) return;

    let active = true;

    getJobById(jobId)
      .then((data) => {
        if (active) setJob(data);
      })
      .catch((err) => {
        if (active) {
          setError(
            err.response?.data?.message || "Unable to load this job."
          );
        }
      })
      .finally(() => {
        if (active) setLoadingJob(false);
      });

    return () => {
      active = false;
    };
  }, [jobId, job]);

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.resumeText.trim()) {
      setError("Please paste your resume text.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await submitApplication({
        applicantName: form.applicantName.trim(),
        applicantEmail: form.applicantEmail.trim(),
        jobId: Number(jobId),
        resumeText: form.resumeText.trim(),
      });

      navigate("/result", { state: { result } });

    } catch (err) {
      console.error("Application submission failed:", err);

      if (err.response?.status === 409) {
        setError(
          "You have already applied for this job using this email address. You cannot apply for the same job again."
        );
      } else {
        setError(
          err.response?.data?.message ||
          err.response?.data?.detail ||
          "Unable to submit your application. Please try again."
        );
      }

    } finally {
      setSubmitting(false);
    }
  }

  if (loadingJob) {
    return <div className="loading-screen">Loading job...</div>;
  }

  if (!job) {
    return (
      <main className="public-page">
        <p>{error || "Job not found."}</p>
        <button onClick={() => navigate("/jobs")}>
          Back to jobs
        </button>
      </main>
    );
  }

  return (
    <main className="public-page">
      <button
        className="public-back-button"
        type="button"
        onClick={() => navigate("/jobs")}
      >
        ← Back to jobs
      </button>

      <section className="public-form-card">
        <p className="eyebrow">JOB APPLICATION</p>

        <h1>Apply for {job.jobTitle || "this job"}</h1>

        <p className="public-muted">
          {job.track || ""}
          {job.location ? ` · ${job.location}` : ""}
        </p>

        <form onSubmit={handleSubmit} className="public-apply-form">
          <label>
            Full name
            <input
              name="applicantName"
              value={form.applicantName}
              onChange={updateField}
              required
              maxLength={120}
            />
          </label>

          <label>
            Email address
            <input
              type="email"
              name="applicantEmail"
              value={form.applicantEmail}
              onChange={updateField}
              required
              maxLength={180}
            />
          </label>

          <label>
            Resume text
            <textarea
              name="resumeText"
              value={form.resumeText}
              onChange={updateField}
              rows={10}
              required
              placeholder="Paste your resume text here..."
            />
          </label>

          {error && (
            <p className="public-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="auth-submit-button"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </section>
    </main>
  );
}