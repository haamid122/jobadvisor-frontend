
export default function MyApplications({
  applications,
  jobs,
  onRefresh,
}) {
  function getJobForApplication(application) {
    return jobs.find(
      (job) =>
        String(job.id ?? job.jobId) === String(application.jobId)
    );
  }

  return (
    <>
      <div className="topbar">
        <div>
          <p className="eyebrow">APPLICATION TRACKER</p>
          <h1>My Applications</h1>
        </div>

        <button className="refresh-button" onClick={onRefresh}>
          Refresh
        </button>
      </div>

      <section className="applications-section">
        <div className="section-heading">
          <div>
            <h2>Tracked Applications</h2>
            <p>Jobs you have marked as applied.</p>
          </div>

          <span className="results-count">
            {applications.length} tracked
          </span>
        </div>

        {applications.length > 0 ? (
          <div className="applications-list">
            {applications.map((application, index) => {
              const job = getJobForApplication(application);

              const title =
                job?.jobTitle ||
                job?.title ||
                `Job #${application.jobId}`;

              const company =
                job?.companyName ||
                job?.company ||
                "Company";

              return (
                <div
                  className="application-row"
                  key={application.id ?? index}
                >
                  <div className="application-company-avatar">
                    {company.charAt(0).toUpperCase()}
                  </div>

                  <div className="application-info">
                    <h3>{title}</h3>

                    <p>
                      {company} · Applied on{" "}
                      {application.appliedDate || "Date not available"}
                    </p>
                  </div>

                  <span className="application-status">
                    {application.status || "APPLIED"}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No applications tracked yet</h3>
            <p>
              Go to Find Jobs and mark a job as applied after
              applying on the company's website.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
