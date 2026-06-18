# API Reference

Base route: `/api/events`

## GET /api/events

Returns all events, sorted by start date, end date, then title.

### Success Response

```json
{
  "events": [
    {
      "start": "2026-06-08",
      "end": "2026-06-08",
      "title": "First Day of Classes",
      "venue": "Optional",
      "targetParticipants": "Optional",
      "notes": "Optional"
    }
  ]
}
```

## PUT /api/events

Replaces the full event set in the database.

### Request Body

```json
{
  "events": [
    {
      "start": "2026-12-01",
      "end": "2026-12-01",
      "title": "Example Activity"
    }
  ]
}
```

### Validation Rules

- `events` must be an array
- each event requires valid ISO `YYYY-MM-DD` `start`/`end` (or legacy `date`)
- `title` must be non-empty
- ranges are normalized when `start > end`

Returns `400` when payload has no valid events.

## DELETE /api/events

Resets events to the default school-year list from `src/lib/deped-calendar.ts`.

## Error Responses

On failure, API returns:

```json
{ "message": "..." }
```

with appropriate HTTP status (typically `500`).
