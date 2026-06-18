# Troubleshooting

## Build fails with Google Fonts fetch errors

In restricted or offline environments, Next.js build can fail when fetching Geist fonts from Google.

Typical error:

- `Failed to fetch Geist from Google Fonts`
- `Failed to fetch Geist Mono from Google Fonts`

This is an environment/network limitation, not necessarily an app logic issue.

## API returns database errors

Checklist:

1. Confirm `DATABASE_URL` is set.
2. Confirm PostgreSQL server is running and reachable.
3. Run:

   ```bash
   npm run prisma:generate
   npm run prisma:push
   ```

## Smoke tests fail

- Ensure app is running (`npm run dev`) before `npm run smoke`.
- If using a different base URL, set `APP_BASE_URL`.
- For deep smoke mode, ensure DB write access works (`SMOKE_DEEP=1 npm run smoke`).
