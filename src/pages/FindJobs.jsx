
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchJobs } from "../api/jobApi";
import archintxLogo from "../assets/archintx-logo.png";

function getTitle(job) {
  return job?.jobTitle || job?.title || "Job Title";
}

function getTrack(job) {
  return job?.track || "Track not specified";
}

function getLocation(job) {
  return job?.location || "Location not specified";
}

function getJobId(job) {
  return job?.id ?? job?.jobId;
}

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

export function JobCard({ recommendation, applications = [] }) {
  const navigate = useNavigate();

  const job = recommendation?.job || recommendation;
  const jobId = getJobId(job);
  const skills = getSkills(job);

  const isApplied = applications.some(
    (application) =>
      String(application.jobId) === String(jobId)
  );

  const match = recommendation?.matchPercentage;

  function handleApply() {
    if (jobId === undefined || jobId === null) return;

    navigate(`/apply/${jobId}`, {
      state: { job },
    });
  }

  function handleViewDetails() {
    if (jobId === undefined || jobId === null) return;

    navigate(`/jobs/${jobId}`, {
      state: { job },
    });
  }

  return (
    <article className="public-job-card">
      <div className="public-job-card-heading">
        <div className="public-job-identity">
          <div className="public-track-avatar" aria-hidden="true">
            {getTrack(job).charAt(0).toUpperCase()}
          </div>

          <div className="public-job-title-group">
            <h2>{getTitle(job)}</h2>
            <p>{getTrack(job)}</p>
          </div>
        </div>

        {isApplied ? (
          <span className="public-job-badge applied">
            Applied
          </span>
        ) : match !== undefined ? (
          <span className="public-job-badge">
            {match}% match
          </span>
        ) : job?.experienceLevel ? (
          <span className="public-job-badge">
            {job.experienceLevel}
          </span>
        ) : null}
      </div>

      <div className="public-job-meta">
        <span>
          <span aria-hidden="true">⌖</span>
          {getLocation(job)}
        </span>

        {job?.experienceLevel && (
          <span>
            <span aria-hidden="true">▣</span>
            {job.experienceLevel}
          </span>
        )}
      </div>

      <div className="public-required-skills">
        <h3>Required skills</h3>

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
            <span className="public-no-skills">
              Not specified
            </span>
          )}
        </div>
      </div>

      <div className="public-job-card-footer">
        <span className="public-job-track">
          {job?.experienceLevel || "Open position"}
        </span>

        <div className="public-job-actions">
          <button
            type="button"
            className="public-view-button"
            onClick={handleViewDetails}
          >
            View Details
          </button>

          <button
            type="button"
            className="public-apply-button"
            onClick={handleApply}
            disabled={isApplied}
          >
            {isApplied ? "Applied ✓" : "Apply now"}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </article>
  );
}

const EMPTY_FILTERS = {
  search: "",
  location: "",
  experienceLevel: "",
  skill: "",
  sort: "id,desc",
};

