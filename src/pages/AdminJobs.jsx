import { useEffect, useState } from "react";
import {
  getAllAdminJobs,
  createJob,
  updateJob,
  deleteJob,
} from "../api/jobApi";

const initialForm = {
  jobTitle: "",
  companyName: "",
  location: "",
  requiredSkills: "",
  jobDescription: "",
  experienceLevel: "",
  jobUrl: "",
};

export default function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => { loadJobs(page); }, [page]);

  async function loadJobs(requestedPage = page) {
    try {
      setLoading(true);
      setError("");
      const data = await getAllAdminJobs(requestedPage, 10);
      setJobs(Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : []);
      setTotalPages(Number(data?.totalPages ?? 1));
      setTotalJobs(Number(data?.totalElements ?? data?.content?.length ?? data?.length ?? 0));
    } catch (err) {
      console.error("Unable to load jobs:", err);
      setError(err.response?.data?.message || "Unable to load jobs. Check admin access and backend.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function handleEdit(job) {
    setEditingId(job.id);
    setFormData({
      jobTitle: job.jobTitle || "",
      companyName: job.companyName || "",
      location: job.location || "",
      requiredSkills: job.requiredSkills || "",
      jobDescription: job.jobDescription || "",
      experienceLevel: job.experienceLevel || "",
      jobUrl: job.jobUrl || "",
    });
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setFormData(initialForm);
    setEditingId(null);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const payload = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [key, value.trim()])
    );

    for (const field of ["jobTitle", "companyName", "location", "requiredSkills", "jobDescription", "experienceLevel"]) {
      if (!payload[field]) {
        setError(`${field.replace(/([A-Z])/g, " $1")} is required.`);
        return;
      }
    }

    if (payload.jobUrl) {
      try {
        const url = new URL(payload.jobUrl);
        if (!["http:", "https:"].includes(url.protocol)) throw new Error();
      } catch {
        setError("Enter a valid HTTP or HTTPS job URL.");
        return;
      }
    }

    try {
      setSaving(true);
      if (editingId !== null) {
        await updateJob(editingId, payload);
        setSuccess("Job updated successfully.");
      } else {
        await createJob(payload);
        setSuccess("Job created successfully.");
        setPage(0);
      }
      resetForm();
      await loadJobs(editingId !== null ? page : 0);
    } catch (err) {
      console.error("Job save error:", err);
      setError(err.response?.data?.message || err.response?.data?.detail || "Unable to save job. Check the required fields.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(jobId) {
    if (!window.confirm("Are you sure you want to permanently delete this job?")) return;
    setError("");
    setSuccess("");
    try {
      setDeletingId(jobId);
      await deleteJob(jobId);
      setSuccess("Job deleted successfully.");
      if (editingId === jobId) resetForm();
      const shouldMoveBack = jobs.length === 1 && page > 0;
      if (shouldMoveBack) setPage((current) => current - 1);
      else await loadJobs(page);
    } catch (err) {
      console.error("Job delete error:", err);
      setError(err.response?.data?.message || "Unable to delete job.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="topbar">
        <div><p className="eyebrow">ADMINISTRATION</p><h1>Manage Jobs</h1></div>
        <button className="refresh-button" onClick={() => loadJobs(page)} disabled={loading}>Refresh</button>
      </div>

      <section className="jobs-section">
        <div className="section-heading">
          <div><h2>{editingId !== null ? "Edit Job" : "Add New Job"}</h2><p>Create or update job opportunities.</p></div>
        </div>
        {error && <div className="auth-error" role="alert">{error}</div>}
        {success && <div className="auth-success" role="status">{success}</div>}

        <form className="admin-job-form" onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <div className="admin-field"><label htmlFor="jobTitle">Job Title *</label><input id="jobTitle" name="jobTitle" maxLength="255" value={formData.jobTitle} onChange={handleChange} required /></div>
            <div className="admin-field"><label htmlFor="companyName">Company Name *</label><input id="companyName" name="companyName" maxLength="255" value={formData.companyName} onChange={handleChange} required /></div>
            <div className="admin-field"><label htmlFor="location">Location *</label><input id="location" name="location" maxLength="255" value={formData.location} onChange={handleChange} required /></div>
            <div className="admin-field"><label htmlFor="experienceLevel">Experience Level *</label><input id="experienceLevel" name="experienceLevel" value={formData.experienceLevel} onChange={handleChange} required /></div>
            <div className="admin-field"><label htmlFor="requiredSkills">Required Skills * (comma-separated)</label><input id="requiredSkills" name="requiredSkills" maxLength="2000" value={formData.requiredSkills} onChange={handleChange} placeholder="Java, Spring Boot, MySQL" required /></div>
            <div className="admin-field"><label htmlFor="jobUrl">Job URL</label><input id="jobUrl" type="url" name="jobUrl" maxLength="2048" value={formData.jobUrl} onChange={handleChange} placeholder="https://company.com/careers" /></div>
          </div>
          <div><label htmlFor="jobDescription">Job Description *</label><textarea id="jobDescription" name="jobDescription" maxLength="5000" value={formData.jobDescription} onChange={handleChange} rows={5} required /></div>
          <p className="admin-form-hint">Fields marked * are required. Required skills should be separated by commas.</p>
          <div className="admin-form-actions">
            <button type="submit" className="auth-submit-button" disabled={saving}>{saving ? "Saving..." : editingId !== null ? "Update Job" : "Add Job"}</button>
            {editingId !== null && <button type="button" className="admin-secondary-button" onClick={resetForm} disabled={saving}>Cancel Edit</button>}
          </div>
        </form>
      </section>

      <section className="jobs-section">
        <div className="section-heading">
          <div><h2>Existing Jobs</h2><p>Manage published job listings.</p></div>
          <span className="results-count">{totalJobs} jobs</span>
        </div>
        {loading ? <div className="loading-screen">Loading jobs...</div> :
          jobs.length === 0 ? <div className="empty-state"><h3>No jobs available</h3><p>Add a job using the form above.</p></div> :
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead><tr><th>ID</th><th>Job Title</th><th>Company</th><th>Location</th><th>Experience</th><th>Actions</th></tr></thead>
              <tbody>{jobs.map((job) => (
                <tr key={job.id}>
                  <td>{job.id}</td><td>{job.jobTitle || "-"}</td><td>{job.companyName || "-"}</td><td>{job.location || "-"}</td><td>{job.experienceLevel || "-"}</td>
                  <td><div className="admin-table-actions">
                    <button type="button" onClick={() => handleEdit(job)}>Edit</button>
                    <button type="button" onClick={() => handleDelete(job.id)} disabled={deletingId === job.id}>{deletingId === job.id ? "Deleting..." : "Delete"}</button>
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>}
        {totalPages > 1 && <div className="admin-pagination">
          <button type="button" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0 || loading}>Previous</button>
          <span>Page {page + 1} of {totalPages}</span>
          <button type="button" onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))} disabled={page >= totalPages - 1 || loading}>Next</button>
        </div>}
      </section>
    </>
  );
}
