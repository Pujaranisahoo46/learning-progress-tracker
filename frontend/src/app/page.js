
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL = "http://https://learning-tracker-backend-91xm.onrender.com/api/v1";

export default function Home() {
  const router = useRouter();

  const [learners, setLearners] = useState([]);
  const [activities, setActivities] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Open sidebar by default on desktop.
  // Keep it closed by default on mobile.


  // Load dashboard data
  useEffect(() => {
    async function loadDashboard() {
      try {
        const responses = await Promise.all([
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

        const failed = responses.find(
          (response) => !response.ok
        );

        if (failed) {
          if (failed.status === 401) {
            router.replace("/login");
            return;
          }

          if (failed.status === 403) {
            throw new Error(
              "You do not have Coordinator access."
            );
          }

          throw new Error(
            `Dashboard request failed. Status: ${failed.status}`
          );
        }

        const [learnerData, activityData, assignmentData] =
          await Promise.all(
            responses.map((response) => response.json())
          );

        setLearners(
          Array.isArray(learnerData) ? learnerData : []
        );

        setActivities(
          Array.isArray(activityData) ? activityData : []
        );

        setAssignments(
          Array.isArray(assignmentData) ? assignmentData : []
        );
      } catch (err) {
        console.error("Dashboard loading error:", err);
        setError(
          err.message || "Could not load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  // Logout
  async function handleLogout() {
    setLoggingOut(true);

    try {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok && response.status !== 401) {
        throw new Error("Logout failed. Please try again.");
      }

      router.replace("/login");
    } catch (err) {
      setError(err.message);
      setLoggingOut(false);
    }
  }

  // Statistics
  const completedCount = assignments.filter(
    (item) => item.status === "COMPLETED"
  ).length;

  const inProgressCount = assignments.filter(
    (item) => item.status === "IN_PROGRESS"
  ).length;

  const notStartedCount = assignments.filter(
    (item) => item.status === "NOT_STARTED"
  ).length;

  const completionRate =
    assignments.length > 0
      ? Math.round(
          (completedCount / assignments.length) * 100
        )
      : 0;

  const stats = [
    {
      label: "Total Candidates",
      value: learners.length,
      icon: "♙",
      color: "bg-blue-50 text-blue-700",
      note: "Registered learners",
    },
    {
      label: "Learning Activities",
      value: activities.length,
      icon: "▤",
      color: "bg-purple-50 text-purple-700",
      note: "Available activities",
    },
    {
      label: "Total Assignments",
      value: assignments.length,
      icon: "▣",
      color: "bg-amber-50 text-amber-700",
      note: "Assigned activities",
    },
    {
      label: "Completed",
      value: completedCount,
      icon: "✓",
      color: "bg-emerald-50 text-emerald-700",
      note: `${completionRate}% completion rate`,
    },
  ];

  // Navigation
  const navigation = [
    { label: "Overview", href: "/", icon: "⌂" },
    { label: "Activities", href: "/activities", icon: "▤" },
    { label: "Learners", href: "/learners", icon: "♙" },
    { label: "Assignments", href: "/assignments", icon: "▣" },
  ];

  // Candidate progress
  function learnerProgress(learner) {
    const learnerAssignments = assignments.filter(
      (item) => item.learner?.id === learner.id
    );

    const completed = learnerAssignments.filter(
      (item) => item.status === "COMPLETED"
    ).length;

    return {
      total: learnerAssignments.length,
      completed,
      percentage:
        learnerAssignments.length > 0
          ? Math.round(
              (completed / learnerAssignments.length) * 100
            )
          : 0,
    };
  }

  const recentLearners = [...learners].slice(0, 5);

  return (
    <div className="min-h-screen bg-[#F4F7FA] text-[#142C45]">

      {/* Mobile sidebar overlay */}
      {/* Sidebar overlay */}
{sidebarOpen && (
  <button
    type="button"
    aria-label="Close navigation menu"
    className="fixed inset-0 z-40 bg-black/40"
    onClick={() => setSidebarOpen(false)}
  />
)}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] max-w-[96vw] flex-col bg-[#142C45] text-white shadow-xl transition-transform duration-300 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >

        {/* Brand */}
        <div className="flex h-24 shrink-0 items-center gap-4 border-b border-white/10 px-7">

          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-400 text-3xl font-bold text-[#142C45]">
            E
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              EduFlow
            </h1>

            <p className="mt-1 text-[12px] leading-4 tracking-[1.5px] text-emerald-300">
              LEARN. GROW. ACHIEVE.
            </p>
          </div>

        </div>

        {/* Navigation */}
        <div className="px-[30px] pt-10">

          <p className="mb-6 text-[11px] font-bold tracking-[1.8px] text-slate-400">
            WORKSPACE
          </p>

          <nav className="space-y-2.5">

            {navigation.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex min-h-[54px] items-center gap-4 rounded-[15px] px-5 py-4 text-[16px] font-medium transition ${
                  index === 0
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-900/20"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >

                <span className="flex h-6 w-6 shrink-0 items-center justify-center text-center text-xl">
                  {item.icon}
                </span>

                <span className="flex-1">
                  {item.label}
                </span>

                {index === 0 && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-white" />
                )}

              </Link>
            ))}

          </nav>
        </div>

        {/* Sidebar bottom */}
        <div className="mt-auto px-4 py-3.5">

          <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-5">

            <p className="text-sm font-semibold">
              Learning matters
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Empower every candidate to learn, grow and achieve their goals.
            </p>

          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            <span className="text-xl">↪</span>
            {loggingOut ? "Signing out..." : "Logout"}
          </button>

          <p className="mt-5 px-1 text-[10px] text-slate-500">
            EDUFLOW © 2026
          </p>

        </div>
      </aside>

      {/* Main area */}
      <div
        className={`min-h-screen transition-[margin] duration-300 ${
          sidebarOpen ? "lg:ml-[260px]" : "lg:ml-0"
        }`}
      >

        {/* Top navigation */}
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur sm:px-8">

          <div className="flex items-center gap-3">

            {/* Hamburger button - desktop and mobile */}
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-2xl text-[#142C45] shadow-sm transition hover:bg-slate-50"
              aria-label={
                sidebarOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              aria-expanded={sidebarOpen}
            >
              ☰
            </button>

            <div>
              <p className="text-xs text-slate-400">
                Workspace / Overview
              </p>

              <p className="text-sm font-bold text-[#142C45]">
                Admin Dashboard
              </p>
            </div>

          </div>

          <div className="flex items-center gap-3">

            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">
                Administrator
              </p>

              <p className="text-xs text-slate-400">
                Coordinator
              </p>
            </div>

            <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100 font-bold text-emerald-800">
              A
            </div>

          </div>

        </header>

        <main className="mx-auto max-w-[1500px] p-5 sm:p-8">

          {/* Welcome section */}
          <section className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-[#142C45] to-[#205C61] p-7 text-white shadow-xl sm:p-10">

            <div className="relative z-10 max-w-2xl">

              <p className="text-xs font-bold tracking-[2px] text-emerald-300">
                YOUR LEARNING WORKSPACE
              </p>

              <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
                Welcome to EduFlow
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200">
                Manage your candidates, organize learning activities and
                monitor training progress from one place.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">

                <Link
                  href="/learners"
                  className="rounded-lg bg-emerald-400 px-5 py-3 text-sm font-bold text-[#142C45] transition hover:bg-emerald-300"
                >
                  + Add candidate
                </Link>

                <Link
                  href="/activities"
                  className="rounded-lg border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Explore activities →
                </Link>

              </div>

            </div>

            <div className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full border-[35px] border-white/5" />

            <div className="pointer-events-none absolute -bottom-32 right-36 h-64 w-64 rounded-full bg-emerald-400/10 blur-2xl" />

          </section>

          {/* Loading and error states */}
          {loading ? (
            <div className="rounded-xl bg-white p-10 text-center text-slate-500 shadow-sm">
              Loading your dashboard...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">

              <p className="font-semibold">
                Dashboard could not load
              </p>

              <p className="mt-1 text-sm">
                {error}
              </p>

              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Try again
              </button>

            </div>
          ) : (
            <>

              {/* Statistics */}
              <section className="mb-8">

                <div className="mb-5 flex flex-wrap items-center justify-between gap-2">

                  <div>
                    <h3 className="text-xl font-bold">
                      Overview
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Your training platform at a glance
                    </p>
                  </div>

                  <span className="text-xs text-slate-400">
                    Live database statistics
                  </span>

                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

                  {stats.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                    >

                      <div className="flex items-center justify-between">

                        <span className="text-sm font-medium text-slate-500">
                          {item.label}
                        </span>

                        <span className={`grid h-11 w-11 place-items-center rounded-xl text-xl ${item.color}`}>
                          {item.icon}
                        </span>

                      </div>

                      <p className="mt-5 text-3xl font-bold tracking-tight">
                        {item.value}
                      </p>

                      <p className="mt-2 text-xs text-slate-400">
                        {item.note}
                      </p>

                    </div>
                  ))}

                </div>
              </section>

              {/* Main content grid */}
              <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_0.8fr]">

                {/* Candidate performance */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-6">

                    <div>
                      <h3 className="font-bold">
                        Candidate performance
                      </h3>

                      <p className="mt-1 text-xs text-slate-400">
                        Individual learning progress
                      </p>
                    </div>

                    <Link
                      href="/learners"
                      className="text-sm font-semibold text-emerald-700 hover:text-emerald-900"
                    >
                      View all →
                    </Link>

                  </div>

                  {learners.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-500">

                      No candidates have been added yet.

                      <div className="mt-3">
                        <Link
                          href="/learners"
                          className="font-semibold text-emerald-700"
                        >
                          Add your first candidate
                        </Link>
                      </div>

                    </div>
                  ) : (
                    <div className="overflow-x-auto">

                      <table className="w-full min-w-[550px] text-left text-sm">

                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                          <tr>
                            <th className="px-6 py-4">Candidate</th>
                            <th className="px-4 py-4">Cohort</th>
                            <th className="px-4 py-4">Progress</th>
                            <th className="px-6 py-4">Assigned</th>
                          </tr>
                        </thead>

                        <tbody>
                          {recentLearners.map((learner) => {
                            const progress = learnerProgress(learner);

                            return (
                              <tr
                                key={learner.id}
                                className="border-t border-slate-100 transition hover:bg-slate-50"
                              >

                                <td className="px-6 py-4">

                                  <div className="flex items-center gap-3">

                                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-100 font-bold text-emerald-800">
                                      {(learner.name || "?").charAt(0).toUpperCase()}
                                    </div>

                                    <div>
                                      <p className="font-semibold text-[#142C45]">
                                        {learner.name}
                                      </p>

                                      <p className="mt-1 text-xs text-slate-400">
                                        {learner.email}
                                      </p>
                                    </div>

                                  </div>

                                </td>

                                <td className="px-4 py-4 text-slate-500">
                                  {learner.cohort}
                                </td>

                                <td className="px-4 py-4">

                                  <div className="flex items-center gap-2">

                                    <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                                      <div
                                        className="h-full rounded-full bg-emerald-500"
                                        style={{
                                          width: `${progress.percentage}%`,
                                        }}
                                      />
                                    </div>

                                    <span className="text-xs font-semibold">
                                      {progress.percentage}%
                                    </span>

                                  </div>

                                </td>

                                <td className="px-6 py-4 font-medium">
                                  {progress.total}
                                </td>

                              </tr>
                            );
                          })}
                        </tbody>

                      </table>

                    </div>
                  )}

                </div>

                {/* Progress summary */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                  <h3 className="font-bold">
                    Learning progress
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    Overall assignment status
                  </p>

                  <div className="mt-8 flex items-center justify-center">

                    <div
                      className="grid h-40 w-40 place-items-center rounded-full"
                      style={{
                        background: `conic-gradient(#16866B ${
                          completionRate * 3.6
                        }deg, #E8EEF2 0deg)`,
                      }}
                    >

                      <div className="grid h-32 w-32 place-items-center rounded-full bg-white">

                        <div className="text-center">

                          <p className="text-3xl font-bold">
                            {completionRate}%
                          </p>

                          <p className="text-xs text-slate-400">
                            Completed
                          </p>

                        </div>

                      </div>

                    </div>

                  </div>

                  <div className="mt-8 space-y-5">

                    {[
                      {
                        label: "Completed",
                        count: completedCount,
                        color: "bg-emerald-500",
                      },
                      {
                        label: "In progress",
                        count: inProgressCount,
                        color: "bg-blue-500",
                      },
                      {
                        label: "Not started",
                        count: notStartedCount,
                        color: "bg-slate-400",
                      },
                    ].map((item) => (
                      <div key={item.label}>

                        <div className="mb-2 flex justify-between text-sm">
                          <span className="text-slate-600">
                            {item.label}
                          </span>

                          <strong>{item.count}</strong>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${item.color}`}
                            style={{
                              width: `${
                                assignments.length
                                  ? (item.count / assignments.length) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>

                      </div>
                    ))}

                  </div>

                </div>

              </section>

              {/* Learning activities */}
              <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-6">

                  <div>
                    <h3 className="font-bold">
                      Learning activities
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      Activities available in EduFlow
                    </p>
                  </div>

                  <Link
                    href="/activities"
                    className="rounded-lg bg-[#142C45] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#205C61]"
                  >
                    Manage activities →
                  </Link>

                </div>

                {activities.length === 0 ? (
                  <p className="p-6 text-sm text-slate-500">
                    No learning activities available.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">

                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40"
                      >

                        <div className="flex items-center gap-3">

                          <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-100 text-lg text-purple-700">
                            ▤
                          </div>

                          <div>
                            <p className="font-semibold">
                              {activity.title}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {activity.topic}
                            </p>
                          </div>

                        </div>

                        <div className="mt-4 flex justify-between border-t border-slate-200 pt-3 text-xs text-slate-500">
                          <span>Planned duration</span>
                          <strong>{activity.plannedHours} hours</strong>
                        </div>

                      </div>
                    ))}

                  </div>
                )}

              </section>

              {/* Footer */}
              <footer className="mt-8 flex flex-wrap justify-between gap-2 border-t border-slate-200 py-6 text-xs text-slate-400">

                <span>
                  © 2026 EduFlow. Learn. Grow. Achieve.
                </span>

                <span>
                  Coordinator Workspace
                </span>

              </footer>

            </>
          )}

        </main>
      </div>
    </div>
  );
}
