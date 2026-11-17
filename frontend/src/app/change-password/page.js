
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleChangePassword(event) {
    event.preventDefault();
    setMessage("");

    if (newPassword.length < 8) {
      setMessage("New password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("New password and confirm password do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setMessage("New password must be different from your temporary password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://https://learning-tracker-backend-91xm.onrender.com/api/v1/auth/change-password",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.message || "Unable to change password. Please check your current password."
        );
      }

      setMessage("Password changed successfully! Redirecting...");

      setTimeout(() => {
        router.replace("/student");
      }, 1000);

    } catch (error) {
      setMessage(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.main}>
      <section style={styles.card}>
        <div style={styles.logoIcon}>E</div>

        <h1 style={styles.heading}>Create Your New Password</h1>

        <p style={styles.subtitle}>
          Welcome to EduFlow! Please replace your temporary password
          with a new password to continue.
        </p>

        <form onSubmit={handleChangePassword}>
          <label style={styles.label}>Temporary Password</label>
          <input
            style={styles.input}
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter your temporary password"
            autoComplete="current-password"
            required
          />

          <label style={styles.label}>New Password</label>
          <input
            style={styles.input}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter your new password"
            autoComplete="new-password"
            minLength={8}
            required
          />

          <label style={styles.label}>Confirm New Password</label>
          <input
            style={styles.input}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your new password"
            autoComplete="new-password"
            minLength={8}
            required
          />

          {message && (
            <p style={styles.message} role="alert">
              {message}
            </p>
          )}

          <button
            type="submit"
            style={styles.button}
            disabled={loading}
          >
            {loading ? "Updating..." : "Change Password"}
          </button>
        </form>

        <p style={styles.footer}>
          🔒 Your password is securely protected.
        </p>
      </section>
    </main>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #edf5f4, #e8eff8)",
    padding: "25px 15px",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "480px",
    background: "#ffffff",
    padding: "40px",
    borderRadius: "20px",
    boxShadow: "0 20px 55px rgba(20,44,69,0.12)",
    boxSizing: "border-box",
  },
  logoIcon: {
    width: "55px",
    height: "55px",
    borderRadius: "15px",
    background: "linear-gradient(135deg, #16866b, #075e50)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    fontWeight: "bold",
    marginBottom: "25px",
  },
  heading: {
    color: "#142c45",
    fontSize: "26px",
    marginBottom: "12px",
  },
  subtitle: {
    color: "#718096",
    fontSize: "14px",
    lineHeight: "1.7",
    marginBottom: "28px",
  },
  label: {
    display: "block",
    color: "#142c45",
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    padding: "14px",
    border: "1px solid #d5dee7",
    borderRadius: "9px",
    marginBottom: "20px",
    boxSizing: "border-box",
    fontSize: "14px",
    outlineColor: "#16866b",
  },
  message: {
    background: "#effaf6",
    color: "#08745b",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "13px",
    lineHeight: "1.5",
  },
  button: {
    width: "100%",
    padding: "15px",
    background: "linear-gradient(135deg, #16866b, #08745b)",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "10px",
  },
  footer: {
    textAlign: "center",
    color: "#718096",
    fontSize: "12px",
    marginTop: "25px",
  },
};