export default function FindJobs({
  recommendations = [],
  applications = [],
  onRefresh,
}) {
  const navigate = useNavigate();

  const [formFilters, setFormFilters] = useState(EMPTY_FILTERS);
  const [activeFilters, setActiveFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(0);

  const [pageData, setPageData] = useState({
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size: 6,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    async function loadJobs() {
      setLoading(true);
      setError("");

      try {
        const data = await searchJobs({
          ...activeFilters,
          page,
          size: 6,
        });

        if (isCurrent) {
          setPageData({
            content: Array.isArray(data?.content)
              ? data.content
              : [],
            totalElements: Number(data?.totalElements || 0),
            totalPages: Number(data?.totalPages || 0),
            number: Number(data?.number || 0),
            size: Number(data?.size || 6),
          });
        }
      } catch (requestError) {
        console.error("Unable to search jobs:", requestError);

        if (isCurrent) {
          setError(
            requestError?.response?.data?.message ||
              "Unable to load jobs. Please check your connection and try again."
          );
        }
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    loadJobs();

    return () => {
      isCurrent = false;
    };
  }, [activeFilters, page, refreshKey]);

  const recommendationByJobId = useMemo(() => {
    const map = new Map();

    recommendations.forEach((recommendation) => {
      const job = recommendation?.job || recommendation;
      const id = getJobId(job);

      if (id !== undefined && id !== null) {
        map.set(String(id), recommendation);
      }
    });

    return map;
  }, [recommendations]);

  const displayedJobs = useMemo(
    () =>
      pageData.content.map((job) => {
        const recommendation = recommendationByJobId.get(
          String(getJobId(job))
        );

        return recommendation
          ? { ...recommendation, job }
          : { job };
      }),
    [pageData.content, recommendationByJobId]
  );

  function updateFilter(event) {
    const { name, value } = event.target;

    setFormFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSearch(event) {
    event.preventDefault();

    setPage(0);
    setActiveFilters({ ...formFilters });
  }

  function handleReset() {
    setFormFilters(EMPTY_FILTERS);
    setActiveFilters(EMPTY_FILTERS);
    setPage(0);
  }

  function handleSortChange(event) {
    const sort = event.target.value;

    setFormFilters((current) => ({
      ...current,
      sort,
    }));

    setPage(0);

    setActiveFilters((current) => ({
      ...current,
      sort,
    }));
  }

  async function handleRefresh() {
    if (typeof onRefresh === "function") {
      await onRefresh();
    }

    setRefreshKey((current) => current + 1);
  }

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

          <nav
            className="public-header-nav"
            aria-label="Main navigation"
          >
            <a className="public-header-link active" href="/jobs">
              Jobs
            </a>

            <button
              type="button"
              className="public-header-link"
              onClick={() => navigate("/staff-login")}
            >
              Staff Login
            </button>
          </nav>
        </div>
      </header>

      <main className="public-jobs-page">
        <section className="public-jobs-intro">
          <div>
            <p className="public-jobs-eyebrow">
              YOUR NEXT OPPORTUNITY STARTS HERE
            </p>

            <h1>
              Explore open <span>positions</span>
            </h1>

            <p className="public-jobs-description">
              Find roles that fit your skills. Apply with your
              resume and discover the skills you already have
              and the ones to build.
            </p>
          </div>

          <div
            className="public-jobs-intro-mark"
            aria-hidden="true"
          >
            <span>✦</span>
            <small>Find your fit</small>
          </div>
        </section>

        <section className="public-jobs-content">
          <div className="public-jobs-toolbar">
            <div>
              <h2>Available opportunities</h2>
              <p>
                {pageData.totalElements} positions currently listed
              </p>
            </div>

            <button
              className="public-refresh-button"
              onClick={handleRefresh}
              disabled={loading}
              type="button"
            >
              {loading ? "Loading…" : "↻ Refresh"}
            </button>
          </div>

          <form
            className="public-job-filter"
            onSubmit={handleSearch}
          >
            <label className="public-search-field">
              <span aria-hidden="true">⌕</span>

              <input
                name="search"
                value={formFilters.search}
                onChange={updateFilter}
                placeholder="Search by job title or track"
              />
            </label>

            <label>
              <span className="sr-only">Location</span>
              <input
                name="location"
                value={formFilters.location}
                onChange={updateFilter}
                placeholder="Location"
              />
            </label>

            <label>
              <span className="sr-only">Experience level</span>
              <input
                name="experienceLevel"
                value={formFilters.experienceLevel}
                onChange={updateFilter}
                placeholder="Experience"
              />
            </label>

            <label>
              <span className="sr-only">Required skill</span>
              <input
                name="skill"
                value={formFilters.skill}
                onChange={updateFilter}
                placeholder="Skill"
              />
            </label>

            <label className="public-sort-field">
              <span className="sr-only">Sort jobs</span>

              <select
                value={formFilters.sort}
                onChange={handleSortChange}
              >
                <option value="id,desc">Newest first</option>
                <option value="id,asc">Oldest first</option>
              </select>
            </label>

            <button
              className="public-search-button"
              type="submit"
            >
              Search jobs
            </button>

            <button
              className="public-clear-button"
              type="button"
              onClick={handleReset}
            >
              Clear
            </button>
          </form>

          {error && (
            <div
              className="message error-message"
              role="alert"
            >
              {error}

              <button
                type="button"
                className="inline-retry-button"
                onClick={handleRefresh}
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="empty-state">
              <p>Loading available positions…</p>
            </div>
          ) : displayedJobs.length > 0 ? (
            <>
              <div className="public-jobs-grid">
                {displayedJobs.map((recommendation) => (
                  <JobCard
                    key={getJobId(recommendation.job)}
                    recommendation={recommendation}
                    applications={applications}
                  />
                ))}
              </div>

              <div className="pagination-bar public-jobs-pagination">
                <span>
                  Page{" "}
                  {pageData.totalPages === 0 ? 0 : page + 1}
                  {" "}of {pageData.totalPages}
                </span>

                <div className="pagination-actions">
                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) =>
                        Math.max(0, current - 1)
                      )
                    }
                    disabled={page <= 0 || loading}
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) => current + 1)
                    }
                    disabled={
                      page + 1 >= pageData.totalPages || loading
                    }
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h3>No jobs found</h3>
              <p>
                Try another keyword or clear your filters.
              </p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
