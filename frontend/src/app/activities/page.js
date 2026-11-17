
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const API_URL = "https://learning-tracker-backend-91xm.onrender.com/api/v1/activities";

const navigation = [
  { label: "Overview", href: "/", icon: "⌂" },
  { label: "Activities", href: "/activities", icon: "▤" },
  { label: "Learners", href: "/learners", icon: "♙" },
  { label: "Assignments", href: "/assignments", icon: "▣" },
];

export default function ActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [plannedHours, setPlannedHours] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  async function loadActivities() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL, {
        method: "GET",
        credentials: "include",
      });

      if (response.status === 401) {
        throw new Error("Your session has expired. Please log in again.");
      }

      if (response.status === 403) {
        throw new Error("You do not have permission to manage activities.");
      }

      if (!response.ok) {
        throw new Error(`Could not load activities. Status: ${response.status}`);
      }

      const data = await response.json();
      setActivities(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err instanceof TypeError) {
        setError(
          "Cannot connect to the backend. Please make sure Spring Boot is running on port 8081."
        );
      } else {
        setError(err.message || "Could not load activities.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadActivities();
  }, []);

  function resetForm() {
    setTitle("");
    setTopic("");
    setPlannedHours("");
    setEditingId(null);
    setShowForm(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (Number(plannedHours) <= 0) {
      setError("Planned hours must be greater than zero.");
      return;
    }

    setSaving(true);

    const activity = {
      title: title.trim(),
      topic: topic.trim(),
      plannedHours: Number(plannedHours),
    };

    try {
      const response = await fetch(
        editingId ? `${API_URL}/${editingId}` : API_URL,
        {
          method: editingId ? "PUT" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(activity),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Please log in again.");
        }
        if (response.status === 403) {
          throw new Error("You do not have permission to save activities.");
        }
        throw new Error(`Unable to save activity. Status: ${response.status}`);
      }

      resetForm();

      setSuccess(
        editingId
          ? "Learning activity updated successfully!"
          : "New learning activity created successfully!"
      );

      await loadActivities();
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Cannot connect to the backend. Check that Spring Boot is running."
          : err.message
      );
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(activity) {
    setEditingId(activity.id);
    setTitle(activity.title);
    setTopic(activity.topic);
    setPlannedHours(String(activity.plannedHours));
    setShowForm(true);
    setError("");
    setSuccess("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this learning activity?"
    );

    if (!confirmed) return;

    setDeletingId(id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Unable to delete activity. Status: ${response.status}`);
      }

      setActivities((previous) =>
        previous.filter((activity) => activity.id !== id)
      );

      if (editingId === id) resetForm();

      setSuccess("Activity deleted successfully.");
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Cannot connect to the backend."
          : err.message
      );
    } finally {
      setDeletingId(null);
    }
  }

  const totalHours = activities.reduce(
    (total, activity) => total + Number(activity.plannedHours || 0),
    0
  );

  const filteredActivities = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return activities;

    return activities.filter(
      (activity) =>
        activity.title?.toLowerCase().includes(term) ||
        activity.topic?.toLowerCase().includes(term)
    );
  }, [activities, search]);

  return (
    <div className="min-h-screen bg-[#F4F7FA] text-[#142C45]">

      {mobileMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setMobileMenu(false)}
        />
      )}

      {/* Sidebar */}
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
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenu(false)}
                className={`flex items-center gap-4 rounded-xl px-4 py-3.5 text-sm font-medium transition ${
                  item.href === "/activities"
                    ? "bg-emerald-500 text-white shadow-lg"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="w-6 text-center text-xl">{item.icon}</span>
                {item.label}
                {item.href === "/activities" && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-white" />
                )}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-5">
          <div className="mb-5 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold">Learning matters</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Organize learning activities and build better training journeys.
            </p>
          </div>

          <Link
            href="/login"
            className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold text-red-300 hover:bg-red-500/10"
          >
            <span className="text-xl">↪</span>
            Back to login
          </Link>

          <p className="mt-5 px-4 text-[10px] text-slate-500">
            EDUFLOW © 2026
          </p>
        </div>
      </aside>

      {/* Main content */}
      <div className="min-h-screen">

        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
             className="rounded-lg border border-slate-200 px-3 py-2 text-xl"
              aria-label="Toggle navigation"
            >
              ☰
            </button>

            <div>
              <p className="text-xs text-slate-400">
                Workspace / Learning activities
              </p>
              <p className="text-sm font-bold">Activity Management</p>
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

          {/* Page heading */}
          <section className="mb-8 flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="text-xs font-bold tracking-[2px] text-emerald-700">
                EDUFLOW / ACTIVITY LIBRARY
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Learning Activities
              </h2>
              <p className="mt-3 text-sm text-slate-500 sm:text-base">
                Create, organize and manage your cohort's learning journey.
              </p>
            </div>

            <button
              onClick={() => {
                if (showForm && !editingId) {
                  resetForm();
                } else {
                  setEditingId(null);
                  setTitle("");
                  setTopic("");
                  setPlannedHours("");
                  setShowForm(true);
                  setSuccess("");
                  setError("");
                }
              }}
              className="rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/10 transition hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              + Create activity
            </button>
          </section>

          {/* Messages */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <strong>Something went wrong</strong>
              <p className="mt-1">{error}</p>
              <button
                onClick={loadActivities}
                className="mt-3 font-bold underline"
              >
                Try again
              </button>
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
              ✓ {success}
            </div>
          )}

          {/* Statistics */}
          <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              {
                label: "Total activities",
                value: activities.length,
                icon: "▤",
                color: "bg-blue-50 text-blue-700",
                detail: "Created in your library",
              },
              {
                label: "Planned learning hours",
                value: totalHours,
                icon: "◷",
                color: "bg-purple-50 text-purple-700",
                detail: "Combined activity duration",
              },
              {
                label: "Search results",
                value: filteredActivities.length,
                icon: "⌕",
                color: "bg-emerald-50 text-emerald-700",
                detail: "Matching activities",
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
                  <div className={`grid h-11 w-11 place-items-center rounded-xl text-xl ${item.color}`}>
                    {item.icon}
                  </div>
                </div>
                <p className="mt-5 text-3xl font-bold">{item.value}</p>
                <p className="mt-2 text-xs text-slate-400">{item.detail}</p>
              </div>
            ))}
          </section>

          {/* Create / Edit form */}
          {showForm && (
            <section className="mb-8 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
              <div className="bg-gradient-to-r from-[#142C45] to-[#205C61] px-6 py-6 text-white sm:px-8">
                <p className="text-xs font-bold tracking-[2px] text-emerald-300">
                  ACTIVITY BUILDER
                </p>
                <h3 className="mt-2 text-2xl font-bold">
                  {editingId ? "Update learning activity" : "Create a new activity"}
                </h3>
                <p className="mt-2 text-sm text-slate-200">
                  Enter the details of the learning activity below.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 sm:p-8">
                <div className="grid gap-5 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Activity title
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-[#142C45] outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                      placeholder="e.g. Java Programming"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Topic
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-[#142C45] outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                      placeholder="e.g. Core Java"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Planned hours
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-[#142C45] outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                      type="number"
                      min="1"
                      placeholder="e.g. 20"
                      value={plannedHours}
                      onChange={(e) => setPlannedHours(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mt-7 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-emerald-600 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                      ? "Save changes"
                      : "Create activity"}
                  </button>

                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-xl border border-slate-200 px-6 py-3.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Activity library */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-6 sm:p-7">
              <div>
                <h3 className="text-xl font-bold">Activity library</h3>
                <p className="mt-1 text-sm text-slate-400">
                  All learning activities available in EduFlow
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <span className="absolute left-4 top-3 text-slate-400">
                  ⌕
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search activities..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-[#142C45] outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="p-6 sm:p-7">
              {loading ? (
                <div className="py-16 text-center text-sm text-slate-500">
                  Loading your activity library...
                </div>
              ) : filteredActivities.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-14 text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-100 text-3xl text-emerald-700">
                    ▤
                  </div>
                  <h4 className="mt-5 text-lg font-bold">
                    {search ? "No matching activities" : "Your library is waiting"}
                  </h4>
                  <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                    {search
                      ? "Try searching with another title or topic."
                      : "Create your first learning activity to start building your training program."}
                  </p>

                  {!search && (
                    <button
                      onClick={() => setShowForm(true)}
                      className="mt-6 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700"
                    >
                      + Create first activity
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {filteredActivities.map((activity, index) => (
                    <article
                      key={activity.id}
                      className="group rounded-2xl border border-slate-200 bg-white p-5 transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 text-xl font-bold text-emerald-800">
                          {activity.title?.charAt(0)?.toUpperCase() || "A"}
                        </div>

                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                          ACTIVITY {index + 1}
                        </span>
                      </div>

                      <h4 className="mt-5 text-lg font-bold text-[#142C45]">
                        {activity.title}
                      </h4>

                      <p className="mt-2 text-sm text-slate-500">
                        {activity.topic}
                      </p>

                      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                        <div>
                          <p className="text-xs text-slate-400">
                            Planned duration
                          </p>
                          <p className="mt-1 font-bold text-[#142C45]">
                            {activity.plannedHours} hours
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(activity)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-emerald-500 hover:text-emerald-700"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleDelete(activity.id)}
                            disabled={deletingId === activity.id}
                            className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                          >
                            {deletingId === activity.id ? "..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          <footer className="mt-8 flex flex-wrap justify-between gap-2 border-t border-slate-200 py-6 text-xs text-slate-400">
            <span>© 2026 EduFlow. Learn. Grow. Achieve.</span>
            <span>Activity Management Workspace</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
