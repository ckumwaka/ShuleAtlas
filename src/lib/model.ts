export const COUNTIES = [
  "Baringo",
  "Bomet",
  "Bungoma",
  "Busia",
  "Elgeyo-Marakwet",
  "Embu",
  "Garissa",
  "Homa Bay",
  "Isiolo",
  "Kajiado",
  "Kakamega",
  "Kericho",
  "Kiambu",
  "Kilifi",
  "Kirinyaga",
  "Kisii",
  "Kisumu",
  "Kitui",
  "Kwale",
  "Laikipia",
  "Lamu",
  "Machakos",
  "Makueni",
  "Mandera",
  "Marsabit",
  "Meru",
  "Migori",
  "Mombasa",
  "Murang'a",
  "Nairobi",
  "Nakuru",
  "Nandi",
  "Narok",
  "Nyamira",
  "Nyandarua",
  "Nyeri",
  "Samburu",
  "Siaya",
  "Taita-Taveta",
  "Tana River",
  "Tharaka-Nithi",
  "Trans Nzoia",
  "Turkana",
  "Uasin Gishu",
  "Vihiga",
  "Wajir",
  "West Pokot",
] as const;

export type Level = "primary" | "secondary";
export type Ownership = "public" | "private" | "faith";
export type Origin = "catalogue" | "field";
export type Band = "steady" | "strained" | "critical";

export type Resources = {
  electricity: boolean;
  pipedWater: boolean;
  internet: boolean;
  library: boolean;
  scienceLab: boolean;
  computerLab: boolean;
  feeding: boolean;
};

export type School = {
  id: string;
  name: string;
  county: string;
  subCounty: string;
  level: Level;
  ownership: Ownership;
  lat: number;
  lng: number;
  enrollment: number;
  teachers: number;
  classrooms: number;
  textbooksPerPupil: number;
  toilets: number;
  desks: number;
  resources: Resources;
  notes: string;
  origin: Origin;
  loggedAt?: string;
};

export type GapKey =
  | "ptr"
  | "classrooms"
  | "books"
  | "toilets"
  | "desks"
  | "electricity"
  | "pipedWater"
  | "internet"
  | "library"
  | "scienceLab"
  | "computerLab"
  | "feeding";

export type Gap = { key: GapKey; label: string; detail: string };

export type ScorePart = {
  key: GapKey;
  label: string;
  score: number;
  weight: number;
  applies: boolean;
  detail: string;
  kind: "ratio" | "facility";
};

export type ScoredSchool = School & {
  index: number;
  band: Band;
  parts: ScorePart[];
  gaps: Gap[];
  ptr: number;
  pupilsPerClass: number;
  pupilsPerToilet: number | null;
  desksPerPupil: number;
};

export type Filters = {
  query: string;
  county: string;
  level: "all" | Level;
  ownership: "all" | Ownership;
  band: "all" | Band;
  gap: "all" | GapKey;
  sort: "index-asc" | "index-desc" | "name" | "enrollment";
};

export const INITIAL_FILTERS: Filters = {
  query: "",
  county: "",
  level: "all",
  ownership: "all",
  band: "all",
  gap: "all",
  sort: "index-asc",
};

export const BAND_LABEL: Record<Band, string> = {
  steady: "Steady",
  strained: "Strained",
  critical: "Critical",
};

export const LEVEL_LABEL: Record<Level, string> = {
  primary: "Primary",
  secondary: "Secondary",
};

export const OWNERSHIP_LABEL: Record<Ownership, string> = {
  public: "Public",
  private: "Private",
  faith: "Faith",
};

export const GAP_OPTIONS: Array<{ value: Filters["gap"]; label: string }> = [
  { value: "all", label: "Any facility focus" },
  { value: "electricity", label: "No electricity" },
  { value: "pipedWater", label: "No safe water" },
  { value: "ptr", label: "Teacher shortfall" },
  { value: "classrooms", label: "Crowded classrooms" },
  { value: "books", label: "Textbook shortfall" },
  { value: "toilets", label: "Toilet shortfall" },
  { value: "desks", label: "Desk shortage" },
  { value: "scienceLab", label: "No science lab" },
  { value: "computerLab", label: "No computer lab" },
  { value: "library", label: "No library" },
  { value: "internet", label: "No internet" },
  { value: "feeding", label: "No school meals" },
];

export const SORT_OPTIONS: Array<{ value: Filters["sort"]; label: string }> = [
  { value: "index-asc", label: "Greatest need" },
  { value: "index-desc", label: "Strongest index" },
  { value: "name", label: "Name" },
  { value: "enrollment", label: "Enrollment" },
];

const PTR_PRIMARY = 40;
const PTR_SECONDARY = 35;
const CLASS_TARGET = 45;
const BOOK_TARGET = 1;
const TOILET_TARGET = 30;
const DESK_TARGET = 0.5;

