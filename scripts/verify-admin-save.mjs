const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
const endpoint = `${baseUrl.replace(/\/$/, "")}/api/events`;

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  let body;
  try {
    body = await response.json();
  } catch {
    body = {};
  }

  if (!response.ok) {
    const message = typeof body?.message === "string" ? body.message : `HTTP ${response.status}`;
    throw new Error(message);
  }

  return body;
}

function eventExists(events, probe) {
  return events.some(
    (event) =>
      event.start === probe.start &&
      event.end === probe.end &&
      event.title === probe.title &&
      (event.notes ?? "") === (probe.notes ?? ""),
  );
}

async function main() {
  console.log(`[verify-admin-save] Using API: ${endpoint}`);

  const before = await request(endpoint, { method: "GET" });
  const originalEvents = Array.isArray(before.events) ? before.events : [];

  const marker = new Date().toISOString();
  const testEvent = {
    start: "2026-12-15",
    end: "2026-12-16",
    title: `Admin Save Test ${marker}`,
    notes: "Temporary verification event",
  };

  const nextEvents = [...originalEvents, testEvent];

  try {
    await request(endpoint, {
      method: "PUT",
      body: JSON.stringify({ events: nextEvents }),
    });

    const after = await request(endpoint, { method: "GET" });
    const savedEvents = Array.isArray(after.events) ? after.events : [];

    if (!eventExists(savedEvents, testEvent)) {
      throw new Error("Test event was not found after save.");
    }

    console.log("[verify-admin-save] PASS: Admin save flow persisted the test event.");
  } finally {
    await request(endpoint, {
      method: "PUT",
      body: JSON.stringify({ events: originalEvents }),
    });
    console.log("[verify-admin-save] Restored original events.");
  }
}

main().catch((error) => {
  console.error(`[verify-admin-save] FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
