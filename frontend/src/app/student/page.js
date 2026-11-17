
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "https://learning-tracker-backend-91xm.onrender.com/api/v1";

export default function StudentDashboard() {
  const router = useRouter();

  const [assignments, setAssignments] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadTraining();
  }, []);

  async function loadTraining() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/me/assignments`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        router.replace("/change-password");
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to load your training.");
      }

      const data = await response.json();

      // Supports either an array or an object containing assignments.
      const items = Array.isArray(data)
        ? data
        : data.assignments || [];

      setAssignments(items);
      setStudent(data.student || data.learner || null);
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(assignmentId, newStatus) {
    setUpdatingId(assignmentId);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/assignments/${assignmentId}/status`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to update your progress.");
      }

      setAssignments((previous) =>
        previous.map((item) =>
          item.id === assignmentId
            ? { ...item, status: newStatus }
            : item
        )
      );

      setMessage("Your progress has been updated successfully.");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleLogout() {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.replace("/login");
    }
  }

  function getActivity(item) {
    return item.activity || item.learningActivity || {};
  }

  function getStatusColor(status) {
  if (status === "COMPLETED") return "#16866b";
  if (status === "IN_PROGRESS") return "#2563eb";
  return "#64748b";
}

  const completedCount = assignments.filter(
  (item) => item.status === "COMPLETED"
).length;

  const progress = assignments.length
    ? Math.round((completedCount / assignments.length) * 100)
    : 0;

  return (
    <main style={styles.main}>
      <header style={styles.header}>
        <div style={styles.brand}>
          <div style={styles.logo}>E</div>
          <div>
            <h2 style={styles.brandName}>EduFlow</h2>
            <p style={styles.tagline}>Learn. Grow. Achieve.</p>
          </div>
        </div>

        <div style={styles.headerRight}>
          <span style={styles.portalLabel}>Student Portal</span>
          <button onClick={handleLogout} style={styles.logout}>
            Logout ↗
          </button>
        </div>
      </header>

      <section style={styles.content}>
        <div style={styles.welcome}>
          <div>
            <p style={styles.eyebrow}>YOUR LEARNING SPACE</p>
            <h1 style={styles.heading}>My Training</h1>
            <p style={styles.description}>
              Keep learning, track your progress, and achieve your goals.
            </p>
            {student?.displayName && (
              <p style={styles.studentName}>
                Welcome, {student.displayName}
                {student.cohort ? ` · ${student.cohort}` : ""}
              </p>
            )}
          </div>

          <div style={styles.welcomeIcon}>🎓</div>
        </div>

        <div style={styles.summary}>
          <div style={styles.summaryCard}>
            <p style={styles.summaryLabel}>Assigned Activities</p>
            <h2 style={styles.summaryNumber}>{assignments.length}</h2>
          </div>

          <div style={styles.summaryCard}>
            <p style={styles.summaryLabel}>Completed</p>
            <h2 style={styles.summaryNumber}>{completedCount}</h2>
          </div>

          <div style={styles.summaryCard}>
            <p style={styles.summaryLabel}>Overall Progress</p>
            <h2 style={styles.summaryNumber}>{progress}%</h2>
          </div>
        </div>

        <section style={styles.trainingSection}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Your Learning Activities</h2>
              <p style={styles.sectionDescription}>
                Update the status as you progress through your training.
              </p>
            </div>

            <button
              onClick={loadTraining}
              style={styles.refreshButton}
              disabled={loading}
            >
              ↻ Refresh
            </button>
          </div>

          {message && (
            <p style={styles.success}>{message}</p>
          )}

          {error && (
            <div style={styles.error}>
              {error}
              <button onClick={loadTraining} style={styles.retryButton}>
                Try again
              </button>
            </div>
          )}

          {loading ? (
            <div style={styles.empty}>
              Loading your training...
            </div>
          ) : !error && assignments.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>📚</div>
              <h3>No training assigned yet</h3>
              <p>
                Your Admin will assign learning activities to your account.
                Please check again later.
              </p>
            </div>
          ) : (
            <div style={styles.activityList}>
              {assignments.map((item) => {
                const activity = getActivity(item);
                const status = item.status || "NOT_STARTED";

                return (
                  <article key={item.id} style={styles.activityCard}>
                    <div style={styles.activityIcon}>📘</div>

                    <div style={styles.activityDetails}>
                      <h3 style={styles.activityTitle}>
                        {activity.title || "Learning Activity"}
                      </h3>

                      <p style={styles.activityMeta}>
                        {activity.topic || "General"} ·{" "}
                        {activity.plannedHours ?? "—"} planned hours
                      </p>

                      <span
                        style={{
                          ...styles.statusBadge,
                          color: getStatusColor(status),
                        }}
                      >
                        {status}
                      </span>
                    </div>

                    <div style={styles.statusControl}>
                      <label style={styles.statusLabel}>
                        Update progress
                      </label>

                      <select
                        value={status}
                        disabled={updatingId === item.id}
                        onChange={(event) =>
                          updateStatus(item.id, event.target.value)
                        }
                        style={styles.select}
                      >
                        <option value="NOT_STARTED">Not Started</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                      </select>

                      {updatingId === item.id && (
                        <small>Saving...</small>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer style={styles.footer}>
          © 2026 EduFlow · Keep learning, keep growing.
        </footer>
      </section>
    </main>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    background: "#f4f7fa",
    fontFamily: "Arial, sans-serif",
    color: "#142c45",
  },
  header: {
    background: "#ffffff",
    padding: "18px 6%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 2px 12px rgba(20,44,69,0.05)",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logo: {
    width: "44px",
    height: "44px",
    borderRadius: "13px",
    background: "linear-gradient(135deg,#16866b,#075e50)",
    color: "#ffffff",
    display: "grid",
    placeItems: "center",
    fontSize: "25px",
    fontWeight: "bold",
  },
  brandName: {
    margin: 0,
    fontSize: "23px",
    fontWeight: "800",
  },
  tagline: {
    margin: "3px 0 0",
    color: "#16866b",
    fontSize: "11px",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  portalLabel: {
    color: "#64748b",
    fontSize: "13px",
  },
  logout: {
    padding: "10px 16px",
    border: "1px solid #dce5ec",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#142c45",
    cursor: "pointer",
  },
  content: {
    maxWidth: "1120px",
    margin: "0 auto",
    padding: "45px 25px",
  },
  welcome: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "30px",
  },
  eyebrow: {
    color: "#16866b",
    fontSize: "11px",
    fontWeight: "bold",
    letterSpacing: "1.5px",
  },
  heading: {
    fontSize: "32px",
    margin: "8px 0",
  },
  description: {
    color: "#718096",
    fontSize: "14px",
  },
  studentName: {
    color: "#16866b",
    fontSize: "14px",
    fontWeight: "600",
  },
  welcomeIcon: {
    fontSize: "65px",
    background: "#e5f4ee",
    borderRadius: "20px",
    padding: "12px",
  },
  summary: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "18px",
    marginBottom: "35px",
  },
  summaryCard: {
    background: "#ffffff",
    padding: "23px",
    borderRadius: "14px",
    boxShadow: "0 4px 15px rgba(20,44,69,0.04)",
  },
  summaryLabel: {
    color: "#718096",
    fontSize: "13px",
  },
  summaryNumber: {
    fontSize: "29px",
    margin: "10px 0 0",
  },
  trainingSection: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "28px",
    boxShadow: "0 4px 15px rgba(20,44,69,0.04)",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    marginBottom: "24px",
  },
  sectionTitle: {
    fontSize: "20px",
    margin: 0,
  },
  sectionDescription: {
    color: "#718096",
    fontSize: "13px",
  },
  refreshButton: {
    padding: "9px 14px",
    background: "#effaf6",
    color: "#16866b",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  activityList: {
    display: "grid",
    gap: "14px",
  },
  activityCard: {
    display: "flex",
    alignItems: "center",
    gap: "17px",
    padding: "19px",
    border: "1px solid #e8edf2",
    borderRadius: "12px",
    flexWrap: "wrap",
  },
  activityIcon: {
    width: "45px",
    height: "45px",
    borderRadius: "12px",
    background: "#effaf6",
    display: "grid",
    placeItems: "center",
    fontSize: "22px",
  },
  activityDetails: {
    flex: "1 1 200px",
  },
  activityTitle: {
    fontSize: "16px",
    margin: "0 0 7px",
  },
  activityMeta: {
    fontSize: "12px",
    color: "#718096",
  },
  statusBadge: {
    fontSize: "12px",
    fontWeight: "bold",
  },
  statusControl: {
    display: "grid",
    gap: "7px",
    minWidth: "170px",
  },
  statusLabel: {
    fontSize: "11px",
    color: "#64748b",
  },
  select: {
    padding: "10px",
    border: "1px solid #dce5ec",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#142c45",
  },
  empty: {
    textAlign: "center",
    padding: "45px 15px",
    color: "#718096",
  },
  emptyIcon: {
    fontSize: "40px",
  },
  success: {
    padding: "12px",
    background: "#effaf6",
    color: "#16866b",
    borderRadius: "8px",
    fontSize: "13px",
  },
  error: {
    padding: "14px",
    background: "#fff1f1",
    color: "#c53030",
    borderRadius: "8px",
    fontSize: "13px",
  },
  retryButton: {
    marginLeft: "12px",
    padding: "6px 10px",
    cursor: "pointer",
  },
  footer: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "12px",
    padding: "35px 0 10px",
  },
};
