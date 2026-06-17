const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
const normalizedBase = baseUrl.replace(/\/$/, "");

async function checkHome() {
  const response = await fetch(`${normalizedBase}/`, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Homepage check failed with HTTP ${response.status}`);
  }

  const html = await response.text();
  if (!html || !html.includes("DepEd")) {
    throw new Error("Homepage check failed: expected page content was not found.");
  }

  console.log(`[smoke] PASS: homepage reachable (${response.status}).`);
}

async function checkEventsApi() {
  const response = await fetch(`${normalizedBase}/api/events`, { method: "GET" });
  if (!response.ok) {
    throw new Error(`/api/events check failed with HTTP ${response.status}`);
  }

  const body = await response.json();
  if (!body || !Array.isArray(body.events)) {
    throw new Error("/api/events check failed: response did not include an events array.");
  }

  console.log(`[smoke] PASS: /api/events reachable (${response.status}), events=${body.events.length}.`);
}

async function runDeepCheck() {
  if (process.env.SMOKE_DEEP !== "1") {
    return;
  }

  const childProcess = await import("node:child_process");
  const result = childProcess.spawnSync("node", ["scripts/verify-admin-save.mjs"], {
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error("Deep smoke check failed (verify-admin-save).");
  }

  console.log("[smoke] PASS: deep save verification passed.");
}

async function main() {
  console.log(`[smoke] Using app base URL: ${normalizedBase}`);
  await checkHome();
  await checkEventsApi();
  await runDeepCheck();
  console.log("[smoke] PASS: smoke test completed.");
}

main().catch((error) => {
  console.error(`[smoke] FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
