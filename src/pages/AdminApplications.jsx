
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAllApplications,
  updateApplicationStatus,
} from "../api/jobApi";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "SUBMITTED", label: "Submitted" },
  { value: "REVIEWING", label: "Reviewing" },
  { value: "SHORTLISTED", label: "Shortlisted" },
  { value: "REJECTED", label: "Rejected" },
];

function normalizedStatus(status) {
  const value = String(status || "SUBMITTED").toUpperCase();
  return value === "APPLIED" ? "SUBMITTED" : value;
}

function statusClass(status) {
  const value = normalizedStatus(status).toLowerCase();

  if (value === "submitted") return "applied";
  if (value === "rejected") return "rejected";
  if (value === "shortlisted") return "shortlisted";
  if (value === "reviewing") return "reviewing";

  return "";
}

function displaySkills(value) {
  if (!value) return "—";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function getJobTitle(application) {
  return application.job?.jobTitle ||
    `Job #${application.jobId ?? "—"}`;
}

function csvCell(value) {
  let text = String(value ?? "");

  // Reduce the risk of spreadsheet formula execution when opening the CSV.
  if (/^[\s]*[=+@\-]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

function exportApplicationsToCsv(applications) {
  const headers = [
    "Application ID",
    "Applicant Name",
    "Applicant Email",
    "Job Title",
    "Track",
    "Match Score",
    "Matched Skills",
    "Missing Skills",
    "Applied Date",
    "Status",
  ];

  const rows = applications.map((application) => [
    application.id,
    application.applicantName,
    application.applicantEmail,
    getJobTitle(application),
    application.job?.track,
    `${Number(application.matchScore ?? 0)}%`,
    displaySkills(application.matchedSkills),
    displaySkills(application.missingSkills),
    application.appliedDate
      ? String(application.appliedDate).slice(0, 10)
      : "",
    normalizedStatus(application.status),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");

  // UTF-8 BOM helps Excel display the CSV correctly.
  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `jobadvisor-applications-${date}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function AdminApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [jobFilter, setJobFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("LATEST");

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    try {
      setLoading(true);
      setError("");

      const data = await getAllApplications();
      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Unable to load applications:", err);

      setError(
        err.response?.status === 403
          ? "Access denied. Please sign in with an administrator account."
          : err.response?.data?.message || "Unable to load applications."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(applicationId, newStatus) {
    const previousApplication = applications.find(
      (item) => item.id === applicationId
    );

    if (
      !previousApplication ||
      normalizedStatus(previousApplication.status) === newStatus
    ) {
      return;
    }

    try {
      setUpdatingId(applicationId);
      setError("");

      const updated = await updateApplicationStatus(
        applicationId,
        newStatus
      );

      setApplications((previous) =>
        previous.map((application) =>
          application.id === applicationId
            ? { ...application, ...updated }
            : application
        )
      );
    } catch (err) {
      console.error("Unable to update application status:", err);

      setError(
        err.response?.data?.message ||
          "Unable to update application status."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const jobOptions = useMemo(() => {
    const titles = applications
      .map((application) => getJobTitle(application))
      .filter(Boolean);

    return [...new Set(titles)].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [applications]);

  const summary = useMemo(() => {
    const counts = {
      total: applications.length,
      submitted: 0,
      reviewing: 0,
      shortlisted: 0,
      rejected: 0,
    };

    applications.forEach((application) => {
      const status = normalizedStatus(application.status).toLowerCase();

      if (status === "submitted") counts.submitted++;
      if (status === "reviewing") counts.reviewing++;
      if (status === "shortlisted") counts.shortlisted++;
      if (status === "rejected") counts.rejected++;
    });

    return counts;
  }, [applications]);

  const filteredApplications = useMemo(() => {
    let result = [...applications];

    const search = searchTerm.trim().toLowerCase();

    if (search) {
      result = result.filter((application) => {
        const name = String(
          application.applicantName || ""
        ).toLowerCase();

        const email = String(
          application.applicantEmail || ""
        ).toLowerCase();

        return name.includes(search) || email.includes(search);
      });
    }

    if (statusFilter !== "ALL") {
      result = result.filter(
        (application) =>
          normalizedStatus(application.status) === statusFilter
      );
    }

    if (jobFilter !== "ALL") {
      result = result.filter(
        (application) => getJobTitle(application) === jobFilter
      );
    }

    result.sort((a, b) => {
      const scoreA = Number(a.matchScore ?? 0);
      const scoreB = Number(b.matchScore ?? 0);

      const dateA = a.appliedDate
        ? new Date(a.appliedDate).getTime()
        : 0;

      const dateB = b.appliedDate
        ? new Date(b.appliedDate).getTime()
        : 0;

      switch (sortOrder) {
        case "OLDEST":
          return dateA - dateB;
        case "HIGHEST":
          return scoreB - scoreA;
        case "LOWEST":
          return scoreA - scoreB;
        case "LATEST":
        default:
          return dateB - dateA;
      }
    });

    return result;
  }, [
    applications,
    searchTerm,
    statusFilter,
    jobFilter,
    sortOrder,
  ]);

  const totalPages = Math.ceil(
    filteredApplications.length / PAGE_SIZE
  );

  const safeCurrentPage = Math.min(
    currentPage,
    Math.max(totalPages, 1)
  );

  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;

  const paginatedApplications = filteredApplications.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  const firstResult =
    filteredApplications.length === 0 ? 0 : startIndex + 1;

  const lastResult = Math.min(
    startIndex + PAGE_SIZE,
    filteredApplications.length
  );

  function resetFilters() {
    setSearchTerm("");
    setStatusFilter("ALL");
    setJobFilter("ALL");
    setSortOrder("LATEST");
    setCurrentPage(1);
  }

  function changePage(page) {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <p className="eyebrow">ADMINISTRATION</p>
          <h1>Manage Applications</h1>
        </div>

        <div className="application-topbar-actions">
          <button
            type="button"
            className="export-csv-button"
            onClick={() => exportApplicationsToCsv(filteredApplications)}
            disabled={loading || filteredApplications.length === 0}
          >
            Export CSV ({filteredApplications.length})
          </button>

          <button
            type="button"
            className="refresh-button"
            onClick={loadApplications}
            disabled={loading || updatingId !== null}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="auth-error" role="alert">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <section className="admin-application-stats">
        <div className="application-stat-card total">
          <span>Total Applications</span>
          <strong>{summary.total}</strong>
        </div>

        <div className="application-stat-card submitted">
          <span>Submitted</span>
          <strong>{summary.submitted}</strong>
        </div>

        <div className="application-stat-card reviewing">
          <span>Reviewing</span>
          <strong>{summary.reviewing}</strong>
        </div>

        <div className="application-stat-card shortlisted">
          <span>Shortlisted</span>
          <strong>{summary.shortlisted}</strong>
        </div>

        <div className="application-stat-card rejected">
          <span>Rejected</span>
          <strong>{summary.rejected}</strong>
        </div>
      </section>

      <section className="jobs-section">
        <div className="section-heading">
          <div>
            <h2>All Applications</h2>
            <p>
              Review applicants, resumes, skill matches and update application status.
            </p>
          </div>

          <span className="results-count">
            {filteredApplications.length} of {applications.length} applications
          </span>
        </div>

        {/* Search, Filters and Sorting */}
        <div className="application-filter-panel">
          <div className="application-filter-grid">
            <label>
              Search Applicant
              <input
                type="search"
                placeholder="Search name or email..."
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
              />
            </label>

            <label>
              Filter by Status
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">All Statuses</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Filter by Job
              <select
                value={jobFilter}
                onChange={(event) => {
                  setJobFilter(event.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">All Jobs</option>
                {jobOptions.map((title) => (
                  <option key={title} value={title}>
                    {title}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Sort Applications
              <select
                value={sortOrder}
                onChange={(event) => {
                  setSortOrder(event.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="LATEST">Latest First</option>
                <option value="OLDEST">Oldest First</option>
                <option value="HIGHEST">Highest Match Score</option>
                <option value="LOWEST">Lowest Match Score</option>
              </select>
            </label>
          </div>

          <div className="application-filter-footer">
            <span>
              Showing {filteredApplications.length} applications
            </span>

            <button
              type="button"
              className="filter-reset-button"
              onClick={resetFilters}
            >
              Reset Filters
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-screen">
            Loading applications...
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="empty-state">
            <h3>No applications found</h3>
            <p>Try changing your search or filter settings.</p>

            <button
              type="button"
              className="filter-reset-button"
              onClick={resetFilters}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Application</th>
                    <th>Applicant</th>
                    <th>Job</th>
                    <th>Match</th>
                    <th>Matched Skills</th>
                    <th>Missing Skills</th>
                    <th>Applied Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedApplications.map((application) => {
                    const job = application.job;

                    return (
                      <tr key={application.id}>
                        <td>#{application.id}</td>

                        <td>
                          <strong>
                            {application.applicantName || "—"}
                          </strong>
                          <br />
                          <span>
                            {application.applicantEmail || "—"}
                          </span>
                        </td>

                        <td>
                          <strong>{getJobTitle(application)}</strong>
                          <br />
                          <span>{job?.track || "—"}</span>
                        </td>

                        <td>
                          <strong>
                            {Number(application.matchScore ?? 0)}%
                          </strong>
                        </td>

                        <td>{displaySkills(application.matchedSkills)}</td>
                        <td>{displaySkills(application.missingSkills)}</td>

                        <td>
                          {application.appliedDate
                            ? String(application.appliedDate).slice(0, 10)
                            : "—"}
                        </td>

                        <td>
                          <select
                            className={`admin-status-select ${statusClass(
                              application.status
                            )}`}
                            value={normalizedStatus(application.status)}
                            disabled={updatingId !== null}
                            onChange={(event) =>
                              handleStatusChange(
                                application.id,
                                event.target.value
                              )
                            }
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option
                                key={status.value}
                                value={status.value}
                              >
                                {status.label}
                              </option>
                            ))}
                          </select>

                          {updatingId === application.id && (
                            <small>Saving...</small>
                          )}
                        </td>

                        <td>
                          <Link
                            to={`/admin/applications/${application.id}`}
                            className="view-details-button"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="application-pagination">
              <div className="pagination-info">
                Showing <strong>{firstResult}–{lastResult}</strong> of{" "}
                <strong>{filteredApplications.length}</strong> applications
              </div>

              <div className="application-pagination-controls">
                <button
                  type="button"
                  onClick={() => changePage(safeCurrentPage - 1)}
                  disabled={safeCurrentPage === 1}
                >
                  ← Previous
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1
                ).map((page) => (
                  <button
                    type="button"
                    key={page}
                    className={
                      safeCurrentPage === page ? "active" : ""
                    }
                    onClick={() => changePage(page)}
                    aria-current={
                      safeCurrentPage === page ? "page" : undefined
                    }
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => changePage(safeCurrentPage + 1)}
                  disabled={safeCurrentPage === totalPages}
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </>
  );
}
