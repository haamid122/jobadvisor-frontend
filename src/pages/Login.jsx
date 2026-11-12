
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/jobApi";

function Login({ onLogin }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await loginUser(formData);

      if (!response?.token || !response?.user) {
        throw new Error("Invalid login response from server.");
      }

      const loggedInUser = response.user;

      onLogin(loggedInUser);

      if (loggedInUser.role !== "ADMIN") {
        throw new Error("Only staff accounts can access this portal.");
      }
      navigate("/admin", { replace: true });

    } catch (err) {
      console.error("Login failed:", err);

      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Invalid email or password."
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-brand">
          <span className="brand-icon">J</span>
          <span>JobAdvisor</span>
        </div>

        <h1>Staff Login</h1>

        <p className="auth-subtitle">
          Sign in to manage job postings and applications.
        </p>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <label>Email Address</label>

          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label>Password</label>

          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <button
            type="submit"
            className="auth-submit-button"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>



      </div>
    </div>
  );
}

export default Login;
