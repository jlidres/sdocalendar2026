import { SCHOOL_EVENTS_2026_2027, type SchoolEvent } from "@/lib/deped-calendar";

export const SCHOOL_EVENTS_STORAGE_KEY = "deped-calendar-events-v1";
export const SCHOOL_EVENTS_UPDATED_EVENT = "deped-calendar-events-updated";

function isSchoolEvent(value: unknown): value is SchoolEvent {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<SchoolEvent>;
  const hasRange =
    typeof candidate.start === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(candidate.start) &&
    typeof candidate.end === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(candidate.end);

  const hasLegacyDate =
    typeof candidate.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(candidate.date);

  return (
    (hasRange || hasLegacyDate) &&
    typeof candidate.title === "string" &&
    candidate.title.trim().length > 0 &&
    (typeof candidate.notes === "string" || typeof candidate.notes === "undefined")
  );
}

function normalizeSchoolEvent(event: SchoolEvent): SchoolEvent {
  const start = event.start ?? event.date ?? "";
  const end = event.end ?? event.date ?? start;

  const normalizedStart = start <= end ? start : end;
  const normalizedEnd = start <= end ? end : start;

  return {
    start: normalizedStart,
    end: normalizedEnd,
    title: event.title.trim(),
    notes: event.notes?.trim() || undefined,
  };
}

function sortByDate(events: SchoolEvent[]): SchoolEvent[] {
  return [...events].sort((a, b) => {
    const startDiff = a.start.localeCompare(b.start);
    if (startDiff !== 0) {
      return startDiff;
    }

    const endDiff = a.end.localeCompare(b.end);
    if (endDiff !== 0) {
      return endDiff;
    }

    return a.title.localeCompare(b.title);
  });
}

export function parseSchoolEvents(value: unknown): SchoolEvent[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const valid = value.filter(isSchoolEvent).map(normalizeSchoolEvent);
  return sortByDate(valid);
}

export function getDefaultSchoolEvents(): SchoolEvent[] {
  return sortByDate(SCHOOL_EVENTS_2026_2027.map(normalizeSchoolEvent));
}

export function loadSchoolEventsFromStorage(): SchoolEvent[] {
  if (typeof window === "undefined") {
    return getDefaultSchoolEvents();
  }

  const raw = window.localStorage.getItem(SCHOOL_EVENTS_STORAGE_KEY);
  if (!raw) {
    return getDefaultSchoolEvents();
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    const valid = parseSchoolEvents(parsed);
    if (valid.length === 0) {
      return getDefaultSchoolEvents();
    }

    return sortByDate(valid);
  } catch {
    return getDefaultSchoolEvents();
  }
}

export function saveSchoolEventsToStorage(events: SchoolEvent[]): void {
  if (typeof window === "undefined") {
    return;
  }

  const cleaned = parseSchoolEvents(events);
  window.localStorage.setItem(SCHOOL_EVENTS_STORAGE_KEY, JSON.stringify(cleaned));
  window.dispatchEvent(new Event(SCHOOL_EVENTS_UPDATED_EVENT));
}

export function resetSchoolEventsInStorage(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SCHOOL_EVENTS_STORAGE_KEY);
  window.dispatchEvent(new Event(SCHOOL_EVENTS_UPDATED_EVENT));
}
