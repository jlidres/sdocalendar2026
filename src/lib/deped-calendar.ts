export type BlockType = "opening" | "instructional" | "end-of-term";

export type CalendarBlock = {
  label: string;
  type: BlockType;
  start: string;
  end: string;
};

export type SchoolTerm = {
  id: number;
  name: string;
  classDays: number;
  start: string;
  end: string;
  blocks: CalendarBlock[];
};

export type MajorBreak = {
  label: string;
  start: string;
  end: string;
};

export type NationalHoliday = {
  date: string;
  name: string;
  localName: string;
};

export type SchoolEvent = {
  start: string;
  end: string;
  title: string;
  notes?: string;
  date?: string;
};

export const DEPED_SY_2026_2027_TERMS: SchoolTerm[] = [
  {
    id: 1,
    name: "Term 1",
    classDays: 69,
    start: "2026-06-08",
    end: "2026-09-15",
    blocks: [
      {
        label: "Opening Block",
        type: "opening",
        start: "2026-06-08",
        end: "2026-06-11",
      },
      {
        label: "Instructional Block",
        type: "instructional",
        start: "2026-06-15",
        end: "2026-09-01",
      },
      {
        label: "End-of-Term Block",
        type: "end-of-term",
        start: "2026-09-02",
        end: "2026-09-15",
      },
    ],
  },
  {
    id: 2,
    name: "Term 2",
    classDays: 65,
    start: "2026-09-16",
    end: "2026-12-18",
    blocks: [
      {
        label: "Instructional Block",
        type: "instructional",
        start: "2026-09-16",
        end: "2026-12-06",
      },
      {
        label: "End-of-Term Block",
        type: "end-of-term",
        start: "2026-12-07",
        end: "2026-12-18",
      },
    ],
  },
  {
    id: 3,
    name: "Term 3",
    classDays: 67,
    start: "2027-01-04",
    end: "2027-04-08",
    blocks: [
      {
        label: "Instructional Block",
        type: "instructional",
        start: "2027-01-04",
        end: "2027-03-23",
      },
      {
        label: "End-of-Term Block",
        type: "end-of-term",
        start: "2027-03-24",
        end: "2027-04-08",
      },
    ],
  },
];

export const DEPED_SY_2026_2027_MAJOR_BREAKS: MajorBreak[] = [
  {
    label: "Year-End Break",
    start: "2026-12-19",
    end: "2027-01-03",
  },
  {
    label: "School Year End Break",
    start: "2027-04-09",
    end: "2027-06-07",
  },
];

export const PH_NATIONAL_HOLIDAYS_2026_2027: NationalHoliday[] = [
  {
    date: "2026-06-12",
    name: "Independence Day",
    localName: "Araw ng Kalayaan",
  },
  {
    date: "2026-08-21",
    name: "Ninoy Aquino Day",
    localName:
      "Araw ng Kamatayan ni Senador Benigno Simeon \"Ninoy\" Aquino Jr.",
  },
  {
    date: "2026-08-31",
    name: "National Heroes Day",
    localName: "Araw ng mga Bayani",
  },
  {
    date: "2026-10-31",
    name: "All Saints' Day Eve",
    localName: "All Saints' Day Eve",
  },
  {
    date: "2026-11-01",
    name: "All Saints' Day",
    localName: "Araw ng mga Santo",
  },
  {
    date: "2026-11-30",
    name: "Bonifacio Day",
    localName: "Araw ni Gat Andres Bonifacio",
  },
  {
    date: "2026-12-08",
    name: "Feast of the Immaculate Conception of Mary",
    localName: "Kapistahan ng Immaculada Concepcion",
  },
  {
    date: "2026-12-24",
    name: "Christmas Eve",
    localName: "Christmas Eve",
  },
  {
    date: "2026-12-25",
    name: "Christmas Day",
    localName: "Araw ng Pasko",
  },
  {
    date: "2026-12-30",
    name: "Rizal Day",
    localName: "Araw ng Kamatayan ni Dr. Jose Rizal",
  },
  {
    date: "2026-12-31",
    name: "Last Day of The Year",
    localName: "Huling Araw ng Taon",
  },
  {
    date: "2027-01-01",
    name: "New Year's Day",
    localName: "Bagong Taon",
  },
  {
    date: "2027-02-06",
    name: "Chinese New Year",
    localName: "Chinese New Year",
  },
  {
    date: "2027-03-25",
    name: "Maundy Thursday",
    localName: "Huwebes Santo",
  },
  {
    date: "2027-03-26",
    name: "Good Friday",
    localName: "Biyernes Santo",
  },
  {
    date: "2027-03-27",
    name: "Holy Saturday",
    localName: "Sabado de Gloria",
  },
  {
    date: "2027-04-09",
    name: "Day of Valor",
    localName: "Araw ng Kagitingan",
  },
];

export const SCHOOL_EVENTS_2026_2027: SchoolEvent[] = [
  {
    start: "2026-06-08",
    end: "2026-06-08",
    title: "First Day of Classes",
    notes: "SY 2026-2027 opening day",
  },
  {
    start: "2026-09-16",
    end: "2026-09-16",
    title: "Start of Term 2",
  },
  {
    start: "2027-01-04",
    end: "2027-01-04",
    title: "Start of Term 3",
  },
];

export const TOTAL_CLASS_DAYS = DEPED_SY_2026_2027_TERMS.reduce(
  (sum, term) => sum + term.classDays,
  0,
);
