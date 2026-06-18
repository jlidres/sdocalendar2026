# Setup and Development

## Prerequisites

- Node.js 20+
- PostgreSQL 14+

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env` from `.env.example` and set `DATABASE_URL`.

3. Generate Prisma client and sync schema:

   ```bash
   npm run prisma:generate
   npm run prisma:push
   ```

4. Start development server:

   ```bash
   npm run dev
   ```

## Main Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — run production server
- `npm run lint` — run ESLint
- `npm run smoke` — quick smoke checks (app must already be running)
- `npm run verify:admin-save` — verify admin save persistence through API

## Database Commands

- `npm run prisma:generate` — regenerate Prisma client
- `npm run prisma:push` — push schema changes without migration files
- `npm run prisma:migrate` — create/apply development migrations
- `npm run prisma:deploy` — apply existing migrations in production
