
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const API_URL = "https://learning-tracker-backend-91xm.onrender.com/api/v1";

const navigation = [
  { label: "Overview", href: "/", icon: "⌂" },
  { label: "Activities", href: "/activities", icon: "▤" },
  { label: "Learners", href: "/learners", icon: "♙" },
  { label: "Assignments", href: "/assignments", icon: "▣" },
];

const statusLabels = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

async function readResponse(response) {
  const text = await response.text();
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = {};
    }
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
      `Request failed. Status: ${response.status}`
    );
  }

  return data;
}

export default function LearnersPage() {
  const pathname = usePathname();

  const [learners, setLearners] = useState([]);
  const [activities, setActivities] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [selectedLearner, setSelectedLearner] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cohort, setCohort] = useState("");
  const [selectedActivity, setSelectedActivity] = useState("");

  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [passwordEmail, setPasswordEmail] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const [loading, setLoading] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [creating, setCreating] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [resettingLearnerId, setResettingLearnerId] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  function showMessage(text, type = "success") {
    setMessage(text);
    setMessageType(type);
  }

  async function loadLearners() {
    try {
      const response = await fetch(`${API_URL}/learners`, {
        credentials: "include",
      });

      const data = await readResponse(response);
      const list = Array.isArray(data) ? data : [];

      setLearners(list);

      if (selectedLearner) {
        const updated = list.find(
          (learner) => learner.id === selectedLearner.id
        );

        if (updated) setSelectedLearner(updated);
      }
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadActivities() {
    try {
      const response = await fetch(`${API_URL}/activities`, {
        credentials: "include",
      });

      const data = await readResponse(response);
      setActivities(Array.isArray(data) ? data : []);
    } catch (error) {
      showMessage(error.message, "error");
    }
  }

  async function loadAssignments(learnerId) {
    setLoadingAssignments(true);
    setAssignments([]);

    try {
      const response = await fetch(
        `${API_URL}/assignments/learner/${learnerId}`,
        { credentials: "include" }
      );

      const data = await readResponse(response);
      setAssignments(Array.isArray(data) ? data : []);
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setLoadingAssignments(false);
    }
  }

  async function refreshData() {
    setLoading(true);
    await Promise.all([loadLearners(), loadActivities()]);
    setLoading(false);

    if (selectedLearner) {
      await loadAssignments(selectedLearner.id);
    }
  }

  useEffect(() => {
    loadLearners();
    loadActivities();
  }, []);

  function selectLearner(learner) {
    setSelectedLearner(learner);
    setSelectedActivity("");
    setMessage("");
    setSearch("");
    setStatusFilter("ALL");
    loadAssignments(learner.id);
  }

  async function addLearner(event) {
    event.preventDefault();

    setMessage("");
    setTemporaryPassword("");
    setPasswordEmail("");

    if (!name.trim() || !email.trim() || !cohort.trim()) {
      showMessage("Please complete all candidate details.", "error");
      return;
    }

    setCreating(true);

    try {
      const response = await fetch(
        `${API_URL}/coordinator/candidates`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            cohort: cohort.trim(),
          }),
        }
      );

      const data = await readResponse(response);

      setTemporaryPassword(data.temporaryPassword || "");
      setPasswordEmail(data.email || email.trim());

      showMessage(
        "Candidate created successfully. Save the temporary credentials now."
      );

      setName("");
      setEmail("");
      setCohort("");

      await loadLearners();
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setCreating(false);
    }
  }


