import { NextResponse } from "next/server";
import {
  listSchoolEvents,
  parseSchoolEvents,
  replaceSchoolEvents,
  resetSchoolEvents,
} from "@/lib/school-events-db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const events = await listSchoolEvents();
    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to load events from the database.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { events?: unknown };
    const events = parseSchoolEvents(body.events ?? []);

    if (events.length === 0) {
      return NextResponse.json(
        { message: "No valid events found in request payload." },
        { status: 400 },
      );
    }

    const saved = await replaceSchoolEvents(events);
    return NextResponse.json({ events: saved });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to save events to the database.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const events = await resetSchoolEvents();
    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to reset events in the database.",
      },
      { status: 500 },
    );
  }
}
