import { BAND_LABEL, LEVEL_LABEL, formatNum, type Band, type ScoredSchool } from "@/lib/model";
import { cx } from "@/lib/cx";

const BAND_PILL: Record<Band, string> = {
  steady: "bg-forest-soft text-forest-deep",
  strained: "bg-strained-soft text-strained",
  critical: "bg-clay-soft text-clay",
};

type Props = {
  schools: ScoredSchool[];
  onOpen: (id: string) => void;
};

export function GapsView({ schools, onOpen }: Props) {
  const needy = schools.filter((school) => school.gaps.length > 0);
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <h2 className="font-display text-3xl text-balance text-ink">Where the shortfalls sit</h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-pretty text-muted">
        Schools in the current filters that miss at least one planning line, lowest resource index first.
        The index is a planning composite, not an official ranking.
      </p>
      <p className="mt-4 text-sm tabular-nums text-ink-soft">{formatNum(needy.length)} schools with a shortfall</p>
      {needy.length === 0 ? (
        <p className="mt-8 text-sm text-muted">Nothing in this view misses a planning line. Widen the filters.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {needy.map((school) => (
            <li key={school.id}>
              <button
                type="button"
                onClick={() => onOpen(school.id)}
                className="press flex w-full items-start gap-3 rounded-lg border border-line bg-card px-4 py-3 text-left"
              >
                <span className={cx("mt-0.5 rounded-full px-2 py-1 text-xs font-medium tabular-nums", BAND_PILL[school.band])}>
                  {school.index}
                  <span className="sr-only"> {BAND_LABEL[school.band]}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink">{school.name}</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {school.county} · {LEVEL_LABEL[school.level]} · {formatNum(school.enrollment)} learners
                  </span>
                  <span className="mt-2 block text-sm text-ink-soft">{school.gaps.slice(0, 2).map((gap) => gap.detail).join(" ")}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
