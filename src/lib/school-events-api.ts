import { getDefaultSchoolEvents, parseSchoolEvents } from "@/lib/school-events-storage";
import { type SchoolEvent } from "@/lib/deped-calendar";

async function parseResponse(response: Response): Promise<SchoolEvent[]> {
  const body = (await response.json()) as { events?: unknown; message?: string };
  if (!response.ok) {
    throw new Error(body.message ?? "Request failed.");
  }

  return parseSchoolEvents(body.events);
}

export async function loadSchoolEventsFromApi(): Promise<SchoolEvent[]> {
  try {
    const response = await fetch("/api/events", {
      cache: "no-store",
    });
    return await parseResponse(response);
  } catch {
    return getDefaultSchoolEvents();
  }
}

export async function saveSchoolEventsToApi(events: SchoolEvent[]): Promise<SchoolEvent[]> {
  const response = await fetch("/api/events", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ events }),
  });

  return parseResponse(response);
}

export async function resetSchoolEventsInApi(): Promise<SchoolEvent[]> {
  const response = await fetch("/api/events", {
    method: "DELETE",
  });

  return parseResponse(response);
}