async function resetCandidatePassword(learner) {
  const confirmed = window.confirm(
    `Are you sure you want to reset the password for ${learner.name}?`
  );

  if (!confirmed) return;

  setMessage("");
  setTemporaryPassword("");
  setPasswordEmail("");
  setResettingLearnerId(learner.id);

  try {
    const response = await fetch(
      `${API_URL}/learners/${learner.id}/reset-password`,
      {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      }
    );

    const data = await readResponse(response);

    setTemporaryPassword(data.temporaryPassword || "");
    setPasswordEmail(data.email || learner.email);

    showMessage(
      "Password reset successfully. Save and share the new temporary password privately."
    );
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    setResettingLearnerId(null);
  }
}


  async function assignActivity(event) {
    event.preventDefault();

    if (!selectedLearner || !selectedActivity) {
      showMessage("Please select a learning activity.", "error");
      return;
    }

    setAssigning(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/assignments`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          learnerId: selectedLearner.id,
          activityId: Number(selectedActivity),
        }),
      });

      await readResponse(response);

      showMessage("Learning activity assigned successfully!");
      setSelectedActivity("");

      await loadAssignments(selectedLearner.id);
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setAssigning(false);
    }
  }

  async function updateStatus(assignmentId, status) {
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/assignments/${assignmentId}/status`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await readResponse(response);

      setAssignments((previous) =>
        previous.map((item) =>
          item.id === assignmentId ? data : item
        )
      );

      showMessage("Progress updated successfully.");
    } catch (error) {
      showMessage(error.message, "error");
    }
  }

  async function logout() {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      window.location.href = "/login";
    }
  }

  async function copyCredentials() {
    try {
      await navigator.clipboard.writeText(
        `Email: ${passwordEmail}\nTemporary password: ${temporaryPassword}`
      );

      showMessage("Credentials copied. Share them privately.");
    } catch {
      showMessage(
        "Clipboard access failed. Please copy the credentials manually.",
        "error"
      );
    }
  }

  function hideCredentials() {
    setTemporaryPassword("");
    setPasswordEmail("");
    showMessage("Temporary credentials hidden.");
  }

  const completed = assignments.filter(
    (item) => item.status === "COMPLETED"
  ).length;

  const inProgress = assignments.filter(
    (item) => item.status === "IN_PROGRESS"
  ).length;

  const notStarted = assignments.filter(
    (item) =>
      !item.status || item.status === "NOT_STARTED"
  ).length;

  const percentage = assignments.length
    ? Math.round((completed / assignments.length) * 100)
    : 0;

  const filteredAssignments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return assignments.filter((item) => {
      const title = item.activity?.title || "";
      const topic = item.activity?.topic || "";
      const status = item.status || "NOT_STARTED";

      const matchesSearch =
        title.toLowerCase().includes(term) ||
        topic.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "ALL" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [assignments, search, statusFilter]);

  return (
    <div className="min-h-screen bg-[#F4F7FA] text-[#142C45]">

      {mobileMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setMobileMenu(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-[#142C45] text-white transition-transform duration-300 ${
          mobileMenu ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-24 items-center gap-3 border-b border-white/10 px-7">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-400 text-2xl font-bold text-[#142C45]">
            E
          </div>

          <div>
            <h1 className="text-2xl font-bold">EduFlow</h1>
            <p className="mt-1 text-[10px] tracking-[2px] text-emerald-300">
              LEARN. GROW. ACHIEVE.
            </p>
          </div>
        </div>

        <div className="px-6 pt-9">
          <p className="mb-4 text-[10px] font-bold tracking-[2px] text-slate-400">
            WORKSPACE
          </p>

          <nav className="space-y-2">
            {navigation.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenu(false)}
                  className={`flex min-h-[54px] items-center gap-4 rounded-xl px-4 py-3.5 text-sm font-medium transition ${
                    active
                      ? "bg-emerald-500 text-white shadow-lg"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="w-6 text-center text-xl">
                    {item.icon}
                  </span>

                  {item.label}

                  {active && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-white" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-5">
          <div className="mb-5 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold">Learning matters</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Organize learning activities and build better training journeys.
            </p>
          </div>

          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left text-sm font-semibold text-red-300 hover:bg-red-500/10"
          >
            <span className="text-xl">↪</span>
            Logout
          </button>

          <p className="mt-5 px-4 text-[10px] text-slate-500">
            EDUFLOW © 2026
          </p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="min-h-screen">

        {/* HEADER */}
        <header className="sticky top-0 z-30 flex min-h-[76px] items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-5 py-3 backdrop-blur sm:px-8">

          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xl transition hover:bg-slate-50"
              aria-label="Toggle navigation"
              aria-expanded={mobileMenu}
            >
              ☰
            </button>

            <div>
              <p className="text-xs text-slate-400">
                Workspace / Learners
              </p>
              <p className="text-sm font-bold">
                Candidate Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium sm:block">
              Administrator
            </span>

            <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100 font-bold text-emerald-800">
              A
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1450px] p-5 sm:p-8">

          {/* PAGE HEADING */}
          <section className="mb-8 flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="text-xs font-bold tracking-[2px] text-emerald-700">
                EDUFLOW / CANDIDATE MANAGEMENT
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Learners
              </h2>

              <p className="mt-3 text-sm text-slate-500 sm:text-base">
                Manage candidates and monitor their individual learning progress.
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-700">
              {learners.length} Candidates
            </div>
          </section>

          {/* MESSAGE */}
          {message && (
            <div
              className={`mb-6 rounded-xl border p-4 text-sm ${
                messageType === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              {message}
            </div>
          )}

          {/* ONE-TIME CREDENTIALS */}
          {temporaryPassword && (
            <section className="mb-7 rounded-2xl border border-purple-200 bg-purple-50 p-6">
              <h3 className="text-lg font-bold text-purple-900">
                Temporary credentials generated!
              </h3>

              <p className="mt-2 text-sm text-purple-800">
                Save these credentials securely. The temporary password is displayed only now.
              </p>

              <p className="mt-4 text-sm">
                <strong>Email:</strong> {passwordEmail}
              </p>

              <p className="mt-3 text-sm font-semibold">
                Temporary password:
              </p>

              <code className="mt-2 inline-block break-all rounded-lg bg-white p-3 text-base font-bold">
                {temporaryPassword}
              </code>

              <p className="mt-3 text-xs text-purple-800">
                This password expires after 24 hours. The candidate must change it during the first login.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={copyCredentials}
                  className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  Copy credentials
                </button>

                <button
                  onClick={hideCredentials}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold"
                >
                  Hide credentials
                </button>
              </div>
            </section>
          )}

          {/* CREATE CANDIDATE AND CANDIDATE LIST */}
          <section className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">

            {/* CREATE FORM */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <p className="text-xs font-bold tracking-[2px] text-emerald-700">
                NEW CANDIDATE
              </p>

              <h3 className="mt-2 text-xl font-bold">
                Create candidate
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Add a new candidate to your training cohort.
              </p>

              <form onSubmit={addLearner} className="mt-6 space-y-4">

                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-semibold">
                    Full name
                  </label>

                  <input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter candidate name"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-semibold">
                    Email address
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="cohort" className="mb-2 block text-sm font-semibold">
                    Cohort
                  </label>

                  <input
                    id="cohort"
                    value={cohort}
                    onChange={(e) => setCohort(e.target.value)}
                    placeholder="Example: 2026"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="w-full rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {creating ? "Creating candidate..." : "+ Create candidate"}
                </button>
              </form>
            </div>

            {/* CANDIDATE LIST */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold tracking-[2px] text-emerald-700">
                    CANDIDATE DIRECTORY
                  </p>

                  <h3 className="mt-2 text-xl font-bold">
                    All candidates
                  </h3>
                </div>

                <button
                  onClick={refreshData}
                  disabled={loading}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  {loading ? "Loading..." : "↻ Reload"}
                </button>
              </div>

              <p className="mt-2 text-sm text-slate-500">
                Select a candidate to inspect their learning progress.
              </p>

              
              <div className="mt-5 space-y-3">
                {loading ? (
                  <p className="py-8 text-center text-sm text-slate-500">
                    Loading candidates...
                  </p>
                ) : learners.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <p className="font-semibold">No candidates found</p>
                    <p className="mt-2 text-sm text-slate-500">
                      Create your first candidate using the form.
                    </p>
                  </div>
                ) : (
                  learners.map((learner) => (
                    <div
                      key={learner.id}
                      className={`flex flex-wrap items-center gap-3 rounded-xl border p-4 transition ${
                        selectedLearner?.id === learner.id
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-slate-200 hover:border-emerald-300 hover:bg-slate-50"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => selectLearner(learner)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-100 font-bold text-emerald-800">
                          {(learner.name || learner.displayName || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold">
                            {learner.name || learner.displayName}
                          </p>
                          <p className="mt-1 truncate text-xs text-slate-500">
                            {learner.email}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Cohort: {learner.cohort || "—"}
                          </p>
                        </div>

                        <span className="text-xl text-emerald-600">›</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => resetCandidatePassword(learner)}
                        disabled={resettingLearnerId !== null}
                        className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                      >
                        {resettingLearnerId === learner.id
                          ? "Resetting..."
                          : "Reset Password"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>


          {/* SELECTED CANDIDATE PROGRESS */}
          {selectedLearner && (
            <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

              <div className="flex flex-wrap items-center justify-between gap-5">
                <div>
                  <p className="text-xs font-bold tracking-[2px] text-emerald-700">
                    INDIVIDUAL PROGRESS
                  </p>

                  <h3 className="mt-2 text-2xl font-bold">
                    {selectedLearner.name || selectedLearner.displayName}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    {selectedLearner.email} · Cohort {selectedLearner.cohort}
                  </p>
                </div>

                <div className="grid h-24 w-24 place-items-center rounded-full border-[7px] border-emerald-100 bg-emerald-50 text-center">
                  <div>
                    <strong className="text-2xl text-emerald-700">
                      {percentage}%
                    </strong>
                    <p className="text-[10px] text-slate-500">Completed</p>
                  </div>
                </div>
              </div>

              {/* PROGRESS STATISTICS */}
              <div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  { label: "Total assigned", value: assignments.length },
                  { label: "Completed", value: completed },
                  { label: "In progress", value: inProgress },
                  { label: "Not started", value: notStarted },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl bg-slate-50 p-5"
                  >
                    <p className="text-2xl font-bold">{item.value}</p>
                    <p className="mt-2 text-xs text-slate-500">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* ASSIGNED ACTIVITIES */}
              <div className="mt-8 border-b border-slate-100 pb-4">
                <h3 className="text-xl font-bold">
                  Assigned learning activities
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Review and update this candidate's progress.
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search activities..."
                  className="min-w-[180px] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                >
                  <option value="ALL">All statuses</option>
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              {loadingAssignments ? (
                <p className="py-10 text-center text-sm text-slate-500">
                  Loading assigned activities...
                </p>
              ) : assignments.length === 0 ? (
                <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <p className="font-semibold">No training assigned yet.</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Assign a learning activity below.
                  </p>
                </div>
              ) : filteredAssignments.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  No matching activities found.
                </p>
              ) : (
                <div className="mt-5 space-y-3">
                  {filteredAssignments.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"
                    >
                      <div className="min-w-[180px] flex-1">
                        <p className="font-bold">
                          {item.activity?.title || "Learning activity"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {item.activity?.topic || "General topic"} ·{" "}
                          {item.activity?.plannedHours ?? 0} planned hours
                        </p>

                        <span
                          className={`mt-3 inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${
                            item.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700"
                              : item.status === "IN_PROGRESS"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {statusLabels[item.status] || "Not Started"}
                        </span>
                      </div>

                      <div>
                        <label
                          htmlFor={`status-${item.id}`}
                          className="mb-2 block text-xs font-semibold text-slate-500"
                        >
                          Update status
                        </label>

                        <select
                          id={`status-${item.id}`}
                          value={item.status || "NOT_STARTED"}
                          onChange={(e) =>
                            updateStatus(item.id, e.target.value)
                          }
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                        >
                          <option value="NOT_STARTED">Not Started</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ASSIGN ACTIVITY */}
              <div className="mt-8 rounded-2xl bg-gradient-to-r from-[#142C45] to-[#205C61] p-6 text-white">
                <p className="text-xs font-bold tracking-[2px] text-emerald-300">
                  ASSIGNMENT BUILDER
                </p>

                <h3 className="mt-2 text-xl font-bold">
                  Assign a learning activity
                </h3>

                <p className="mt-2 text-sm text-slate-200">
                  Select an existing activity for this candidate.
                </p>

                <form
                  onSubmit={assignActivity}
                  className="mt-5 flex flex-wrap gap-3"
                >
                  <select
                    value={selectedActivity}
                    onChange={(e) => setSelectedActivity(e.target.value)}
                    required
                    disabled={assigning || activities.length === 0}
                    className="min-w-[200px] flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#142C45]"
                  >
                    <option value="">Select a learning activity</option>

                    {activities.map((activity) => (
                      <option key={activity.id} value={activity.id}>
                        {activity.title} — {activity.plannedHours} hours
                      </option>
                    ))}
                  </select>

                  <button
                    type="submit"
                    disabled={assigning || activities.length === 0}
                    className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
                  >
                    {assigning ? "Assigning..." : "+ Assign activity"}
                  </button>
                </form>

                {activities.length === 0 && (
                  <p className="mt-3 text-xs text-amber-200">
                    No activities available. Create an activity first.
                  </p>
                )}
              </div>
            </section>
          )}

          {/* FOOTER */}
          <footer className="mt-8 flex flex-wrap justify-between gap-2 border-t border-slate-200 py-6 text-xs text-slate-400">
            <span>© 2026 EduFlow. Learn. Grow. Achieve.</span>
            <span>Candidate Management Workspace</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
