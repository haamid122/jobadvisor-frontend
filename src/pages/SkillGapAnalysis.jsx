
import { useEffect, useMemo, useState } from "react";
import {
  getUserById,
  getRecommendedJobs,
} from "../api/jobApi";

export default function SkillGapAnalysis({ userId }) {
  const [showReport, setShowReport] = useState(false);
  const [mySkills, setMySkills] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSkillData() {
      if (!userId) return;

      try {
        setLoading(true);
        setError("");

        const [userData, recommendationsData] =
          await Promise.all([
            getUserById(userId),
            getRecommendedJobs(userId),
          ]);

        if (!active) return;

        setMySkills(
          Array.isArray(userData?.skills)
            ? userData.skills
            : []
        );

        setRecommendations(
          Array.isArray(recommendationsData)
            ? recommendationsData
            : []
        );
      } catch (err) {
        console.error("Failed to load skill gap data:", err);

        if (active) {
          setError(
            "Unable to load skill analysis. Please try again."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSkillData();

    return () => {
      active = false;
    };
  }, [userId]);

  function normalizeSkill(skill) {
    return String(skill || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }

  const userSkillSet = useMemo(
    () => new Set(mySkills.map(normalizeSkill)),
    [mySkills]
  );

  const requiredSkills = useMemo(() => {
    const skillMap = new Map();

    recommendations.forEach((recommendation) => {
      const job = recommendation?.job;

      if (!job?.requiredSkills) return;

      String(job.requiredSkills)
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean)
        .forEach((skill) => {
          const normalized = normalizeSkill(skill);

          if (normalized && !skillMap.has(normalized)) {
            skillMap.set(normalized, skill);
          }
        });
    });

    return Array.from(skillMap.values());
  }, [recommendations]);

  const matchedSkills = useMemo(
    () =>
      requiredSkills.filter((skill) =>
        userSkillSet.has(normalizeSkill(skill))
      ),
    [requiredSkills, userSkillSet]
  );

  const missingSkills = useMemo(
    () =>
      requiredSkills.filter(
        (skill) => !userSkillSet.has(normalizeSkill(skill))
      ),
    [requiredSkills, userSkillSet]
  );

  const skillJobCounts = useMemo(() => {
    const counts = new Map();

    recommendations.forEach((recommendation) => {
      const job = recommendation?.job;

      if (!job?.requiredSkills) return;

      const uniqueSkills = new Set(
        String(job.requiredSkills)
          .split(",")
          .map((skill) => normalizeSkill(skill.trim()))
          .filter(Boolean)
      );

      uniqueSkills.forEach((skill) => {
        counts.set(skill, (counts.get(skill) || 0) + 1);
      });
    });

    return counts;
  }, [recommendations]);

  const learningPriorities = useMemo(
    () =>
      missingSkills
        .map((skill) => {
          const jobCount =
            skillJobCounts.get(normalizeSkill(skill)) || 0;

          const priority =
            jobCount >= 3
              ? "High"
              : jobCount >= 2
                ? "Medium"
                : "Low";

          return { name: skill, jobCount, priority };
        })
        .sort((a, b) => b.jobCount - a.jobCount),
    [missingSkills, skillJobCounts]
  );

  const overallPercentage =
    requiredSkills.length > 0
      ? Math.round(
          (matchedSkills.length / requiredSkills.length) * 100
        )
      : 0;

  const skillProgress = useMemo(
    () =>
      requiredSkills.map((skill) => {
        const isMatched = userSkillSet.has(
          normalizeSkill(skill)
        );

        return {
          name: skill,
          percentage: isMatched ? 100 : 0,
          isMatched,
        };
      }),
    [requiredSkills, userSkillSet]
  );

  if (loading) {
    return (
      <div className="loading-screen">
        Loading Skill Gap Analysis...
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-screen">
        <div>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="skill-analysis-page">
      <div className="skill-analysis-header">
        <div>
          <p className="eyebrow">CAREER DEVELOPMENT</p>
          <h1>Skill Gap Analysis</h1>
          <p className="skill-analysis-subtitle">
            Your career improvement plan
          </p>
        </div>

        <span className="skill-analysis-sparkle">✦</span>
      </div>

      <section className="skill-progress-card">
        <div className="progress-summary">
          <div
            className="progress-circle"
            style={{ "--pct": overallPercentage }}
          >
            <span>{overallPercentage}%</span>
          </div>

          <div className="progress-message">
            <h3>
              {overallPercentage >= 80
                ? "Excellent progress!"
                : overallPercentage >= 50
                  ? "Good progress!"
                  : "Keep learning!"}
            </h3>

            <p>
              {requiredSkills.length === 0
                ? "Add jobs to see your skill analysis."
                : `${matchedSkills.length} of ${requiredSkills.length} required skills matched across recommended jobs.`}
            </p>
          </div>
        </div>

        <div className="skill-progress-list">
          {skillProgress.length > 0 ? (
            skillProgress.map((skill) => (
              <div
                className="skill-progress-item"
                key={skill.name}
              >
                <div className="skill-progress-label">
                  <span>{skill.name}</span>
                  <strong>
                    {skill.isMatched ? "Learned" : "To Learn"}
                  </strong>
                </div>

                <div className="skill-progress-track">
                  <div
                    className="skill-progress-fill"
                    style={{
                      width: `${skill.percentage}%`,
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p>
              No required skills found in recommended jobs.
            </p>
          )}
        </div>

        <button
          className="view-skill-report-button"
          onClick={() =>
            setShowReport((previous) => !previous)
          }
        >
          {showReport
            ? "Hide Skill Report ↑"
            : "View Skill Report →"}
        </button>

        {showReport && (
          <div className="skill-report-details">
            <h3>Your Skill Report</h3>

            <p>
              Your overall skill match is {overallPercentage}%.
              Focus on missing skills to improve your job match.
            </p>

            <h4>Your Current Skills</h4>
            <div className="skill-list">
              {mySkills.length > 0 ? (
                mySkills.map((skill) => (
                  <span className="skill-tag" key={skill}>
                    {skill}
                  </span>
                ))
              ) : (
                <p>No skills saved in your profile.</p>
              )}
            </div>

            <h4>Matched Skills</h4>
            <div className="skill-list">
              {matchedSkills.length > 0 ? (
                matchedSkills.map((skill) => (
                  <span className="skill-tag" key={skill}>
                    ✓ {skill}
                  </span>
                ))
              ) : (
                <p>No matched skills found.</p>
              )}
            </div>

            <h4>Missing Skills</h4>
            <div className="skill-list">
              {missingSkills.length > 0 ? (
                missingSkills.map((skill) => (
                  <span className="skill-tag" key={skill}>
                    {skill}
                  </span>
                ))
              ) : (
                <p>
                  You have all the skills required by the
                  currently recommended jobs.
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="skill-quick-tips">
        <h2>Learning Priority</h2>

        <p className="skill-analysis-subtitle">
          Focus on missing skills that appear in more recommended jobs.
        </p>

        {learningPriorities.length > 0 ? (
          <div className="learning-priority-list">
            {learningPriorities.map((skill) => (
              <div
                className="quick-tip-item"
                key={skill.name}
              >
                <span className="quick-tip-icon">
                  {skill.priority === "High"
                    ? "↑"
                    : skill.priority === "Medium"
                      ? "◆"
                      : "•"}
                </span>

                <div>
                  <p>
                    <strong>{skill.name}</strong>
                  </p>

                  <p>
                    Required by {skill.jobCount}{" "}
                    {skill.jobCount === 1 ? "job" : "jobs"}
                  </p>

                  <span
                    className={`priority-label priority-${skill.priority.toLowerCase()}`}
                  >
                    {skill.priority} Priority
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="quick-tip-item">
            <span className="quick-tip-icon">✓</span>
            <p>
              No missing skills found in the current recommended jobs.
            </p>
          </div>
        )}
      </section>

      <section className="skill-quick-tips">
        <h2>Quick Tips</h2>

        <div className="quick-tip-item">
          <span className="quick-tip-icon">✦</span>
          <p>
            Focus on missing skills to improve your job match.
          </p>
        </div>

        <div className="quick-tip-item">
          <span className="quick-tip-icon">✓</span>
          <p>
            Keep your resume updated with your latest projects.
          </p>
        </div>

        <div className="quick-tip-item">
          <span className="quick-tip-icon">◇</span>
          <p>
            Practice technologies required by your target roles.
          </p>
        </div>
      </section>
    </div>
  );
}
