
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [role, setRole] = useState("CANDIDATE");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8081/api/v1/auth/login",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Invalid email or password."
        );
      }

      if (data.role !== role) {
        await fetch(
          "http://localhost:8081/api/v1/auth/logout",
          {
            method: "POST",
            credentials: "include",
          }
        );

        throw new Error(
          "This account does not belong to the selected portal."
        );
      }

      if (data.mustChangePassword) {
        router.push("/change-password");
      } else if (data.role === "COORDINATOR") {
        router.push("/");
      } else if (data.role === "CANDIDATE") {
        router.push("/student");
      } else {
        setMessage("Your account role is not recognized.");
      }
    } catch (error) {
      setMessage(
        error.message || "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.main}>
      <div style={styles.backgroundCircle}></div>
      <div style={styles.backgroundCircleTwo}></div>

      <section style={styles.card}>

        {/* EduFlow Branding */}
        <div style={styles.logo}>
          <div style={styles.logoIcon}>E</div>

          <div>
            <h2 style={styles.logoName}>EduFlow</h2>
            <p style={styles.tagline}>
              Learn. Grow. Achieve.
            </p>
          </div>
        </div>

        {/* Welcome Section */}
        <div style={styles.welcome}>
          <p style={styles.welcomeLabel}>
            YOUR LEARNING JOURNEY STARTS HERE
          </p>

          <h1 style={styles.heading}>
            Welcome to EduFlow
          </h1>

          <p style={styles.subtitle}>
            Your learning journey, organized in one place.
          </p>
        </div>

        {/* Portal Selection */}
        <p style={styles.sectionLabel}>
          SELECT YOUR PORTAL
        </p>

        <div style={styles.portalContainer}>
          <button
            type="button"
            onClick={() => {
              setRole("COORDINATOR");
              setMessage("");
            }}
            style={{
              ...styles.portal,
              ...(role === "COORDINATOR"
                ? styles.selectedPortal
                : {}),
            }}
          >
            <span style={styles.portalIcon}>🛡️</span>

            <strong>Admin Login</strong>

            <small>
              Manage training and students
            </small>
          </button>

          <button
            type="button"
            onClick={() => {
              setRole("CANDIDATE");
              setMessage("");
            }}
            style={{
              ...styles.portal,
              ...(role === "CANDIDATE"
                ? styles.selectedPortal
                : {}),
            }}
          >
            <span style={styles.portalIcon}>🎓</span>

            <strong>Student Login</strong>

            <small>
              Access your assigned training
            </small>
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <label style={styles.label}>
            Email Address
          </label>

          <input 
            style={styles.input}
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />

          <label style={styles.label}>
            Password
          </label>

          <input
            style={styles.input}
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          {message && (
            <div style={styles.error} role="alert">
              <span>⚠ </span>
              {message}
            </div>
          )}

          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>

        {/* Footer */}
        <div style={styles.footer}>
          <div style={styles.security}>
            <span>🔒</span>
            <span>
              Secure access for authorized cohort users
            </span>
          </div>

          <p style={styles.accountNote}>
            Student accounts are provided by your Admin.
          </p>

          <div style={styles.footerDivider}></div>

          <p style={styles.copyright}>
            © 2026 EduFlow. All rights reserved.
          </p>
        </div>

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
    background: "linear-gradient(135deg, #edf5f4 0%, #e8eff8 100%)",
    padding: "35px 20px",
    position: "relative",
    overflow: "hidden",
    fontFamily: "Arial, sans-serif",
  },

  backgroundCircle: {
    position: "absolute",
    width: "430px",
    height: "430px",
    borderRadius: "50%",
    background: "rgba(22, 134, 107, 0.09)",
    top: "-180px",
    right: "-100px",
    pointerEvents: "none",
  },

  backgroundCircleTwo: {
    position: "absolute",
    width: "300px",
    height: "300px",
    borderRadius: "50%",
    background: "rgba(89, 125, 180, 0.07)",
    bottom: "-150px",
    left: "-100px",
    pointerEvents: "none",
  },

  card: {
    width: "100%",
    maxWidth: "490px",
    background: "#ffffff",
    padding: "42px",
    borderRadius: "24px",
    boxShadow: "0 22px 65px rgba(20, 44, 69, 0.13)",
    position: "relative",
    zIndex: 1,
    boxSizing: "border-box",
  },

  logo: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "36px",
  },

  logoIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "17px",
    background: "linear-gradient(135deg, #16866b, #075e50)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "31px",
    fontWeight: "bold",
    boxShadow: "0 7px 20px rgba(22, 134, 107, 0.25)",
    letterSpacing: "-2px",
    flexShrink: 0,
  },

  logoName: {
    margin: 0,
    color: "#142c45",
    fontSize: "28px",
    fontWeight: "800",
    letterSpacing: "-0.8px",
  },

  tagline: {
    margin: "4px 0 0",
    color: "#16866b",
    fontSize: "12px",
    letterSpacing: "1.2px",
  },

  welcome: {
    marginBottom: "29px",
  },

  welcomeLabel: {
    color: "#16866b",
    fontSize: "10px",
    fontWeight: "bold",
    letterSpacing: "1.5px",
    marginBottom: "11px",
  },

  heading: {
    fontSize: "30px",
    color: "#142c45",
    fontWeight: "750",
    letterSpacing: "-0.8px",
    margin: "0 0 10px",
  },

  subtitle: {
    color: "#718096",
    fontSize: "14px",
    lineHeight: "1.6",
    margin: 0,
  },

  sectionLabel: {
    color: "#64748b",
    fontSize: "11px",
    fontWeight: "bold",
    letterSpacing: "1.3px",
    marginBottom: "13px",
  },

  portalContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "13px",
    marginBottom: "27px",
  },

  portal: {
    minHeight: "126px",
    padding: "16px 8px",
    border: "1px solid #dce5ec",
    borderRadius: "14px",
    background: "#ffffff",
    color: "#142c45",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    transition: "all 0.2s ease",
  },

  selectedPortal: {
    border: "2px solid #16866b",
    background: "#effaf6",
    boxShadow: "0 5px 16px rgba(22, 134, 107, 0.12)",
  },

  portalIcon: {
    fontSize: "27px",
  },

  label: {
    display: "block",
    color: "#142c45",
    fontWeight: "600",
    fontSize: "14px",
    marginBottom: "9px",
  },

  input: {
    width: "100%",
    padding: "15px",
    border: "1px solid #d5dee7",
    borderRadius: "10px",
    marginBottom: "21px",
    boxSizing: "border-box",
    fontSize: "14px",
    outlineColor: "#16866b",
    background: "#ffffff",
    color: "#142c45",
  },

  button: {
    width: "100%",
    padding: "16px",
    background: "linear-gradient(135deg, #16866b, #08745b)",
    color: "#ffffff",
    border: "none",
    borderRadius: "11px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "5px",
    boxShadow: "0 6px 16px rgba(22, 134, 107, 0.18)",
  },

  error: {
    background: "#fff1f1",
    color: "#c53030",
    padding: "12px",
    borderRadius: "9px",
    fontSize: "13px",
    marginBottom: "16px",
    lineHeight: "1.5",
  },

  footer: {
    textAlign: "center",
    color: "#718096",
    fontSize: "12px",
    marginTop: "28px",
    lineHeight: "1.8",
  },

  security: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "7px",
    color: "#526579",
  },

  accountNote: {
    marginTop: "8px",
    color: "#718096",
  },

  footerDivider: {
    height: "1px",
    background: "#edf1f5",
    margin: "17px 0",
  },

  copyright: {
    margin: 0,
    color: "#94a3b8",
    fontSize: "11px",
  },
};
