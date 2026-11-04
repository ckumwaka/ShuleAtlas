import { ChevronLeft, MapPin } from "lucide-react";
import {
  BAND_LABEL,
  LEVEL_LABEL,
  OWNERSHIP_LABEL,
  formatNum,
  formatRatio,
  type ScoredSchool,
} from "@/lib/model";
import { cx } from "@/lib/cx";

const BAND_TEXT = {
  steady: "text-forest-deep",
  strained: "text-strained",
  critical: "text-clay",
} as const;

type Props = {
  school: ScoredSchool;
  local: boolean;
  onBack: () => void;
  onEdit: () => void;
  onRevert: () => void;
};

export function SchoolDetail({ school, local, onBack, onEdit, onRevert }: Props) {
  const ratios = school.parts.filter((part) => part.kind === "ratio");
  const facilities = school.parts.filter((part) => part.kind === "facility");
  const logged = school.loggedAt
    ? new Date(school.loggedAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <article className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-line px-3 py-3">
        <button type="button" className="press inline-flex h-11 items-center gap-1 rounded-md px-2 text-sm text-ink-soft" onClick={onBack}>
          <ChevronLeft className="size-4" aria-hidden="true" />
          Schools
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-2xl leading-tight text-balance text-ink">{school.name}</h2>
            <p className="mt-2 flex items-center gap-1 text-sm text-muted">
              <MapPin className="size-4 shrink-0" aria-hidden="true" />
              <span>
                {school.county} · {school.subCounty}
              </span>
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              {LEVEL_LABEL[school.level]} · {OWNERSHIP_LABEL[school.ownership]}
            </p>
          </div>
          <div className="text-right">
            <p className={cx("font-display text-5xl tabular-nums leading-none", BAND_TEXT[school.band])}>{school.index}</p>
            <p className="mt-1 text-xs text-muted">{BAND_LABEL[school.band]}</p>
          </div>
        </div>
        {local ? (
          <p className="mt-3 inline-flex rounded-full border border-line px-2 py-1 text-xs text-muted">
            {logged ? `Logged on this browser · ${logged}` : "Edited on this browser"}
          </p>
        ) : (
          <p className="mt-3 text-xs leading-relaxed text-muted">Illustrative catalogue profile, not an EMIS return.</p>
        )}

        <dl className="mt-5 grid grid-cols-2 gap-3">
          <Stat label="Learners" value={formatNum(school.enrollment)} />
          <Stat label="Teachers" value={formatNum(school.teachers)} />
          <Stat label="Per teacher" value={formatRatio(school.ptr)} />
          <Stat label="Classrooms" value={formatNum(school.classrooms)} />
          <Stat label="Per classroom" value={formatRatio(school.pupilsPerClass)} />
          <Stat label="Books / learner" value={school.textbooksPerPupil.toFixed(2)} />
          <Stat label="Toilets" value={formatNum(school.toilets)} />
          <Stat
            label="Per toilet"
            value={school.pupilsPerToilet == null ? "—" : formatRatio(school.pupilsPerToilet)}
          />
        </dl>

        <h3 className="mt-6 text-sm font-medium text-ink">Against planning lines</h3>
        <ul className="mt-3 flex flex-col gap-3">
          {ratios.map((part) => (
            <li key={part.key}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-ink">{part.label}</span>
                <span className="text-right text-xs text-muted">{part.detail}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-paper-2">
                <div className="h-1.5 rounded-full bg-forest" style={{ width: `${Math.round(part.score * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>

        <h3 className="mt-6 text-sm font-medium text-ink">Facilities</h3>
        <ul className="mt-2 divide-y divide-line border-y border-line">
          {facilities.map((part) => (
            <li key={part.key} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="text-ink">{part.label}</span>
              <span className={part.applies && part.score === 0 ? "text-clay" : "text-muted"}>{part.detail}</span>
            </li>
          ))}
        </ul>

        <h3 className="mt-6 text-sm font-medium text-ink">Shortfalls</h3>
        {school.gaps.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Meets the planning lines in this index.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {school.gaps.map((gap) => (
              <li key={gap.key} className="border-l-2 border-clay pl-3 text-sm text-ink">
                {gap.detail}
              </li>
            ))}
          </ul>
        )}

        {school.notes ? <p className="mt-5 text-sm leading-relaxed text-pretty text-ink-soft">{school.notes}</p> : null}
      </div>
      <div className="flex gap-2 border-t border-line p-4">
        <button type="button" className="press h-11 flex-1 rounded-md bg-forest text-sm font-medium text-card" onClick={onEdit}>
          Update profile
        </button>
        {local ? (
          <button type="button" className="press h-11 rounded-md border border-line px-3 text-sm" onClick={onRevert}>
            {school.origin === "field" ? "Remove" : "Revert"}
          </button>
        ) : null}
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-paper px-3 py-2">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 font-display text-xl tabular-nums text-ink">{value}</dd>
    </div>
  );
}
