
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach JWT token to API requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("jobadvisor_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ===============================
// AUTHENTICATION APIs
// ===============================

// Register user
export async function registerUser(userData) {
  const response = await api.post("/users/register", userData);
  return response.data;
}

// Login user
export async function loginUser(credentials) {
  const response = await api.post("/users/login", credentials);

  const { token, user } = response.data;

  localStorage.setItem("jobadvisor_token", token);
  localStorage.setItem("jobadvisor_user", JSON.stringify(user));

  return response.data;
}

// Logout user
export function logoutUser() {
  localStorage.removeItem("jobadvisor_token");
  localStorage.removeItem("jobadvisor_user");
}

// Get logged-in user
export function getLoggedInUser() {
  const user = localStorage.getItem("jobadvisor_user");

  return user ? JSON.parse(user) : null;
}

// ===============================
// JOB APIs
// ===============================

export async function getJobs() {
  const response = await api.get("/jobs");
  return response.data;
}

// Advanced job search with backend filtering, sorting and pagination.
export async function searchJobs(filters = {}) {
  const response = await api.get("/jobs/search", {
    params: {
      page: filters.page ?? 0,
      size: filters.size ?? 5,
      sort: filters.sort ?? "id,desc",
      search: filters.search || undefined,
      location: filters.location || undefined,
      experienceLevel: filters.experienceLevel || undefined,
      skill: filters.skill || undefined,
    },
  });

  return response.data;
}

// ===============================
// APPLICATION APIs
// ===============================

export async function getUserApplications(userId) {
  const response = await api.get(
    `/applications/user/${userId}`
  );

  return response.data;
}

export async function markJobAsApplied(userId, jobId) {
  const now = new Date();

  const appliedDate = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  const response = await api.post("/applications", {
    userId,
    jobId,
    appliedDate,
    status: "APPLIED",
  });

  return response.data;
}

// ===============================
// USER PROFILE APIs
// ===============================

export async function getUserById(userId) {
  const response = await api.get(`/users/${userId}`);
  return response.data;
}

export async function updateUserProfile(userId, profile) {
  const response = await api.put(`/users/${userId}`, {
    name: profile.name,
    email: profile.email,
    skills: profile.skills,
  });

  return response.data;
}

// ===============================
// JOB RECOMMENDATION API
// ===============================

export async function getRecommendedJobs(userId) {
  const response = await api.get(
    `/jobs/recommendations/${userId}`
  );

  return response.data;
}

// ===============================
// ADMIN APIs
// ===============================

// Get all jobs (ADMIN can view)
export async function getAllAdminJobs() {
  const response = await api.get("/jobs", {
    params: {
      page: 0,
      size: 100,
      sort: "id,desc",
    },
  });

  return response.data;
}

// Create job (ADMIN only)
export async function createJob(jobData) {
  const response = await api.post("/jobs", jobData);
  return response.data;
}

// Update job (ADMIN only)
export async function updateJob(jobId, jobData) {
  const response = await api.put(`/jobs/${jobId}`, jobData);
  return response.data;
}

// Delete job (ADMIN only)
export async function deleteJob(jobId) {
  const response = await api.delete(`/jobs/${jobId}`);
  return response.data;
}

// Get all applications (ADMIN only, backend authorization required)
export async function getAllApplications() {
  const response = await api.get("/applications");
  return response.data;
}
// Update application status (ADMIN only)
export async function updateApplicationStatus(applicationId, status) {
  const response = await api.patch(
    `/applications/${applicationId}/status`,
    null,
    {
      params: { status },
    }
  );

  return response.data;
}


// Public job details
export async function getJobById(jobId) {
  const response = await api.get(`/jobs/${jobId}`);
  return response.data;
}

// Public applicant submission. Matching is calculated by the backend.
export async function submitApplication(applicationData) {
  const response = await api.post("/applications", applicationData);
  return response.data;
}
