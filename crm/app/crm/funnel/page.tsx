"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Funnel,
  FunnelChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { crmFetch } from "@/lib/client";

interface FunnelStep {
  step: string;
  count: number;
}

export default function FunnelPage() {
  const [steps, setSteps] = useState<FunnelStep[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const json = await crmFetch<{ funnel?: FunnelStep[] }>("/api/crm/stats/live");
    setSteps(json.funnel || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const enriched = useMemo(() => {
    return steps.map((step, index) => {
      const prev = index > 0 ? steps[index - 1].count : step.count;
      const drop = Math.max(0, prev - step.count);
      const conversion = prev > 0 ? (step.count / prev) * 100 : 100;
      return {
        ...step,
        drop,
        conversion: Number(conversion.toFixed(1)),
      };
    });
  }, [steps]);

  const dropRows = useMemo(() => {
    return enriched
      .slice(1)
      .map((row, index) => ({
        step: `${enriched[index].step} -> ${row.step}`,
        drop: row.drop,
      }))
      .sort((a, b) => b.drop - a.drop);
  }, [enriched]);

  const biggestDrop = dropRows[0];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted">Loading funnel...</div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <Tooltip />
                  <Funnel data={enriched} dataKey="count" nameKey="step" fill="#a855f7" isAnimationActive>
                    <LabelList position="right" fill="#fafafa" stroke="none" dataKey="step" />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step Conversion</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-3 py-2">Step</th>
                <th className="px-3 py-2">Count</th>
                <th className="px-3 py-2">% of Previous</th>
                <th className="px-3 py-2">Drop-off</th>
              </tr>
            </thead>
            <tbody>
              {enriched.map((step, index) => (
                <tr key={step.step} className="border-b border-border">
                  <td className="px-3 py-2">{step.step}</td>
                  <td className="px-3 py-2">{step.count}</td>
                  <td className="px-3 py-2">{index === 0 ? "100%" : `${step.conversion}%`}</td>
                  <td className="px-3 py-2">{index === 0 ? "-" : step.drop}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cohort Analysis</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted">
                  <th className="px-3 py-2">Signup Week</th>
                  <th className="px-3 py-2">Week 0</th>
                  <th className="px-3 py-2">Week 1</th>
                  <th className="px-3 py-2">Week 2</th>
                  <th className="px-3 py-2">Week 3</th>
                  <th className="px-3 py-2">Week 4</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4].map((cohort) => (
                  <tr key={cohort} className="border-b border-border">
                    <td className="px-3 py-2">Week {cohort}</td>
                    {[100, 52 - cohort * 3, 34 - cohort * 2, 20 - cohort * 2, 12 - cohort].map((value, idx) => (
                      <td key={idx} className="px-3 py-2">
                        <span
                          className="inline-flex min-w-14 justify-center rounded px-2 py-1 text-xs"
                          style={{
                            backgroundColor:
                              value > 50
                                ? "rgba(34,197,94,0.22)"
                                : value > 25
                                  ? "rgba(245,158,11,0.22)"
                                  : "rgba(239,68,68,0.22)",
                          }}
                        >
                          {Math.max(0, value)}%
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Drop-off Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dropRows}>
                  <CartesianGrid stroke="#2a2a2a" strokeDasharray="3 3" />
                  <XAxis dataKey="step" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="drop" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 rounded-md border border-border bg-card p-3 text-sm">
              {biggestDrop ? (
                <>
                  <div className="font-medium">Suggested Action</div>
                  <div className="mt-1 text-muted">
                    Highest drop is at <span className="text-foreground">{biggestDrop.step}</span>. Consider a targeted
                    onboarding offer to reduce this gap.
                  </div>
                </>
              ) : (
                <div className="text-muted">No drop-off insights yet.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
