# DepEd Calendar

Next.js app for viewing and managing the school-year calendar with PostgreSQL-backed event storage.

## Prerequisites

- Node.js 20+
- PostgreSQL 14+

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and update `DATABASE_URL`.

3. Generate Prisma client and apply schema:

```bash
npm run prisma:generate
npm run prisma:push
```

4. Start the app:

```bash
npm run dev
```

App URLs:

- http://localhost:3000
- http://<your-lan-ip>:3000

## Database Notes

- Events are now stored in PostgreSQL, not browser localStorage.
- The API auto-seeds default DepEd events on first read when the table is empty.

## Useful Scripts

- `npm run dev` - start Next.js dev server
- `npm run build` - production build
- `npm run start` - run production server after build
- `npm run lint` - lint code
- `npm run verify:admin-save` - verify admin add/save persists to DB via `/api/events`
- `npm run prisma:generate` - regenerate Prisma client
- `npm run prisma:push` - push schema changes to DB without migration files
- `npm run prisma:migrate` - create/apply migration in development
- `npm run prisma:deploy` - apply existing Prisma migrations in production

### Pre-deploy Save Verification

Use this quick smoke test to verify the Admin "Add Event" flow really persists to PostgreSQL:

1. Ensure your app is running locally (`npm run dev`).
2. Ensure `DATABASE_URL` is set in your local `.env` file.
3. Run:

```bash
npm run verify:admin-save
```

The script will add a temporary test event through `/api/events`, verify it can be read back, then restore your original event list.

## Deploy Online (Vercel + Postgres)

This app uses Prisma with PostgreSQL, so you need a hosted Postgres database.

1. Create a hosted Postgres DB (Neon, Supabase, Railway, etc.) and copy the connection string.
2. In Vercel, import this repository as a new project.
3. Add environment variables in Vercel Project Settings:
	- `DATABASE_URL` = your hosted PostgreSQL connection string
	- `NEXT_PUBLIC_ADMIN_USERNAME` = admin username for `/admin`
	- `NEXT_PUBLIC_ADMIN_PASSWORD` = admin password for `/admin`
4. Deploy the project.
5. Apply the schema to production once by running from your machine:

```bash
npm run prisma:push
```

6. Re-deploy if needed, then open your Vercel URL.

### Important Security Note

`NEXT_PUBLIC_ADMIN_USERNAME` and `NEXT_PUBLIC_ADMIN_PASSWORD` are exposed to browser code by design (because of `NEXT_PUBLIC_`). This is convenient for demo/internal use but not secure for public internet admin auth.
