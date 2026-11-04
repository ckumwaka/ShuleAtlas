import { COUNTIES, type Level, type Ownership, type School } from "@/lib/model";

export type FormValues = {
  name: string;
  county: string;
  subCounty: string;
  level: Level;
  ownership: Ownership;
  lat: string;
  lng: string;
  enrollment: string;
  teachers: string;
  classrooms: string;
  textbooksPerPupil: string;
  toilets: string;
  desks: string;
  electricity: boolean;
  pipedWater: boolean;
  internet: boolean;
  library: boolean;
  scienceLab: boolean;
  computerLab: boolean;
  feeding: boolean;
  notes: string;
};

export type FieldErrors = Partial<Record<keyof FormValues, string>>;

export function emptyForm(county = "Nairobi"): FormValues {
  return {
    name: "",
    county,
    subCounty: "",
    level: "primary",
    ownership: "public",
    lat: "",
    lng: "",
    enrollment: "",
    teachers: "",
    classrooms: "",
    textbooksPerPupil: "",
    toilets: "",
    desks: "",
    electricity: false,
    pipedWater: false,
    internet: false,
    library: false,
    scienceLab: false,
    computerLab: false,
    feeding: false,
    notes: "",
  };
}

export function schoolToForm(school: School): FormValues {
  return {
    name: school.name,
    county: school.county,
    subCounty: school.subCounty,
    level: school.level,
    ownership: school.ownership,
    lat: String(school.lat),
    lng: String(school.lng),
    enrollment: String(school.enrollment),
    teachers: String(school.teachers),
    classrooms: String(school.classrooms),
    textbooksPerPupil: String(school.textbooksPerPupil),
    toilets: String(school.toilets),
    desks: String(school.desks),
    electricity: school.resources.electricity,
    pipedWater: school.resources.pipedWater,
    internet: school.resources.internet,
    library: school.resources.library,
    scienceLab: school.resources.scienceLab,
    computerLab: school.resources.computerLab,
    feeding: school.resources.feeding,
    notes: school.notes,
  };
}

function integerIn(raw: string, min: number, max: number) {
  const text = raw.trim();
  if (!/^\d+$/.test(text)) return null;
  const value = Number(text);
  if (!Number.isInteger(value) || value < min || value > max) return null;
  return value;
}

export function parseForm(
  values: FormValues,
  id: string,
  origin: School["origin"],
  loggedAt?: string,
): { ok: true; school: School } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const name = values.name.trim();
  if (name.length < 2) errors.name = "Enter the school name.";
  else if (name.length > 80) errors.name = "Keep the name under 80 characters.";

  if (!COUNTIES.includes(values.county as (typeof COUNTIES)[number])) {
    errors.county = "Choose a county.";
  }

  const subCounty = values.subCounty.trim();
  if (subCounty.length < 2) errors.subCounty = "Enter the sub-county.";
  else if (subCounty.length > 60) errors.subCounty = "Keep the sub-county short.";

  const lat = Number(values.lat);
  if (!values.lat.trim() || Number.isNaN(lat)) errors.lat = "Set a latitude, or drop a pin.";
  else if (lat < -4.8 || lat > 5.2) errors.lat = "That latitude sits outside Kenya.";

  const lng = Number(values.lng);
  if (!values.lng.trim() || Number.isNaN(lng)) errors.lng = "Set a longitude, or drop a pin.";
  else if (lng < 33.7 || lng > 42) errors.lng = "That longitude sits outside Kenya.";

  const enrollment = integerIn(values.enrollment, 1, 20000);
  if (enrollment == null) errors.enrollment = "Enter learners as a whole number.";
  const teachers = integerIn(values.teachers, 1, 500);
  if (teachers == null) errors.teachers = "Enter at least one teacher.";
  const classrooms = integerIn(values.classrooms, 1, 200);
  if (classrooms == null) errors.classrooms = "Enter at least one classroom.";
  const toilets = integerIn(values.toilets, 0, 500);
  if (toilets == null) errors.toilets = "Enter toilets as a whole number.";
  const desks = integerIn(values.desks, 0, 20000);
  if (desks == null) errors.desks = "Enter desks as a whole number.";

  const booksText = values.textbooksPerPupil.trim();
  const books = Number(booksText);
  if (!booksText || Number.isNaN(books) || books < 0 || books > 5) {
    errors.textbooksPerPupil = "Enter books per learner from 0 to 5.";
  }

  const notes = values.notes.trim();
  if (notes.length > 400) errors.notes = "Keep notes under 400 characters.";

  if (Object.keys(errors).length > 0 || enrollment == null || teachers == null || classrooms == null) {
    return { ok: false, errors };
  }
  if (toilets == null || desks == null || Number.isNaN(books)) return { ok: false, errors };

  return {
    ok: true,
    school: {
      id,
      name,
      county: values.county,
      subCounty,
      level: values.level,
      ownership: values.ownership,
      lat: Math.round(lat * 100000) / 100000,
      lng: Math.round(lng * 100000) / 100000,
      enrollment,
      teachers,
      classrooms,
      textbooksPerPupil: Math.round(books * 100) / 100,
      toilets,
      desks,
      resources: {
        electricity: values.electricity,
        pipedWater: values.pipedWater,
        internet: values.internet,
        library: values.library,
        scienceLab: values.scienceLab,
        computerLab: values.computerLab,
        feeding: values.feeding,
      },
      notes,
      origin,
      loggedAt,
    },
  };
}
