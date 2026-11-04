import type { ReactNode } from "react";
import { COUNTIES, LEVEL_LABEL, OWNERSHIP_LABEL, type Level, type Ownership } from "@/lib/model";
import type { FieldErrors, FormValues } from "@/lib/form";

const FACILITIES: Array<{ key: keyof FormValues; label: string }> = [
  { key: "electricity", label: "Electricity" },
  { key: "pipedWater", label: "Safe water" },
  { key: "internet", label: "Internet" },
  { key: "library", label: "Library" },
  { key: "scienceLab", label: "Science lab" },
  { key: "computerLab", label: "Computer lab" },
  { key: "feeding", label: "School meals" },
];

type Props = {
  title: string;
  values: FormValues;
  errors: FieldErrors;
  onChange: (values: FormValues) => void;
  onPlace: () => void;
  onCancel: () => void;
  onSubmit: () => void;
};

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-ink">{label}</span>
      {children}
      {error ? <span className="text-xs text-clay">{error}</span> : null}
    </label>
  );
}

export function SchoolForm({ title, values, errors, onChange, onPlace, onCancel, onSubmit }: Props) {
  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <button type="button" className="press h-11 rounded-md px-2 text-sm text-ink-soft" onClick={onCancel}>
          Cancel
        </button>
        <h2 className="min-w-0 flex-1 truncate font-display text-xl text-ink">{title}</h2>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        <Field label="School name" error={errors.name}>
          <input className="field" value={values.name} maxLength={80} onChange={(event) => set("name", event.target.value)} />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="County" error={errors.county}>
            <select className="field" value={values.county} onChange={(event) => set("county", event.target.value)}>
              {COUNTIES.map((county) => (
                <option key={county} value={county}>
                  {county}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Sub-county" error={errors.subCounty}>
            <input className="field" value={values.subCounty} maxLength={60} onChange={(event) => set("subCounty", event.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Level">
            <select className="field" value={values.level} onChange={(event) => set("level", event.target.value as Level)}>
              {(Object.keys(LEVEL_LABEL) as Level[]).map((level) => (
                <option key={level} value={level}>
                  {LEVEL_LABEL[level]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ownership">
            <select
              className="field"
              value={values.ownership}
              onChange={(event) => set("ownership", event.target.value as Ownership)}
            >
              {(Object.keys(OWNERSHIP_LABEL) as Ownership[]).map((ownership) => (
                <option key={ownership} value={ownership}>
                  {OWNERSHIP_LABEL[ownership]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Latitude" error={errors.lat}>
            <input className="field" inputMode="decimal" value={values.lat} onChange={(event) => set("lat", event.target.value)} />
          </Field>
          <Field label="Longitude" error={errors.lng}>
            <input className="field" inputMode="decimal" value={values.lng} onChange={(event) => set("lng", event.target.value)} />
          </Field>
        </div>
        <button type="button" className="press h-11 rounded-md border border-line bg-card text-sm text-ink" onClick={onPlace}>
          {values.lat && values.lng ? "Move the pin on the map" : "Drop a pin on the map"}
        </button>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Learners" error={errors.enrollment}>
            <input className="field" inputMode="numeric" value={values.enrollment} onChange={(event) => set("enrollment", event.target.value)} />
          </Field>
          <Field label="Teachers" error={errors.teachers}>
            <input className="field" inputMode="numeric" value={values.teachers} onChange={(event) => set("teachers", event.target.value)} />
          </Field>
          <Field label="Classrooms" error={errors.classrooms}>
            <input className="field" inputMode="numeric" value={values.classrooms} onChange={(event) => set("classrooms", event.target.value)} />
          </Field>
          <Field label="Books per learner" error={errors.textbooksPerPupil}>
            <input
              className="field"
              inputMode="decimal"
              value={values.textbooksPerPupil}
              onChange={(event) => set("textbooksPerPupil", event.target.value)}
            />
          </Field>
          <Field label="Toilets" error={errors.toilets}>
            <input className="field" inputMode="numeric" value={values.toilets} onChange={(event) => set("toilets", event.target.value)} />
          </Field>
          <Field label="Desks" error={errors.desks}>
            <input className="field" inputMode="numeric" value={values.desks} onChange={(event) => set("desks", event.target.value)} />
          </Field>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink">Facilities on site</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {FACILITIES.map((facility) => (
              <label key={facility.key} className="flex min-h-11 items-center gap-3 rounded-md border border-line px-3 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(values[facility.key])}
                  onChange={(event) => set(facility.key, event.target.checked as never)}
                />
                {facility.label}
              </label>
            ))}
          </div>
        </fieldset>
        <Field label="Notes" error={errors.notes}>
          <textarea
            className="field min-h-24"
            maxLength={400}
            value={values.notes}
            onChange={(event) => set("notes", event.target.value)}
          />
        </Field>
        <p className="text-xs leading-relaxed text-muted">
          Saved only in this browser. Catalogue profiles stay illustrative until you replace them here.
        </p>
      </div>
      <div className="border-t border-line p-4">
        <button type="submit" className="press h-11 w-full rounded-md bg-forest text-sm font-medium text-card">
          Save on this browser
        </button>
      </div>
    </form>
  );
}
