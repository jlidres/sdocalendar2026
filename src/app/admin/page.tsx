"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { type SchoolEvent } from "@/lib/deped-calendar";
import { getDefaultSchoolEvents } from "@/lib/school-events-storage";
import {
  loadSchoolEventsFromApi,
  resetSchoolEventsInApi,
  saveSchoolEventsToApi,
} from "@/lib/school-events-api";

const ADMIN_AUTH_KEY = "deped-admin-auth";
const ADMIN_USERS = [
  { username: "cid", password: "cid2026" },
  { username: "sgod", password: "sgod2026" },
];

function sortEvents(events: SchoolEvent[]) {
  return [...events].sort((a, b) => {
    const startDiff = a.start.localeCompare(b.start);
    if (startDiff !== 0) {
      return startDiff;
    }

    return a.end.localeCompare(b.end);
  });
}

function normalizeEventRange(event: SchoolEvent): SchoolEvent {
  const start = event.start;
  const end = event.end || event.start;

  if (start <= end) {
    return { ...event, start, end };
  }

  return { ...event, start: end, end: start };
}

function isISODate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseImportedEvents(value: unknown): SchoolEvent[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const parsed = value
    .map((item) => {
      if (typeof item !== "object" || item === null) {
        return null;
      }

      const candidate = item as Partial<SchoolEvent>;
      const start = isISODate(candidate.start)
        ? candidate.start
        : isISODate(candidate.date)
        ? candidate.date
        : null;
      const end = isISODate(candidate.end)
        ? candidate.end
        : isISODate(candidate.date)
        ? candidate.date
        : start;
      const title = typeof candidate.title === "string" ? candidate.title.trim() : "";

      if (!start || !end || !title) {
        return null;
      }

      return normalizeEventRange({
        start,
        end,
        title,
        notes: typeof candidate.notes === "string" ? candidate.notes.trim() || undefined : undefined,
      });
    })
    .filter((item): item is SchoolEvent => item !== null);

  return sortEvents(parsed);
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () =>
      typeof window !== "undefined" &&
      window.sessionStorage.getItem(ADMIN_AUTH_KEY) === "true",
  );
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");

  const [events, setEvents] = useState<SchoolEvent[]>(getDefaultSchoolEvents);
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusVariant, setStatusVariant] = useState<"success" | "error">("success");
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const canAdd = useMemo(
    () =>
      newStart.trim().length > 0 &&
      newEnd.trim().length > 0 &&
      newTitle.trim().length > 0 &&
      newStart <= newEnd,
    [newStart, newEnd, newTitle],
  );

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    void loadSchoolEventsFromApi().then((loaded) => {
      setEvents(loaded);
    });
  }, [isLoggedIn]);

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    const matchedUser = ADMIN_USERS.find(
      (account) => account.username === loginUser && account.password === loginPass,
    );

    if (matchedUser) {
      window.sessionStorage.setItem(ADMIN_AUTH_KEY, "true");
      setIsLoggedIn(true);
      setLoginError("");
      return;
    }

    setLoginError("Invalid admin credentials.");
  };

  const handleLogout = () => {
    window.sessionStorage.removeItem(ADMIN_AUTH_KEY);
    setIsLoggedIn(false);
    setLoginPass("");
    setStatusMessage("");
    setStatusVariant("success");
  };

  const saveAllEvents = async (nextEvents: SchoolEvent[], message: string) => {
    const sorted = sortEvents(nextEvents.map(normalizeEventRange));
    try {
      const saved = await saveSchoolEventsToApi(sorted);
      setEvents(saved);
      setStatusVariant("success");
      setStatusMessage(message);
    } catch (error) {
      setStatusVariant("error");
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to save activities to the database.",
      );
    }
  };

  const exportEvents = () => {
    const fileNameDate = new Date().toISOString().slice(0, 10);
    const payload = JSON.stringify(sortEvents(events), null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `deped-calendar-events-${fileNameDate}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
    setStatusVariant("success");
    setStatusMessage(`Exported ${events.length} activity/activities.`);
  };

  const importEvents = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const imported = parseImportedEvents(parsed);

      if (imported.length === 0) {
        setStatusVariant("error");
        setStatusMessage("Import failed: no valid activities found in the JSON file.");
      } else {
        await saveAllEvents(imported, `Imported ${imported.length} activity/activities.`);
      }
    } catch {
      setStatusVariant("error");
      setStatusMessage("Import failed: invalid JSON file.");
    } finally {
      event.target.value = "";
    }
  };

  const addEvent = () => {
    if (!canAdd) {
      return;
    }

    const nextEvents = [
      ...events,
      {
        start: newStart,
        end: newEnd,
        title: newTitle.trim(),
        notes: newNotes.trim() || undefined,
      },
    ];

    void saveAllEvents(nextEvents, "Activity added successfully.").then(() => {
      setNewStart("");
      setNewEnd("");
      setNewTitle("");
      setNewNotes("");
    });
  };

  const updateEvent = (index: number, patch: Partial<SchoolEvent>) => {
    const nextEvents = events.map((item, currentIndex) =>
      currentIndex === index ? { ...item, ...patch } : item,
    );
    setEvents(nextEvents);
  };

  const removeEvent = (index: number) => {
    const nextEvents = events.filter((_, currentIndex) => currentIndex !== index);
    void saveAllEvents(nextEvents, "Activity removed.");
  };

  const persistEdits = () => {
    const cleaned = events
      .map((event) => ({
        ...normalizeEventRange(event),
        title: event.title.trim(),
        notes: event.notes?.trim() || undefined,
      }))
      .filter((event) => event.start && event.end && event.title);

    void saveAllEvents(cleaned, "Changes saved.");
  };

  const resetToDefault = async () => {
    try {
      const defaults = await resetSchoolEventsInApi();
      setEvents(defaults);
      setStatusVariant("success");
      setStatusMessage("Activities reset to default DepEd list.");
    } catch (error) {
      setStatusVariant("error");
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to reset activities in the database.",
      );
    }
  };

  if (!isLoggedIn) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10 sm:px-6">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">Admin Login</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Sign in to manage custom calendar activities.
          </p>

          <form onSubmit={handleLogin} className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-800" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={loginUser}
                onChange={(event) => setLoginUser(event.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none ring-zinc-900/20 focus:ring"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-800" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={loginPass}
                onChange={(event) => setLoginPass(event.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none ring-zinc-900/20 focus:ring"
                required
              />
            </div>

            {loginError ? <p className="text-sm font-medium text-red-700">{loginError}</p> : null}

            <button
              type="submit"
              className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Sign In
            </button>
          </form>

          <p className="mt-4 text-xs text-zinc-500">
            Authorized accounts: cid and sgod.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Admin Activity Editor</h1>
            <p className="text-sm text-zinc-600">
              Add, edit, and remove date-range activities for the calendar.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/"
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              Back to Calendar
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              Log Out
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Add New Activity</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          <input
            type="date"
            value={newStart}
            onChange={(event) => setNewStart(event.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none ring-zinc-900/20 focus:ring"
            aria-label="Activity Start"
          />
          <input
            type="date"
            value={newEnd}
            onChange={(event) => setNewEnd(event.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none ring-zinc-900/20 focus:ring"
            aria-label="Activity End"
          />
          <input
            type="text"
            placeholder="Activity title"
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none ring-zinc-900/20 focus:ring"
          />
          <input
            type="text"
            placeholder="Notes (optional)"
            value={newNotes}
            onChange={(event) => setNewNotes(event.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none ring-zinc-900/20 focus:ring"
          />
          <button
            type="button"
            disabled={!canAdd}
            onClick={addEvent}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition enabled:hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            Add Activity
          </button>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Activity Start must be on or before Activity End.
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Edit Existing Activities</h2>
          <div className="flex gap-2">
            <input
              ref={importInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={importEvents}
            />
            <button
              type="button"
              onClick={exportEvents}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              Export JSON
            </button>
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              Import JSON
            </button>
            <button
              type="button"
              onClick={persistEdits}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => void resetToDefault()}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              Reset Defaults
            </button>
          </div>
        </div>

        {statusMessage ? (
          <p
            className={`mt-3 rounded-lg px-3 py-2 text-sm font-medium ${
              statusVariant === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {statusMessage}
          </p>
        ) : null}

        <div className="mt-4 space-y-3">
          {events.length === 0 ? (
            <p className="text-sm text-zinc-600">No activities found.</p>
          ) : (
            events.map((event, index) => (
              <article
                key={`${event.start}-${event.end}-${event.title}-${index}`}
                className="rounded-xl border border-zinc-200 p-3"
              >
                <div className="grid gap-2 md:grid-cols-[170px_170px_1fr_1fr_auto] md:items-center">
                  <input
                    type="date"
                    value={event.start}
                    onChange={(inputEvent) =>
                      updateEvent(index, { start: inputEvent.target.value })
                    }
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none ring-zinc-900/20 focus:ring"
                    aria-label="Activity Start"
                  />
                  <input
                    type="date"
                    value={event.end}
                    onChange={(inputEvent) =>
                      updateEvent(index, { end: inputEvent.target.value })
                    }
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none ring-zinc-900/20 focus:ring"
                    aria-label="Activity End"
                  />
                  <input
                    type="text"
                    value={event.title}
                    onChange={(inputEvent) =>
                      updateEvent(index, { title: inputEvent.target.value })
                    }
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none ring-zinc-900/20 focus:ring"
                  />
                  <input
                    type="text"
                    value={event.notes ?? ""}
                    onChange={(inputEvent) =>
                      updateEvent(index, {
                        notes: inputEvent.target.value || undefined,
                      })
                    }
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none ring-zinc-900/20 focus:ring"
                    placeholder="Notes (optional)"
                  />
                  <button
                    type="button"
                    onClick={() => removeEvent(index)}
                    className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
