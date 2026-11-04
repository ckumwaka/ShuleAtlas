import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { BarChart3, Download, List, Map as MapIcon, Plus, TriangleAlert } from "lucide-react";
import { SchoolMap } from "@/components/school-map";
import { SchoolDirectory } from "@/components/school-directory";
import { SchoolDetail } from "@/components/school-detail";
import { SchoolForm } from "@/components/school-form";
import { GapsView } from "@/components/gaps-view";
import { CountiesView } from "@/components/counties-view";
import { mergeSchools, useAtlas } from "@/lib/atlas-store";
import { emptyForm, parseForm, schoolToForm, type FieldErrors, type FormValues } from "@/lib/form";
import {
  BAND_LABEL,
  INITIAL_FILTERS,
  formatNum,
  matchesSchool,
  median,
  schoolsToCsv,
  scoreSchool,
  sortSchools,
  type Band,
  type Filters,
  type School,
} from "@/lib/model";
import { cx } from "@/lib/cx";

type View = "schools" | "map" | "gaps" | "counties";

type Draft = {
  kind: "add" | "edit";
  id: string;
  origin: School["origin"];
  loggedAt?: string;
  values: FormValues;
};

export function MapperApp() {
  const added = useAtlas((state) => state.added);
  const overrides = useAtlas((state) => state.overrides);
  const addSchool = useAtlas((state) => state.addSchool);
  const updateAdded = useAtlas((state) => state.updateAdded);
  const setOverride = useAtlas((state) => state.setOverride);
  const removeAdded = useAtlas((state) => state.removeAdded);
  const clearOverride = useAtlas((state) => state.clearOverride);
  const resetAll = useAtlas((state) => state.resetAll);

  const [view, setView] = useState<View>("map");
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pinMode, setPinMode] = useState(false);

  useEffect(() => {
    void useAtlas.persist.rehydrate();
  }, []);

  const schools = useMemo(
    () => mergeSchools(added, overrides).map(scoreSchool),
    [added, overrides],
  );

  const localIds = useMemo(() => {
    const ids = new Set<string>(added.map((school) => school.id));
    for (const id of Object.keys(overrides)) ids.add(id);
    return ids;
  }, [added, overrides]);

  const facet = useMemo(
    () => sortSchools(schools.filter((school) => matchesSchool(school, filters, true)), filters.sort),
    [schools, filters],
  );

  const filtered = useMemo(
    () => (filters.band === "all" ? facet : facet.filter((school) => school.band === filters.band)),
    [facet, filters.band],
  );

  const counts = useMemo(() => {
    const tally: Record<Band, number> = { steady: 0, strained: 0, critical: 0 };
    for (const school of facet) tally[school.band] += 1;
    return tally;
  }, [facet]);

  useEffect(() => {
    if (selectedId && !filtered.some((school) => school.id === selectedId)) setSelectedId(null);
  }, [filtered, selectedId]);

  const selected = schools.find((school) => school.id === selectedId) ?? null;
  const learners = filtered.reduce((sum, school) => sum + school.enrollment, 0);
  const mid = median(filtered.map((school) => school.index));

  const onSelect = useCallback((id: string) => {
    setSelectedId(id);
    setDraft(null);
    setPinMode(false);
    if (window.innerWidth < 1024) setView("schools");
  }, []);

  const onPin = useCallback((lat: number, lng: number) => {
    setDraft((current) =>
      current
        ? { ...current, values: { ...current.values, lat: lat.toFixed(5), lng: lng.toFixed(5) } }
        : current,
    );
    setPinMode(false);
    if (window.innerWidth < 1024) setView("schools");
  }, []);

  const onCancelPin = useCallback(() => setPinMode(false), []);

  function openSchool(id: string) {
    setSelectedId(id);
    setDraft(null);
    setPinMode(false);
    setView(window.innerWidth < 1024 ? "schools" : "map");
  }

  function startAdd() {
    setDraft({
      kind: "add",
      id: `field-${crypto.randomUUID()}`,
      origin: "field",
      values: emptyForm(filters.county || "Nairobi"),
    });
    setErrors({});
    setSelectedId(null);
    setPinMode(false);
    setView("schools");
  }

  function startEdit(school: School) {
    setDraft({
      kind: "edit",
      id: school.id,
      origin: school.origin,
      loggedAt: school.loggedAt,
      values: schoolToForm(school),
    });
    setErrors({});
    setPinMode(false);
    setView("schools");
  }

  function saveDraft() {
    if (!draft) return;
    const loggedAt = draft.origin === "field" ? (draft.loggedAt ?? new Date().toISOString()) : undefined;
    const parsed = parseForm(draft.values, draft.id, draft.origin, loggedAt);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    if (draft.kind === "add") addSchool(parsed.school);
    else if (parsed.school.origin === "field") updateAdded(parsed.school);
    else setOverride({ ...parsed.school, origin: "catalogue" });
    setSelectedId(parsed.school.id);
    setDraft(null);
    setErrors({});
    setPinMode(false);
  }

  function revertSelected() {
    if (!selected) return;
    if (selected.origin === "field") removeAdded(selected.id);
    else clearOverride(selected.id);
    setSelectedId(null);
    setDraft(null);
  }

  function exportView() {
    const blob = new Blob([schoolsToCsv(filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "shule-atlas.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const mapSchools = useMemo(
    () => filtered.map((school) => ({ id: school.id, name: school.name, lat: school.lat, lng: school.lng, band: school.band })),
    [filtered],
  );

  const showPanel = view === "schools" || view === "map";
  const showAnalysis = view === "gaps" || view === "counties";

  return (
    <div className="flex h-dvh flex-col bg-paper text-ink">
      <header className="flex items-center gap-3 border-b border-line bg-card px-4 py-3">
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-xl tracking-tight text-ink">
            Shule <span className="italic text-forest">Atlas</span>
          </h1>
          <p className="truncate text-sm text-muted">Kenya school resource mapper</p>
        </div>
        <button type="button" className="press hidden h-11 items-center gap-2 rounded-md border border-line px-3 text-sm lg:inline-flex" onClick={exportView} disabled={filtered.length === 0}>
          <Download className="size-4" aria-hidden="true" />
          Export view
        </button>
        <button type="button" className="press inline-flex h-11 items-center gap-2 rounded-md bg-forest px-3 text-sm font-medium text-card" onClick={startAdd}>
          <Plus className="size-4" aria-hidden="true" />
          Log school
        </button>
      </header>

      <div className="hidden items-center gap-4 border-b border-line bg-card px-4 py-2 lg:flex">
        <div className="flex gap-1">
          <DeskTab active={view === "map" || view === "schools"} onClick={() => setView("map")} icon={<MapIcon className="size-4" aria-hidden="true" />} label="Map" />
          <DeskTab active={view === "gaps"} onClick={() => setView("gaps")} icon={<TriangleAlert className="size-4" aria-hidden="true" />} label="Gaps" />
          <DeskTab active={view === "counties"} onClick={() => setView("counties")} icon={<BarChart3 className="size-4" aria-hidden="true" />} label="Counties" />
        </div>
        <dl className="ml-auto flex items-center gap-6 text-sm">
          <HeaderStat label="Schools" value={formatNum(filtered.length)} />
          <HeaderStat label="Learners" value={formatNum(learners)} />
          <HeaderStat label="Median index" value={String(mid)} />
        </dl>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {showPanel ? (
          <aside
            className={cx(
              "min-h-0 w-full flex-col bg-card lg:w-96 lg:shrink-0 lg:border-r lg:border-line",
              view === "map" ? "hidden lg:flex" : "flex flex-1 lg:flex-none",
            )}
          >
            {draft ? (
              <SchoolForm
                title={draft.kind === "add" ? "Log a school" : "Update profile"}
                values={draft.values}
                errors={errors}
                onChange={(values) => {
                  setDraft({ ...draft, values });
                  setErrors({});
                }}
                onPlace={() => {
                  setPinMode(true);
                  setView("map");
                }}
                onCancel={() => {
                  setDraft(null);
                  setPinMode(false);
                  setErrors({});
                }}
                onSubmit={saveDraft}
              />
            ) : selected ? (
              <SchoolDetail
                school={selected}
                local={localIds.has(selected.id)}
                onBack={() => setSelectedId(null)}
                onEdit={() => startEdit(selected)}
                onRevert={revertSelected}
              />
            ) : (
              <SchoolDirectory
                schools={filtered}
                counts={counts}
                total={schools.length}
                filters={filters}
                onFilters={setFilters}
                selectedId={selectedId}
                onSelect={onSelect}
                localIds={localIds}
                hasLocal={localIds.size > 0}
                onReset={resetAll}
              />
            )}
          </aside>
        ) : null}

        <section className={cx("relative min-h-0 flex-1", view === "map" ? "flex" : showAnalysis ? "hidden" : "hidden lg:flex")}>
          <SchoolMap
            schools={mapSchools}
            selectedId={selectedId}
            onSelect={onSelect}
            pinMode={pinMode}
            onPin={onPin}
            onCancelPin={onCancelPin}
          />
          {view === "map" && !pinMode ? (
            <form
              className="map-overlay absolute inset-x-3 top-3 lg:hidden"
              onSubmit={(event) => {
                event.preventDefault();
                setView("schools");
              }}
            >
              <label className="flex h-11 items-center rounded-lg border border-line bg-card px-3 text-sm shadow-sm">
                <span className="sr-only">Search schools</span>
                <input
                  value={filters.query}
                  onChange={(event) => setFilters({ ...filters, query: event.target.value })}
                  placeholder="Search schools"
                  className="w-full bg-transparent outline-none placeholder:text-faint"
                />
              </label>
            </form>
          ) : null}
          {selected && view === "map" && !draft ? (
            <button
              type="button"
              className="map-overlay absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-lg border border-line bg-card px-4 py-3 text-left lg:hidden"
              onClick={() => setView("schools")}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{selected.name}</span>
                <span className="block text-xs text-muted">
                  {selected.county} · {BAND_LABEL[selected.band]}
                </span>
              </span>
              <span className="font-display text-2xl tabular-nums">{selected.index}</span>
            </button>
          ) : null}
        </section>

        {showAnalysis ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            {view === "gaps" ? <GapsView schools={filtered} onOpen={openSchool} /> : <CountiesView schools={filtered} />}
            <div className="mx-auto w-full max-w-3xl px-4 pb-8">
              <About />
            </div>
          </div>
        ) : null}
      </div>

      <nav className="safe-bottom grid grid-cols-4 border-t border-line bg-card lg:hidden">
        <MobTab active={view === "schools"} onClick={() => setView("schools")} icon={<List className="size-5" aria-hidden="true" />} label="Schools" />
        <MobTab active={view === "map"} onClick={() => setView("map")} icon={<MapIcon className="size-5" aria-hidden="true" />} label="Map" />
        <MobTab active={view === "gaps"} onClick={() => setView("gaps")} icon={<TriangleAlert className="size-5" aria-hidden="true" />} label="Gaps" />
        <MobTab active={view === "counties"} onClick={() => setView("counties")} icon={<BarChart3 className="size-5" aria-hidden="true" />} label="Counties" />
      </nav>
    </div>
  );
}

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-display text-lg tabular-nums leading-none">{value}</dd>
    </div>
  );
}

function DeskTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "press inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm",
        active ? "bg-forest-soft text-forest-deep" : "text-muted",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function MobTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx("flex h-14 flex-col items-center justify-center gap-1 text-xs", active ? "text-forest" : "text-muted")}
    >
      {icon}
      {label}
    </button>
  );
}

function About() {
  return (
    <div className="text-sm leading-relaxed text-pretty text-muted">
      <p>
        The resource index runs from 0 to 100. Planning lines are 40 learners per teacher in primary, 35 in
        secondary, 45 per classroom, one core textbook per learner, 30 learners per toilet, and at least one desk
        for every two learners. Facilities counted are electricity, safe water, internet, a library, a science lab
        (secondary only), a computer lab and school meals.
      </p>
      <p className="mt-2">
        Catalogue figures are illustrative composites for practice — verify them with the county education office
        or NEMIS before any allocation. Logs you add stay in this browser.
      </p>
    </div>
  );
}
