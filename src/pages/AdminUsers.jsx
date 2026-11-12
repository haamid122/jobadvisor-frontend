import { useEffect, useState } from "react";
import { getAllUsers } from "../api/jobApi";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");
      const data = await getAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Unable to load users:", err);
      setError(err.response?.status === 403
        ? "Access denied. Only administrators can view registered users."
        : err.response?.data?.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="topbar">
        <div><p className="eyebrow">ADMINISTRATION</p><h1>Manage Users</h1></div>
        <button className="refresh-button" onClick={loadUsers} disabled={loading}>Refresh</button>
      </div>
      <section className="jobs-section">
        <div className="section-heading">
          <div><h2>Registered Users</h2><p>Read-only view of JobAdvisor accounts. Passwords are never returned by this API.</p></div>
          <span className="results-count">{users.length} users</span>
        </div>
        {error && <div className="auth-error" role="alert">{error}</div>}
        {loading ? <div className="loading-screen">Loading users...</div> :
          users.length === 0 ? <div className="empty-state"><h3>No users found</h3></div> :
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Skills</th></tr></thead>
              <tbody>{users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td><td>{user.name || "-"}</td><td>{user.email || "-"}</td>
                  <td><span className="admin-role">{user.role || "USER"}</span></td>
                  <td>{Array.isArray(user.skills) && user.skills.length ? user.skills.join(", ") : "-"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>}
      </section>
    </>
  );
}
