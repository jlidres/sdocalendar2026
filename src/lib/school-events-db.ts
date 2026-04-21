import { type SchoolEvent } from "@/lib/deped-calendar";
import { SCHOOL_EVENTS_2026_2027 } from "@/lib/deped-calendar";
import { prisma } from "@/lib/prisma";

function isISODate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
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

export function getDefaultSchoolEvents(): SchoolEvent[] {
  return sortByDate(SCHOOL_EVENTS_2026_2027.map(normalizeSchoolEvent));
}

export function parseSchoolEvents(value: unknown): SchoolEvent[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const valid = value
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

      if (!start || !end || typeof candidate.title !== "string") {
        return null;
      }

      const normalized = normalizeSchoolEvent({
        start,
        end,
        title: candidate.title,
        notes: typeof candidate.notes === "string" ? candidate.notes : undefined,
      });

      if (!normalized.title) {
        return null;
      }

      return normalized;
    })
    .filter((event): event is SchoolEvent => event !== null);

  return sortByDate(valid);
}

async function seedDefaultsIfEmpty(): Promise<void> {
  const count = await prisma.schoolEvent.count();
  if (count > 0) {
    return;
  }

  const defaults = getDefaultSchoolEvents();
  await prisma.schoolEvent.createMany({
    data: defaults,
  });
}

export async function listSchoolEvents(): Promise<SchoolEvent[]> {
  await seedDefaultsIfEmpty();
  const rows = await prisma.schoolEvent.findMany({
    orderBy: [{ start: "asc" }, { end: "asc" }, { title: "asc" }],
  });

  return rows.map((row) => ({
    start: row.start,
    end: row.end,
    title: row.title,
    notes: row.notes ?? undefined,
  }));
}

export async function replaceSchoolEvents(events: SchoolEvent[]): Promise<SchoolEvent[]> {
  const cleaned = sortByDate(events.map(normalizeSchoolEvent));

  await prisma.$transaction([
    prisma.schoolEvent.deleteMany(),
    ...(cleaned.length > 0
      ? [
          prisma.schoolEvent.createMany({
            data: cleaned,
          }),
        ]
      : []),
  ]);

  return listSchoolEvents();
}

export async function resetSchoolEvents(): Promise<SchoolEvent[]> {
  return replaceSchoolEvents(getDefaultSchoolEvents());
}