export function ptrTarget(level: Level) {
  return level === "secondary" ? PTR_SECONDARY : PTR_PRIMARY;
}

export function bandFor(index: number): Band {
  if (index >= 75) return "steady";
  if (index >= 50) return "strained";
  return "critical";
}

export function formatNum(value: number) {
  return new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(value);
}

export function formatRatio(value: number) {
  return new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function lowerIsBetter(actual: number, target: number) {
  if (!Number.isFinite(actual) || actual <= 0) return 0;
  if (actual <= target) return 1;
  return Math.max(0, 1 - (actual - target) / target);
}

function higherIsBetter(actual: number, target: number) {
  if (!Number.isFinite(actual) || target <= 0) return 0;
  return Math.max(0, Math.min(1, actual / target));
}

function facility(on: boolean) {
  return on ? 1 : 0;
}

export function scoreSchool(school: School): ScoredSchool {
  const ptr = school.enrollment / school.teachers;
  const pupilsPerClass = school.enrollment / school.classrooms;
  const pupilsPerToilet = school.toilets > 0 ? school.enrollment / school.toilets : null;
  const desksPerPupil = school.desks / school.enrollment;
  const teacherLine = ptrTarget(school.level);
  const scienceApplies = school.level === "secondary";

  const parts: ScorePart[] = [
    {
      key: "ptr",
      label: "Teachers",
      kind: "ratio",
      weight: 18,
      applies: true,
      score: lowerIsBetter(ptr, teacherLine),
      detail: `${formatRatio(ptr)} learners per teacher · line ${teacherLine}`,
    },
    {
      key: "classrooms",
      label: "Classrooms",
      kind: "ratio",
      weight: 14,
      applies: true,
      score: lowerIsBetter(pupilsPerClass, CLASS_TARGET),
      detail: `${formatRatio(pupilsPerClass)} learners per room · line ${CLASS_TARGET}`,
    },
    {
      key: "books",
      label: "Textbooks",
      kind: "ratio",
      weight: 14,
      applies: true,
      score: higherIsBetter(school.textbooksPerPupil, BOOK_TARGET),
      detail: `${school.textbooksPerPupil.toFixed(2)} core books per learner · line 1.00`,
    },
    {
      key: "toilets",
      label: "Toilets",
      kind: "ratio",
      weight: 14,
      applies: true,
      score: pupilsPerToilet == null ? 0 : lowerIsBetter(pupilsPerToilet, TOILET_TARGET),
      detail:
        pupilsPerToilet == null
          ? "No toilets recorded · line 30 learners each"
          : `${formatRatio(pupilsPerToilet)} learners per toilet · line ${TOILET_TARGET}`,
    },
    {
      key: "desks",
      label: "Desks",
      kind: "ratio",
      weight: 4,
      applies: true,
      score: higherIsBetter(desksPerPupil, DESK_TARGET),
      detail: `${formatRatio(desksPerPupil)} desks per learner · line 0.5`,
    },
    {
      key: "electricity",
      label: "Electricity",
      kind: "facility",
      weight: 8,
      applies: true,
      score: facility(school.resources.electricity),
      detail: school.resources.electricity ? "On site" : "Not recorded",
    },
    {
      key: "pipedWater",
      label: "Safe water",
      kind: "facility",
      weight: 8,
      applies: true,
      score: facility(school.resources.pipedWater),
      detail: school.resources.pipedWater ? "On site" : "Not recorded",
    },
    {
      key: "internet",
      label: "Internet",
      kind: "facility",
      weight: 4,
      applies: true,
      score: facility(school.resources.internet),
      detail: school.resources.internet ? "On site" : "Not recorded",
    },
    {
      key: "library",
      label: "Library",
      kind: "facility",
      weight: 4,
      applies: true,
      score: facility(school.resources.library),
      detail: school.resources.library ? "On site" : "Not recorded",
    },
    {
      key: "scienceLab",
      label: "Science lab",
      kind: "facility",
      weight: 5,
      applies: scienceApplies,
      score: facility(school.resources.scienceLab),
      detail: scienceApplies
        ? school.resources.scienceLab
          ? "On site"
          : "Not recorded"
        : "Not scored for primary",
    },
    {
      key: "computerLab",
      label: "Computer lab",
      kind: "facility",
      weight: 4,
      applies: true,
      score: facility(school.resources.computerLab),
      detail: school.resources.computerLab ? "On site" : "Not recorded",
    },
    {
      key: "feeding",
      label: "School meals",
      kind: "facility",
      weight: 3,
      applies: true,
      score: facility(school.resources.feeding),
      detail: school.resources.feeding ? "Programme recorded" : "Not recorded",
    },
  ];

  const applicable = parts.filter((part) => part.applies);
  const weight = applicable.reduce((sum, part) => sum + part.weight, 0);
  const earned = applicable.reduce((sum, part) => sum + part.weight * part.score, 0);
  const index = weight === 0 ? 0 : Math.round((earned / weight) * 100);

  const gaps: Gap[] = applicable
    .filter((part) => part.score < 0.999)
    .map((part) => ({ key: part.key, label: part.label, detail: part.detail }));

  return {
    ...school,
    index,
    band: bandFor(index),
    parts,
    gaps,
    ptr,
    pupilsPerClass,
    pupilsPerToilet,
    desksPerPupil,
  };
}

export function matchesSchool(school: ScoredSchool, filters: Filters, ignoreBand = false) {
  const query = filters.query.trim().toLowerCase();
  if (query) {
    const blob = `${school.name} ${school.county} ${school.subCounty}`.toLowerCase();
    if (!blob.includes(query)) return false;
  }
  if (filters.county && school.county !== filters.county) return false;
  if (filters.level !== "all" && school.level !== filters.level) return false;
  if (filters.ownership !== "all" && school.ownership !== filters.ownership) return false;
  if (!ignoreBand && filters.band !== "all" && school.band !== filters.band) return false;
  if (filters.gap !== "all" && !school.gaps.some((gap) => gap.key === filters.gap)) return false;
  return true;
}

export function sortSchools(schools: ScoredSchool[], sort: Filters["sort"]) {
  const next = [...schools];
  next.sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "enrollment") return b.enrollment - a.enrollment || a.name.localeCompare(b.name);
    if (sort === "index-desc") return b.index - a.index || a.name.localeCompare(b.name);
    return a.index - b.index || a.name.localeCompare(b.name);
  });
  return next;
}

