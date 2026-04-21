"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  DEPED_SY_2026_2027_TERMS,
  PH_NATIONAL_HOLIDAYS_2026_2027,
  TOTAL_CLASS_DAYS,
  type BlockType,
} from "@/lib/deped-calendar";
import { getDefaultSchoolEvents } from "@/lib/school-events-storage";
import { loadSchoolEventsFromApi } from "@/lib/school-events-api";

const DISPLAY_DATE = new Intl.DateTimeFormat("en-PH", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

const COUNTDOWN_DATE = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const MONTH_TITLE = new Intl.DateTimeFormat("en-PH", {
  month: "long",
  year: "numeric",
});

const EVENT_DATE = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const WEEKDAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseISODateToLocal(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isWithinDateRange(target: Date, start: Date, end: Date): boolean {
  return target >= start && target <= end;
}

function getTimeLeft(target: Date, now: Date) {
  const totalMs = target.getTime() - now.getTime();
  if (totalMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((totalMs / (1000 * 60)) % 60);
  const seconds = Math.floor((totalMs / 1000) % 60);

  return { days, hours, minutes, seconds };
}

const BLOCK_COLORS: Record<BlockType, string> = {
  opening: "bg-yellow-100 text-yellow-900 border-yellow-300",
  instructional: "bg-green-100 text-green-900 border-green-300",
  "end-of-term": "bg-orange-100 text-orange-900 border-orange-300",
};

const HOLIDAY_COLORS = "bg-red-100 text-red-900 border-red-300";
const EVENT_COLORS = "bg-blue-100 text-blue-900 border-blue-300";

export default function Home() {
  const [now, setNow] = useState(() => new Date("2026-01-01T00:00:00"));
  const [viewedMonth, setViewedMonth] = useState(() => new Date(2026, 0, 1));
  const [filters, setFilters] = useState<Record<BlockType, boolean>>({
    opening: true,
    instructional: true,
    "end-of-term": true,
  });
  const [showHolidays, setShowHolidays] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [schoolEvents, setSchoolEvents] = useState(getDefaultSchoolEvents);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const current = new Date();
      setNow(current);
      setViewedMonth(new Date(current.getFullYear(), current.getMonth(), 1));
    });

    void loadSchoolEventsFromApi().then((events) => {
      setSchoolEvents(events);
    });

    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.cancelAnimationFrame(frameId);
      clearInterval(timer);
    };
  }, []);

  const currentTerm = useMemo(() => {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return (
      DEPED_SY_2026_2027_TERMS.find((term) => {
        const start = parseISODateToLocal(term.start);
        const end = parseISODateToLocal(term.end);
        return isWithinDateRange(today, start, end);
      }) ?? null
    );
  }, [now]);

  const term1StartDate = useMemo(() => parseISODateToLocal("2026-06-08"), []);

  const countdown = useMemo(() => getTimeLeft(term1StartDate, now), [term1StartDate, now]);

  const parsedBlocks = useMemo(
    () =>
      DEPED_SY_2026_2027_TERMS.flatMap((term) =>
        term.blocks.map((block) => ({
          ...block,
          termName: term.name,
          startDate: parseISODateToLocal(block.start),
          endDate: parseISODateToLocal(block.end),
        })),
      ),
    [],
  );

  const monthLabel = useMemo(() => MONTH_TITLE.format(viewedMonth), [viewedMonth]);

  const monthCells = useMemo(() => {
    const year = viewedMonth.getFullYear();
    const month = viewedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const leadingEmpty = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const cells: Array<Date | null> = Array.from({ length: leadingEmpty }, () => null);

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(year, month, day));
    }

    const trailingEmpty = (7 - (cells.length % 7)) % 7;
    for (let i = 0; i < trailingEmpty; i += 1) {
      cells.push(null);
    }

    return cells;
  }, [viewedMonth]);

  const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

  const holidayLookup = useMemo(() => {
    const map = new Map<string, { name: string; localName: string }>();
    for (const holiday of PH_NATIONAL_HOLIDAYS_2026_2027) {
      map.set(holiday.date, { name: holiday.name, localName: holiday.localName });
    }
    return map;
  }, []);

  const eventLookup = useMemo(() => {
    return schoolEvents
      .map((event) => {
        const startRaw = event.start ?? event.date ?? "";
        const endRaw = event.end ?? event.date ?? "";
        if (!startRaw || !endRaw) {
          return null;
        }

        const startDate = parseISODateToLocal(startRaw);
        const endDate = parseISODateToLocal(endRaw);
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
          return null;
        }

        const [normalizedStart, normalizedEnd] =
          startDate.getTime() <= endDate.getTime()
            ? [startDate, endDate]
            : [endDate, startDate];

        return {
          title: event.title,
          notes: event.notes,
          startDate: normalizedStart,
          endDate: normalizedEnd,
        };
      })
      .filter((event): event is NonNullable<typeof event> => event !== null);
  }, [schoolEvents]);

  const listedEvents = useMemo(
    () =>
      [...eventLookup].sort(
        (a, b) => a.startDate.getTime() - b.startDate.getTime() || a.title.localeCompare(b.title),
      ),
    [eventLookup],
  );

  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10">
      <section className="rounded-3xl border border-white/50 bg-white/90 p-6 shadow-sm backdrop-blur-md sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-amber-700">
          DepED - SDO San Juan City
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 sm:text-4xl">
          School Calendar 2026-2027
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-zinc-700 sm:text-base">
          Interactive visualization of the DepED - SDO San Juan City
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Current Date
          </h2>
          <p className="mt-2 text-lg font-semibold text-zinc-900 sm:text-xl">
            {DISPLAY_DATE.format(now)}
          </p>
        </article>

        <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Active Term
          </h2>
          <p className="mt-2 text-lg font-semibold text-zinc-900 sm:text-xl">
            {currentTerm ? currentTerm.name : "Before SY 2026-2027 Start"}
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            {currentTerm
              ? `${currentTerm.classDays} class days in this term`
              : `Total school year class days: ${TOTAL_CLASS_DAYS}`}
          </p>
        </article>

        <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Countdown
          </h2>
          <p className="mt-2 text-sm font-medium text-zinc-700">
            Start of Term 1 ({COUNTDOWN_DATE.format(term1StartDate)})
          </p>
          <p className="mt-2 text-xl font-semibold text-zinc-900 sm:text-2xl">
            {countdown.days}d {countdown.hours}h {countdown.minutes}m {countdown.seconds}s
          </p>
        </article>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Block Filters</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Toggle calendar highlights by block classification.
        </p>

        <div className="mt-4 flex flex-nowrap gap-2 overflow-x-auto pb-1">
          {(
            [
              ["opening", "Opening (Yellow)"],
              ["instructional", "Instructional (Green)"],
              ["end-of-term", "End-of-Term (Orange)"],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2"
            >
              <span className="text-sm text-zinc-800">{label}</span>
              <input
                type="checkbox"
                checked={filters[key]}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, [key]: event.target.checked }))
                }
                className="h-4 w-4 accent-zinc-900"
                aria-label={label}
              />
            </label>
          ))}

          <label className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2">
            <span className="text-sm text-zinc-800">Holidays (Red)</span>
            <input
              type="checkbox"
              checked={showHolidays}
              onChange={(event) => setShowHolidays(event.target.checked)}
              className="h-4 w-4 accent-red-700"
              aria-label="Show National Holidays"
            />
          </label>

          <label className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2">
            <span className="text-sm text-zinc-800">Events (Blue)</span>
            <input
              type="checkbox"
              checked={showEvents}
              onChange={(event) => setShowEvents(event.target.checked)}
              className="h-4 w-4 accent-blue-700"
              aria-label="Show School Events"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Admin Controls</h2>
            <p className="text-sm text-zinc-600">
              Manage custom events from the admin page.
            </p>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Open Admin Event Editor
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">All School Events</h2>
          <p className="text-sm text-zinc-600">{listedEvents.length} total event(s)</p>
        </div>

        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Events are saved per browser origin. Data on localhost:3000 is separate from
          192.168.21.138:3000.
        </p>

        {listedEvents.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600">No school events found.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {listedEvents.map((item) => {
              const isSingleDay =
                item.startDate.getTime() === item.endDate.getTime();

              return (
                <article
                  key={`${item.title}-${item.startDate.toISOString()}-${item.endDate.toISOString()}`}
                  className="rounded-xl border border-zinc-200 px-3 py-2"
                >
                  <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
                  <p className="text-xs text-zinc-600">
                    {isSingleDay
                      ? EVENT_DATE.format(item.startDate)
                      : `${EVENT_DATE.format(item.startDate)} - ${EVENT_DATE.format(item.endDate)}`}
                  </p>
                  {item.notes ? (
                    <p className="mt-1 text-xs text-zinc-500">{item.notes}</p>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Current Month Calendar</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setViewedMonth(
                  (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                )
              }
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              aria-label="View previous month"
            >
              ←
            </button>
            <p className="min-w-36 text-center text-sm text-zinc-600">{monthLabel}</p>
            <button
              type="button"
              onClick={() =>
                setViewedMonth(
                  (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                )
              }
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              aria-label="View next month"
            >
              →
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-2">
          {WEEKDAY_HEADERS.map((dayName) => (
            <div
              key={dayName}
              className="rounded-lg bg-zinc-100 py-2 text-center text-xs font-semibold uppercase tracking-wide text-zinc-600"
            >
              {dayName}
            </div>
          ))}

          {monthCells.map((dateCell, index) => {
            if (!dateCell) {
              return (
                <div
                  key={`empty-${index}`}
                  className="min-h-20 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/60"
                />
              );
            }

            const matchedBlock = parsedBlocks.find(
              (block) =>
                filters[block.type] &&
                isWithinDateRange(dateCell, block.startDate, block.endDate),
            );

            const holiday = showHolidays
              ? holidayLookup.get(formatDateKey(dateCell)) ?? null
              : null;
            const matchedEvents = showEvents
              ? eventLookup.filter((item) =>
                  isWithinDateRange(dateCell, item.startDate, item.endDate),
                )
              : [];
            const hasEvents = matchedEvents.length > 0;
            const isWeekend = dateCell.getDay() === 0 || dateCell.getDay() === 6;

            const dateKey = `${dateCell.getFullYear()}-${dateCell.getMonth()}-${dateCell.getDate()}`;
            const isToday = dateKey === todayKey;

            return (
              <div
                key={dateCell.toISOString()}
                className={`min-h-20 rounded-lg border p-2 sm:min-h-24 ${
                  holiday
                    ? HOLIDAY_COLORS
                    : hasEvents
                    ? EVENT_COLORS
                    : isWeekend
                    ? "border-zinc-200 bg-white text-zinc-800"
                    : matchedBlock
                    ? BLOCK_COLORS[matchedBlock.type]
                    : "border-zinc-200 bg-white text-zinc-800"
                } ${isToday ? "ring-2 ring-zinc-900/70" : ""}`}
              >
                <div className="flex items-start justify-between gap-1">
                  <span className="text-sm font-semibold">{dateCell.getDate()}</span>
                  {isToday ? (
                    <span className="rounded-full bg-zinc-900 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      Today
                    </span>
                  ) : null}
                </div>

                {holiday ? (
                  <div>
                    <p className="mt-2 text-[11px] font-semibold leading-4 sm:text-xs">
                      Holiday: {holiday.name}
                    </p>
                    {hasEvents ? (
                      <div className="mt-1 space-y-1">
                        {matchedEvents.map((item) => (
                          <p
                            key={`${item.title}-${item.startDate.toISOString()}-${item.endDate.toISOString()}`}
                            className="text-[10px] leading-4 sm:text-[11px]"
                          >
                            Event: {item.title}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : hasEvents ? (
                  <div>
                    <div className="mt-2 space-y-1">
                      {matchedEvents.map((item) => (
                        <p
                          key={`${item.title}-${item.startDate.toISOString()}-${item.endDate.toISOString()}`}
                          className="text-[11px] font-semibold leading-4 sm:text-xs"
                        >
                          Event: {item.title}
                        </p>
                      ))}
                    </div>
                    {matchedBlock && !isWeekend ? (
                      <p className="mt-1 text-[10px] leading-4 sm:text-[11px]">
                        {matchedBlock.label}
                      </p>
                    ) : null}
                  </div>
                ) : matchedBlock && !isWeekend ? (
                  <p className="mt-2 text-[11px] font-medium leading-4 sm:text-xs">
                    {matchedBlock.label}
                  </p>
                ) : !isWeekend ? (
                  <p className="mt-2 text-[11px] leading-4 text-zinc-500 sm:text-xs">
                    No tagged block
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Term Blocks</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {DEPED_SY_2026_2027_TERMS.map((term) => (
            <article key={term.id} className="rounded-xl border border-zinc-200 p-4">
              <h3 className="text-base font-semibold text-zinc-900">{term.name}</h3>
              <p className="text-sm text-zinc-600">{term.classDays} class days</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {term.blocks
                  .filter((block) => filters[block.type])
                  .map((block) => (
                    <span
                      key={`${term.id}-${block.label}`}
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${BLOCK_COLORS[block.type]}`}
                    >
                      {block.label}
                    </span>
                  ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
