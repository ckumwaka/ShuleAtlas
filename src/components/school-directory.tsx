import { useEffect, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import {
  BAND_LABEL,
  COUNTIES,
  GAP_OPTIONS,
  LEVEL_LABEL,
  OWNERSHIP_LABEL,
  SORT_OPTIONS,
  activeFilterCount,
  formatNum,
  type Band,
  type Filters,
  type ScoredSchool,
} from "@/lib/model";
import { cx } from "@/lib/cx";

const BAND_PILL: Record<Band, string> = {
  steady: "bg-forest-soft text-forest-deep",
  strained: "bg-strained-soft text-strained",
  critical: "bg-clay-soft text-clay",
};

type Props = {
  schools: ScoredSchool[];
  counts: Record<Band, number>;
  total: number;
  filters: Filters;
  onFilters: (filters: Filters) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  localIds: Set<string>;
  hasLocal: boolean;
  onReset: () => void;
};

export function SchoolDirectory({
  schools,
  counts,
  total,
  filters,
  onFilters,
  selectedId,
  onSelect,
  localIds,
  hasLocal,
  onReset,
}: Props) {
  const [open, setOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const filterCount = activeFilterCount(filters);

  useEffect(() => {
    if (!selectedId) return;
    document.getElementById(`school-${selectedId}`)?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  function patch(partial: Partial<Filters>) {
    onFilters({ ...filters, ...partial });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-line px-4 py-3">
        <div className="grid grid-cols-3 gap-2 lg:hidden">
          <Mini label="Schools" value={formatNum(schools.length)} />
          <Mini label="Learners" value={formatNum(schools.reduce((sum, school) => sum + school.enrollment, 0))} />
          <Mini label="In view" value={filters.band === "all" ? "All bands" : BAND_LABEL[filters.band]} />
        </div>
        <label className="mt-3 flex h-11 items-center gap-2 rounded-md border border-line bg-card px-3 lg:mt-0">
          <Search className="size-4 text-faint" aria-hidden="true" />
          <span className="sr-only">Search schools</span>
          <input
            value={filters.query}
            onChange={(event) => patch({ query: event.target.value })}
            placeholder="Search name or county"
            className="h-full w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
          />
        </label>
        <p className="mt-3 text-xs leading-relaxed text-pretty text-muted">
          Illustrative planning profiles, not an official census. Greatest need is listed first.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <CountChip label="Critical" value={counts.critical} pressed={filters.band === "critical"} onClick={() => patch({ band: filters.band === "critical" ? "all" : "critical" })} />
          <CountChip label="Strained" value={counts.strained} pressed={filters.band === "strained"} onClick={() => patch({ band: filters.band === "strained" ? "all" : "strained" })} />
          <CountChip label="Steady" value={counts.steady} pressed={filters.band === "steady"} onClick={() => patch({ band: filters.band === "steady" ? "all" : "steady" })} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            className="press inline-flex h-11 items-center gap-2 rounded-md border border-line px-3 text-sm"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            Filters
            {filterCount > 0 ? <span className="tabular-nums text-forest">{filterCount}</span> : null}
          </button>
          <p className="text-xs text-muted">
            {formatNum(schools.length)} of {formatNum(total)}
          </p>
        </div>
        {open ? (
          <div className="mt-3 flex flex-col gap-3">
          <Segment
            label="Level"
            value={filters.level}
            options={[
              ["all", "All"],
              ["primary", "Primary"],
              ["secondary", "Secondary"],
            ]}
            onChange={(level) => patch({ level: level as Filters["level"] })}
          />
          <Segment
            label="Ownership"
            value={filters.ownership}
            options={[
              ["all", "All"],
              ["public", "Public"],
              ["faith", "Faith"],
              ["private", "Private"],
            ]}
            onChange={(ownership) => patch({ ownership: ownership as Filters["ownership"] })}
          />
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">County</span>
            <select className="field" value={filters.county} onChange={(event) => patch({ county: event.target.value })}>
              <option value="">All counties</option>
              {COUNTIES.map((county) => (
                <option key={county} value={county}>
                  {county}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Shortfall</span>
            <select className="field" value={filters.gap} onChange={(event) => patch({ gap: event.target.value as Filters["gap"] })}>
              {GAP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Sort</span>
            <select className="field" value={filters.sort} onChange={(event) => patch({ sort: event.target.value as Filters["sort"] })}>
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {filterCount > 0 ? (
            <button type="button" className="press h-11 text-left text-sm text-forest" onClick={() => onFilters({ ...filters, county: "", level: "all", ownership: "all", band: "all", gap: "all", sort: "index-asc" })}>
              Clear filters
            </button>
          ) : null}
        </div>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {schools.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">No schools match. Clear a filter or search another county.</p>
        ) : (
          <ul>
            {schools.map((school) => {
              const selected = school.id === selectedId;
              return (
                <li key={school.id}>
                  <button
                    id={`school-${school.id}`}
                    type="button"
                    onClick={() => onSelect(school.id)}
                    className={cx(
                      "flex w-full items-start gap-3 border-b border-line px-4 py-3 text-left",
                      selected ? "bg-forest-soft" : "hover:bg-paper",
                    )}
                  >
                    <span className={cx("mt-0.5 inline-flex min-w-10 justify-center rounded-full px-2 py-1 text-xs font-medium tabular-nums", BAND_PILL[school.band])}>
                      {school.index}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{school.name}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted">
                        {school.county} · {LEVEL_LABEL[school.level]} · {OWNERSHIP_LABEL[school.ownership]}
                        {localIds.has(school.id) ? " · On this browser" : ""}
                      </span>
                      {school.gaps[0] ? <span className="mt-1 block truncate text-xs text-ink-soft">{school.gaps[0].detail}</span> : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {hasLocal ? (
        <div className="border-t border-line px-4 py-3">
          {confirmReset ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-ink">Clear every log and edit stored in this browser?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="press h-11 flex-1 rounded-md bg-ink text-sm text-card"
                  onClick={() => {
                    onReset();
                    setConfirmReset(false);
                  }}
                >
                  Clear
                </button>
                <button type="button" className="press h-11 flex-1 rounded-md border border-line text-sm" onClick={() => setConfirmReset(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="press h-11 text-sm text-ink-soft" onClick={() => setConfirmReset(true)}>
              Clear browser logs
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="truncate font-display text-lg tabular-nums text-ink">{value}</p>
    </div>
  );
}

function CountChip({ label, value, pressed, onClick }: { label: string; value: number; pressed: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cx(
        "press inline-flex h-10 items-center gap-2 rounded-full border px-3 text-sm",
        pressed ? "border-forest bg-forest-soft text-forest-deep" : "border-line text-ink-soft",
      )}
    >
      <span className="tabular-nums">{value}</span>
      {label}
    </button>
  );
}

function Segment({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-sm text-muted">{label}</p>
      <div className="grid gap-1 rounded-md bg-paper-2 p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map(([option, text]) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option)}
              className={cx("h-10 rounded-sm text-sm", selected ? "bg-card text-ink" : "text-muted")}
            >
              {text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
