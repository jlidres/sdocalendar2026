# Admin Guide

Admin UI route: `/admin`

## Login

Current built-in credentials in source:

- `cid / cid2026`
- `sgod / sgod2026`

> These credentials are currently client-visible and intended only for internal/demo usage.

## Admin Features

- View current activities
- Add new activities
- Delete activities
- Save all activities to PostgreSQL
- Reset activities to defaults
- Export activities as JSON
- Import activities from JSON

## JSON Import Expectations

Each activity should include:

- `start` (`YYYY-MM-DD`)
- `end` (`YYYY-MM-DD`) or legacy `date`
- `title`

Optional fields:

- `venue`
- `targetParticipants`
- `notes`

Invalid/empty entries are ignored during import.
