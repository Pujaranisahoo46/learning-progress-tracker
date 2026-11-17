
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const API_URL = "http://https://learning-tracker-backend-91xm.onrender.com/api/v1";

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

export default function AssignmentsPage() {
  const [learners, setLearners] = useState([]);
  const [activities, setActivities] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [learnerId, setLearnerId] = useState("");
  const [activityId, setActivityId] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load candidates, activities and assignments
  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [learnersResponse, activitiesResponse, assignmentsResponse] =
        await Promise.all([
          fetch(`${API_URL}/learners`, {
            credentials: "include",
          }),
          fetch(`${API_URL}/activities`, {
            credentials: "include",
          }),
          fetch(`${API_URL}/assignments`, {
            credentials: "include",
          }),
        ]);

      const responses = [
        { response: learnersResponse, name: "candidates" },
        { response: activitiesResponse, name: "activities" },
        { response: assignmentsResponse, name: "assignments" },
      ];

      for (const item of responses) {
        if (item.response.status === 401) {
          throw new Error("Your session has expired. Please log in again.");
        }

        if (item.response.status === 403) {
          throw new Error(
            "You do not have permission to view assignment records."
          );
        }

        if (!item.response.ok) {
          throw new Error(
            `Could not load ${item.name}. Status: ${item.response.status}`
          );
        }
      }

      const [learnersData, activitiesData, assignmentsData] =
        await Promise.all([
          learnersResponse.json(),
          activitiesResponse.json(),
          assignmentsResponse.json(),
        ]);

      setLearners(Array.isArray(learnersData) ? learnersData : []);
      setActivities(Array.isArray(activitiesData) ? activitiesData : []);
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
    } catch (err) {
      if (err instanceof TypeError) {
        setError(
          "Cannot connect to the backend. Please make sure Spring Boot is running on port 8081."
        );
      } else {
        setError(err.message || "Could not load assignment data.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Assign an activity to a candidate
  async function handleAssign(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!learnerId || !activityId) {
      setError("Please select both a candidate and a learning activity.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/assignments`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          learnerId: Number(learnerId),
          activityId: Number(activityId),
        }),
      });

      if (response.status === 401) {
        throw new Error("Your session has expired. Please log in again.");
      }

      if (response.status === 403) {
        throw new Error("Only the Coordinator can assign activities.");
      }

      if (response.status === 409) {
        throw new Error(
          "This activity is already assigned to the selected candidate."
        );
      }

      if (!response.ok) {
        let message = `Assignment could not be saved. Status: ${response.status}`;

        try {
          const data = await response.json();
          message = data.message || message;
        } catch {
          // Use the default error message.
        }

        throw new Error(message);
      }

      setLearnerId("");
      setActivityId("");
      setSuccess("Learning activity assigned successfully!");

      await loadData();
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Cannot connect to the backend. Please check that Spring Boot is running."
          : err.message
      );
    } finally {
      setSaving(false);
    }
  }

  // Search and status filtering
  const filteredAssignments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return assignments.filter((assignment) => {
      const candidate = assignment.learner?.name || "";
      const email = assignment.learner?.email || "";
      const activity = assignment.activity?.title || "";
      const cohort = assignment.learner?.cohort || "";
      const status = assignment.status || "NOT_STARTED";

      const matchesSearch =
        candidate.toLowerCase().includes(term) ||
        email.toLowerCase().includes(term) ||
        activity.toLowerCase().includes(term) ||
        cohort.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "ALL" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [assignments, search, statusFilter]);

  // Assignment statistics
  const completed = assignments.filter(
    (item) => item.status === "COMPLETED"
  ).length;

  const inProgress = assignments.filter(
    (item) => item.status === "IN_PROGRESS"
  ).length;

  const notStarted = assignments.filter(
    (item) =>
      !item.status ||
      item.status === "NOT_STARTED"
  ).length;

  const completionRate = assignments.length
    ? Math.round((completed / assignments.length) * 100)
    : 0;

  // Logout
  async function logout() {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F7FA] text-[#142C45]">

      {/* Mobile menu overlay */}
      {mobileMenu && (
  <div
    className="fixed inset-0 z-40 bg-black/40"
    onClick={() => setMobileMenu(false)}
  />
)}

      {/* Navigation drawer */}
      <aside
     className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-[#142C45] text-white transition-transform duration-300 ${
    mobileMenu ? "translate-x-0" : "-translate-x-full"
  }`}
>
        {/* Brand */}
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

        {/* Navigation links */}
        <div className="px-6 pt-9">
          <p className="mb-4 text-[10px] font-bold tracking-[2px] text-slate-400">
            WORKSPACE
          </p>

          <nav className="space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenu(false)}
                className={`flex items-center gap-4 rounded-xl px-4 py-3.5 text-sm font-medium transition ${
                  item.href === "/assignments"
                    ? "bg-emerald-500 text-white shadow-lg"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="w-6 text-center text-xl">
                  {item.icon}
                </span>

                {item.label}

                {item.href === "/assignments" && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-white" />
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* Sidebar bottom */}
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

      {/* Main content */}
      <div className="min-h-screen">

        {/* Header */}
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
                Workspace / Assignments
              </p>
              <p className="text-sm font-bold">
                Assignment Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-emerald-500 hover:text-emerald-700 disabled:opacity-50 sm:px-4 sm:text-sm"
            >
              ↻ <span className="hidden sm:inline">Refresh</span>
            </button>

            <span className="hidden text-sm font-medium sm:block">
              Administrator
            </span>

            <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100 font-bold text-emerald-800">
              A
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1450px] p-5 sm:p-8">

          {/* Page heading */}
          <section className="mb-8 flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="text-xs font-bold tracking-[2px] text-emerald-700">
                EDUFLOW / ASSIGNMENT MANAGEMENT
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Assignments
              </h2>

              <p className="mt-3 text-sm text-slate-500 sm:text-base">
                Assign learning activities to candidates and monitor their progress.
              </p>
            </div>
          </section>

          {/* Error message */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <strong>Something went wrong</strong>
              <p className="mt-1">{error}</p>

              <button
                onClick={loadData}
                className="mt-3 font-bold underline"
              >
                Try again
              </button>

              {error.toLowerCase().includes("session") && (
                <Link
                  href="/login"
                  className="ml-4 font-bold underline"
                >
                  Go to login
                </Link>
              )}
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="mb-6 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
              <span>✓ {success}</span>

              <button
                onClick={() => setSuccess("")}
                className="ml-3 text-lg"
                aria-label="Dismiss success message"
              >
                ×
              </button>
            </div>
          )}

          {/* Statistics */}
          <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

            {[
              {
                label: "Total assignments",
                value: assignments.length,
                icon: "▣",
                color: "bg-blue-50 text-blue-700",
                detail: "All assigned activities",
              },
              {
                label: "Completed",
                value: completed,
                icon: "✓",
                color: "bg-emerald-50 text-emerald-700",
                detail: "Successfully completed",
              },
              {
                label: "In progress",
                value: inProgress,
                icon: "◷",
                color: "bg-purple-50 text-purple-700",
                detail: "Currently being worked on",
              },
              {
                label: "Not started",
                value: notStarted,
                icon: "○",
                color: "bg-amber-50 text-amber-700",
                detail: "Waiting to be started",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">
                    {item.label}
                  </p>

                  <div
                    className={`grid h-11 w-11 place-items-center rounded-xl text-xl ${item.color}`}
                  >
                    {item.icon}
                  </div>
                </div>

                <p className="mt-5 text-3xl font-bold">
                  {loading ? "—" : item.value}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  {item.detail}
                </p>
              </div>
            ))}
          </section>

          {/* Assignment form */}
          <section className="mb-8 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">

            <div className="bg-gradient-to-r from-[#142C45] to-[#205C61] px-6 py-6 text-white sm:px-8">
              <p className="text-xs font-bold tracking-[2px] text-emerald-300">
                ASSIGNMENT BUILDER
              </p>

              <h3 className="mt-2 text-2xl font-bold">
                Assign a learning activity
              </h3>

              <p className="mt-2 text-sm text-slate-200">
                Select a candidate and an existing activity to create an assignment.
              </p>
            </div>

            <form onSubmit={handleAssign} className="p-6 sm:p-8">
              <div className="grid gap-5 md:grid-cols-2">

                <div>
                  <label
                    htmlFor="candidate"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Select candidate
                  </label>

                  <select
                    id="candidate"
                    value={learnerId}
                    onChange={(e) => setLearnerId(e.target.value)}
                    required
                    disabled={loading || learners.length === 0 || saving}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-[#142C45] outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:opacity-60"
                  >
                    <option value="">Choose a candidate</option>

                    {learners.map((learner) => (
                      <option key={learner.id} value={learner.id}>
                        {learner.name || learner.displayName} — {learner.email}
                      </option>
                    ))}
                  </select>

                  {learners.length === 0 && !loading && (
                    <p className="mt-2 text-xs text-amber-600">
                      No candidates found. Please create a candidate first.
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="activity"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Select learning activity
                  </label>

                  <select
                    id="activity"
                    value={activityId}
                    onChange={(e) => setActivityId(e.target.value)}
                    required
                    disabled={loading || activities.length === 0 || saving}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-[#142C45] outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:opacity-60"
                  >
                    <option value="">Choose an activity</option>

                    {activities.map((activity) => (
                      <option key={activity.id} value={activity.id}>
                        {activity.title} — {activity.plannedHours} hours
                      </option>
                    ))}
                  </select>

                  {activities.length === 0 && !loading && (
                    <p className="mt-2 text-xs text-amber-600">
                      No activities found. Please create an activity first.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={
                    saving ||
                    loading ||
                    learners.length === 0 ||
                    activities.length === 0
                  }
                  className="rounded-xl bg-emerald-600 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Assigning..." : "+ Assign activity"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLearnerId("");
                    setActivityId("");
                    setError("");
                    setSuccess("");
                  }}
                  className="rounded-xl border border-slate-200 px-6 py-3.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Clear
                </button>
              </div>
            </form>
          </section>

          {/* Overall progress */}
          <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

            <div className="flex flex-wrap items-center justify-between gap-5">
              <div>
                <p className="text-xs font-bold tracking-[2px] text-emerald-700">
                  COHORT OVERVIEW
                </p>

                <h3 className="mt-2 text-xl font-bold">
                  Overall assignment progress
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Completion rate across all assigned learning activities.
                </p>
              </div>

              <div className="grid h-24 w-24 place-items-center rounded-full border-[7px] border-emerald-100 bg-emerald-50">
                <div className="text-center">
                  <strong className="text-2xl font-bold text-emerald-700">
                    {loading ? "—" : `${completionRate}%`}
                  </strong>
                  <p className="text-[10px] font-medium text-slate-500">
                    Completed
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-7 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>

            <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-slate-400">
              <span>{completed} completed assignments</span>
              <span>{assignments.length} total assignments</span>
            </div>
          </section>

          {/* Assignment records */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-6 sm:p-7">
              <div>
                <h3 className="text-xl font-bold">
                  Assignment records
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  View all candidate learning assignments and their current status.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">

                <div className="relative w-full sm:w-64">
                  <span className="absolute left-4 top-3 text-slate-400">
                    ⌕
                  </span>

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search assignments..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-[#142C45] outline-none transition focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[#142C45] outline-none focus:border-emerald-500 sm:w-44"
                >
                  <option value="ALL">All statuses</option>
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>

            <div className="p-6 sm:p-7">

              {loading ? (
                <div className="py-16 text-center text-sm text-slate-500">
                  Loading assignment records...
                </div>
              ) : assignments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-14 text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-100 text-3xl text-emerald-700">
                    ▣
                  </div>

                  <h4 className="mt-5 text-lg font-bold">
                    No assignments yet
                  </h4>

                  <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                    Select a candidate and a learning activity above to create your first assignment.
                  </p>
                </div>
              ) : filteredAssignments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-14 text-center">
                  <h4 className="text-lg font-bold">
                    No matching assignments
                  </h4>

                  <p className="mt-2 text-sm text-slate-500">
                    Try changing your search or status filter.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] tracking-wider text-slate-400">
                        <th className="px-4 py-4 font-bold">CANDIDATE</th>
                        <th className="px-4 py-4 font-bold">LEARNING ACTIVITY</th>
                        <th className="px-4 py-4 font-bold">COHORT</th>
                        <th className="px-4 py-4 font-bold">PLANNED HOURS</th>
                        <th className="px-4 py-4 font-bold">STATUS</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredAssignments.map((assignment) => {
                        const status =
                          assignment.status || "NOT_STARTED";

                        const candidateName =
                          assignment.learner?.name ||
                          assignment.learner?.displayName ||
                          "Candidate";

                        return (
                          <tr
                            key={assignment.id}
                            className="border-b border-slate-50 transition hover:bg-slate-50"
                          >
                            <td className="px-4 py-5">
                              <div className="flex items-center gap-3">
                                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-100 font-bold text-emerald-800">
                                  {candidateName.charAt(0).toUpperCase()}
                                </div>

                                <div>
                                  <p className="text-sm font-bold text-[#142C45]">
                                    {candidateName}
                                  </p>

                                  <p className="mt-1 text-xs text-slate-400">
                                    {assignment.learner?.email || ""}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-5">
                              <p className="text-sm font-semibold text-[#142C45]">
                                {assignment.activity?.title || "Activity"}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {assignment.activity?.topic || "Learning activity"}
                              </p>
                            </td>

                            <td className="px-4 py-5">
                              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                                {assignment.learner?.cohort || "—"}
                              </span>
                            </td>

                            <td className="px-4 py-5 text-sm font-medium text-slate-600">
                              {assignment.activity?.plannedHours ?? "—"} hours
                            </td>

                            <td className="px-4 py-5">
                              <span
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
                                  status === "COMPLETED"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : status === "IN_PROGRESS"
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                {statusLabels[status] || status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-400">
                <span>
                  Showing {filteredAssignments.length} of {assignments.length} assignments
                </span>

                <button
                  onClick={loadData}
                  disabled={loading}
                  className="font-semibold text-emerald-700 transition hover:text-emerald-900 disabled:opacity-50"
                >
                  ↻ Refresh records
                </button>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-8 flex flex-wrap justify-between gap-2 border-t border-slate-200 py-6 text-xs text-slate-400">
            <span>© 2026 EduFlow. Learn. Grow. Achieve.</span>
            <span>Assignment Management Workspace</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
