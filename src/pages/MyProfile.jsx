
import { useEffect, useState } from "react";
import { getUserById, updateUserProfile } from "../api/jobApi";

export default function MyProfile({ userId }) {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    role: "USER",
    skills: [],
  });

  const [skillsInput, setSkillsInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!userId) return;

      try {
        setLoading(true);
        setError("");

        const user = await getUserById(userId);

        if (!active) return;

        const userSkills = Array.isArray(user.skills)
          ? user.skills
          : [];

        setProfile({
          name: user.name || "",
          email: user.email || "",
          role: user.role || "USER",
          skills: userSkills,
        });

        setSkillsInput(userSkills.join(", "));
      } catch (err) {
        console.error("Unable to load profile:", err);

        if (active) {
          setError("Unable to load profile. Check the backend.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [userId]);

  function handleChange(event) {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function parseSkills(value) {
    return [
      ...new Set(
        value
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean)
      ),
    ];
  }

  function handleEdit() {
    setSkillsInput(profile.skills.join(", "));
    setEditing(true);
    setMessage("");
    setError("");
  }

  function handleCancel() {
    setEditing(false);
    setSkillsInput(profile.skills.join(", "));
    setMessage("");
    setError("");
  }

  async function handleSave(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const updatedProfile = {
        ...profile,
        skills: parseSkills(skillsInput),
      };

      const updatedUser = await updateUserProfile(
        userId,
        updatedProfile
      );

      const updatedSkills = Array.isArray(updatedUser.skills)
        ? updatedUser.skills
        : updatedProfile.skills;

      setProfile({
        name: updatedUser.name || updatedProfile.name,
        email: updatedUser.email || updatedProfile.email,
        role: updatedUser.role || updatedProfile.role,
        skills: updatedSkills,
      });

      setSkillsInput(updatedSkills.join(", "));
      setEditing(false);
      setMessage("Profile updated successfully.");
    } catch (err) {
      console.error("Unable to update profile:", err);

      const backendMessage =
        err.response?.data?.reason ||
        err.response?.data?.message ||
        err.response?.data?.error;

      setError(
        backendMessage ||
        "Unable to update profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        Loading profile...
      </div>
    );
  }

  if (error && !profile.name) {
    return (
      <div className="message error-message">
        {error}
      </div>
    );
  }

  return (
    <>
      <div className="topbar">
        <div>
          <p className="eyebrow">ACCOUNT</p>
          <h1>My Profile</h1>
        </div>

        {!editing && (
          <button
            className="refresh-button"
            onClick={handleEdit}
          >
            Edit Profile
          </button>
        )}
      </div>

      {message && (
        <div className="message">{message}</div>
      )}

      {error && (
        <div className="message error-message">{error}</div>
      )}

      <section className="applications-section">
        <div className="profile-card">
          <div className="profile-avatar">
            {profile.name?.charAt(0).toUpperCase() || "U"}
          </div>

          <div>
            <h2>{profile.name || "User"}</h2>
            <p>{profile.email}</p>
            <p>{profile.role}</p>
          </div>
        </div>
      </section>

      <section className="applications-section">
        <div className="section-heading">
          <div>
            <h2>Personal Information</h2>
            <p>Manage your account details.</p>
          </div>
        </div>

        <form className="profile-form" onSubmit={handleSave}>
          <label>
            Full Name
            <input
              type="text"
              name="name"
              value={profile.name}
              onChange={handleChange}
              disabled={!editing}
              required
            />
          </label>

          <label>
            Email Address
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              disabled={!editing}
              required
            />
          </label>

          <label>
            Role
            <input
              type="text"
              name="role"
              value={profile.role}
              disabled
            />
          </label>

          {editing && (
            <div className="profile-form-actions">
              <button
                type="button"
                className="view-job-button"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="mark-applied-button"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </form>
      </section>

      <section className="applications-section">
        <div className="section-heading">
          <div>
            <h2>Technical Skills</h2>
            <p>
              Add your technical skills separated by commas.
            </p>
          </div>
        </div>

        <div className="skill-gap-card">
          {editing ? (
            <label className="profile-skills-input">
              Your Skills
              <textarea
                value={skillsInput}
                onChange={(event) =>
                  setSkillsInput(event.target.value)
                }
                placeholder="Java, Spring Boot, React, MySQL"
                rows={4}
              />
            </label>
          ) : (
            <div className="skill-list">
              {profile.skills.length > 0 ? (
                profile.skills.map((skill) => (
                  <span className="skill-tag" key={skill}>
                    {skill}
                  </span>
                ))
              ) : (
                <p>
                  No skills added yet. Click Edit Profile to add skills.
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