export function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid] ?? 0;
  return Math.round(((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2);
}

export type CountyRollup = {
  county: string;
  schools: number;
  enrollment: number;
  index: number;
  band: Band;
  critical: number;
};

export function countyRollup(schools: ScoredSchool[]): CountyRollup[] {
  const buckets = new Map<string, { schools: number; enrollment: number; weighted: number; critical: number }>();
  for (const school of schools) {
    const bucket = buckets.get(school.county) ?? { schools: 0, enrollment: 0, weighted: 0, critical: 0 };
    bucket.schools += 1;
    bucket.enrollment += school.enrollment;
    bucket.weighted += school.index * school.enrollment;
    if (school.band === "critical") bucket.critical += 1;
    buckets.set(school.county, bucket);
  }
  return [...buckets.entries()]
    .map(([county, bucket]) => {
      const index = bucket.enrollment === 0 ? 0 : Math.round(bucket.weighted / bucket.enrollment);
      return {
        county,
        schools: bucket.schools,
        enrollment: bucket.enrollment,
        index,
        band: bandFor(index),
        critical: bucket.critical,
      };
    })
    .sort((a, b) => a.index - b.index || a.county.localeCompare(b.county));
}

export function activeFilterCount(filters: Filters) {
  let count = 0;
  if (filters.county) count += 1;
  if (filters.level !== "all") count += 1;
  if (filters.ownership !== "all") count += 1;
  if (filters.band !== "all") count += 1;
  if (filters.gap !== "all") count += 1;
  if (filters.sort !== "index-asc") count += 1;
  return count;
}

function csvCell(value: string | number | boolean) {
  const text = String(value);
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export function schoolsToCsv(schools: ScoredSchool[]) {
  const headers = [
    "name",
    "county",
    "subCounty",
    "level",
    "ownership",
    "latitude",
    "longitude",
    "enrollment",
    "teachers",
    "learnersPerTeacher",
    "classrooms",
    "learnersPerClassroom",
    "textbooksPerPupil",
    "toilets",
    "learnersPerToilet",
    "desks",
    "electricity",
    "safeWater",
    "internet",
    "library",
    "scienceLab",
    "computerLab",
    "schoolMeals",
    "resourceIndex",
    "band",
    "origin",
    "notes",
  ];
  const lines = schools.map((school) =>
    [
      school.name,
      school.county,
      school.subCounty,
      school.level,
      school.ownership,
      school.lat,
      school.lng,
      school.enrollment,
      school.teachers,
      Number(school.ptr.toFixed(1)),
      school.classrooms,
      Number(school.pupilsPerClass.toFixed(1)),
      school.textbooksPerPupil,
      school.toilets,
      school.pupilsPerToilet == null ? "" : Number(school.pupilsPerToilet.toFixed(1)),
      school.desks,
      school.resources.electricity,
      school.resources.pipedWater,
      school.resources.internet,
      school.resources.library,
      school.resources.scienceLab,
      school.resources.computerLab,
      school.resources.feeding,
      school.index,
      school.band,
      school.origin,
      school.notes,
    ]
      .map(csvCell)
      .join(","),
  );
  return [headers.join(","), ...lines].join("\n");
}
