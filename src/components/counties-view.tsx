import { useEffect, useState } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BAND_LABEL, countyRollup, formatNum, type Band, type ScoredSchool } from "@/lib/model";

const FILL: Record<Band, string> = {
  steady: "var(--color-forest)",
  strained: "var(--color-strained)",
  critical: "var(--color-clay)",
};

const COVERAGE: Array<{ key: keyof ScoredSchool["resources"]; label: string }> = [
  { key: "electricity", label: "Electricity" },
  { key: "pipedWater", label: "Safe water" },
  { key: "library", label: "Library" },
  { key: "internet", label: "Internet" },
  { key: "computerLab", label: "Computer lab" },
  { key: "feeding", label: "School meals" },
];

type Props = { schools: ScoredSchool[] };

export function CountiesView({ schools }: Props) {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const rows = countyRollup(schools);
  const scienceSchools = schools.filter((school) => school.level === "secondary");
  const share = (count: number, total: number) => (total === 0 ? 0 : Math.round((count / total) * 100));

  const meters = [
    ...COVERAGE.map((item) => ({
      label: item.label,
      pct: share(schools.filter((school) => school.resources[item.key]).length, schools.length),
    })),
    {
      label: "Science lab (secondary)",
      pct: share(scienceSchools.filter((school) => school.resources.scienceLab).length, scienceSchools.length),
    },
    {
      label: "Teacher line met",
      pct: share(schools.filter((school) => !school.gaps.some((gap) => gap.key === "ptr")).length, schools.length),
    },
    {
      label: "Classroom line met",
      pct: share(schools.filter((school) => !school.gaps.some((gap) => gap.key === "classrooms")).length, schools.length),
    },
    {
      label: "Textbook line met",
      pct: share(schools.filter((school) => !school.gaps.some((gap) => gap.key === "books")).length, schools.length),
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-6">
      <div>
        <h2 className="font-display text-3xl text-balance text-ink">Counties in this view</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-pretty text-muted">
          The bar is an enrollment-weighted resource index. A county with one well-stocked national school and a
          crowded day school will sit between them. Lower means greater need.
        </p>
      </div>
      {schools.length === 0 ? (
        <p className="text-sm text-muted">No schools in the current filters.</p>
      ) : (
        <>
          <section>
            <h3 className="text-sm font-medium text-ink">Share of schools covered</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {meters.map((meter) => (
                <div key={meter.label}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-ink">{meter.label}</span>
                    <span className="tabular-nums text-muted">{meter.pct}%</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-paper-2">
                    <div className="h-1.5 rounded-full bg-forest" style={{ width: `${meter.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="min-w-0">
            <h3 className="text-sm font-medium text-ink">Weighted index by county</h3>
            <div className="mt-4" style={{ height: Math.max(280, rows.length * 32) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "var(--color-muted)", fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="county"
                    width={132}
                    tick={{ fill: "var(--color-ink-soft)", fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--color-paper-2)" }}
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-line)",
                      borderRadius: 12,
                      color: "var(--color-ink)",
                    }}
                    formatter={(value) => [`${value ?? 0}`, "Index"]}
                  />
                  <Bar dataKey="index" isAnimationActive={!reduce} radius={[0, 6, 6, 0]} maxBarSize={18}>
                    {rows.map((row) => (
                      <Cell key={row.county} fill={FILL[row.band]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
              {(Object.keys(FILL) as Band[]).map((band) => (
                <li key={band} className="flex items-center gap-2">
                  <span className="inline-block size-2 rounded-full" style={{ background: FILL[band] }} />
                  {BAND_LABEL[band]}
                </li>
              ))}
            </ul>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead className="text-xs text-muted">
                  <tr className="border-b border-line">
                    <th className="py-2 font-medium">County</th>
                    <th className="py-2 font-medium">Schools</th>
                    <th className="py-2 font-medium">Learners</th>
                    <th className="py-2 font-medium">Index</th>
                    <th className="py-2 font-medium">Critical</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.county} className="border-b border-line">
                      <td className="py-2 text-ink">{row.county}</td>
                      <td className="py-2 tabular-nums">{row.schools}</td>
                      <td className="py-2 tabular-nums">{formatNum(row.enrollment)}</td>
                      <td className="py-2 tabular-nums">{row.index}</td>
                      <td className="py-2 tabular-nums">{row.critical}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
