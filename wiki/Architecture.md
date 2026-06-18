# Architecture

## High-Level Design

The app uses a Next.js App Router frontend and backend API route in one codebase.

- UI pages in `src/app/*`
- API endpoint in `src/app/api/events/route.ts`
- Shared domain/data logic in `src/lib/*`
- Database schema in `prisma/schema.prisma`

## Main Modules

- `src/app/page.tsx`
  - Public calendar dashboard
  - Renders school terms, blocks, holidays, and events

- `src/app/admin/page.tsx`
  - Admin authentication (sessionStorage)
  - Event CRUD flows + import/export JSON

- `src/app/api/events/route.ts`
  - `GET`: list events
  - `PUT`: replace all events from request payload
  - `DELETE`: reset to defaults

- `src/lib/school-events-db.ts`
  - Event parsing/normalization
  - Sorting and validation
  - DB read/write and default seeding

- `src/lib/deped-calendar.ts`
  - Static school-term, holiday, and default-event data

## Data Model

`SchoolEvent` table (`prisma/schema.prisma`):

- `id` (cuid primary key)
- `start`, `end` (ISO 8601 date-only strings, `YYYY-MM-DD`)
- `title`
- optional: `venue`, `targetParticipants`, `notes`
- timestamps: `createdAt`, `updatedAt`

Unique key: `start + end + title`
