"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getMonthAnalytics } from "@/lib/analytics";
import type { BudgetVsActual, CategoryDistribution } from "@/lib/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { MotionSection } from "@/components/MotionSection";
import { PieChart as PieIcon, BarChart3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function getCurrentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glassmorphism p-4 rounded-lg text-sm">
        <p className="font-semibold text-white mb-2">{label}</p>
        <div className="space-y-1">
          {payload.find((p: { dataKey: string }) => p.dataKey === "budget") && (
            <p className="text-indigo-300">
              Budget:{" "}
              <span className="font-medium">
                ₹
                {payload
                  .find((p: { dataKey: string }) => p.dataKey === "budget")
                  ?.value?.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
              </span>
            </p>
          )}
          {payload.find((p: { dataKey: string }) => p.dataKey === "actual") && (
            <p className="text-red-300">
              Actual:{" "}
              <span className="font-medium">
                ₹
                {payload
                  .find((p: { dataKey: string }) => p.dataKey === "actual")
                  ?.value?.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
              </span>
            </p>
          )}
          {payload.find((p: { dataKey: string }) => p.dataKey === "total") && (
            <p className="text-gray-200">
              {payload[0].name}:{" "}
              <span className="font-medium">
                ₹
                {payload
                  .find((p: { dataKey: string }) => p.dataKey === "total")
                  ?.value?.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
              </span>
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { user, dataVersion } = useAuth();
  const [ym, setYm] = useState(getCurrentYearMonth());
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    budgetVsActual: BudgetVsActual[];
    distribution: CategoryDistribution[];
    totalSpending: number;
    totalBudget: number;
  } | null>(null);

  useEffect(() => {
    async function load() {
      if (!user?.uid) return;
      setLoading(true);
      try {
        const res = await getMonthAnalytics(user.uid, ym.year, ym.month);
        setData(res);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.uid, ym, dataVersion]);

  function changeMonth(delta: number) {
    const date = new Date(ym.year, ym.month + delta, 1);
    setYm({ year: date.getFullYear(), month: date.getMonth() });
  }

  const monthLabel = useMemo(
    () =>
      new Date(ym.year, ym.month, 1).toLocaleString(undefined, {
        month: "long",
        year: "numeric",
      }),
    [ym]
  );

  const colors = [
    "#6366f1",
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#06b6d4",
    "#a78bfa",
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <div className="glassmorphism flex items-center gap-2 p-1 rounded-lg">
          <Button
            variant="ghost"
            onClick={() => changeMonth(-1)}
            className="text-white hover:bg-white/10 hover:text-white"
          >
            Prev
          </Button>
          <span className="min-w-[160px] text-center font-medium text-white">
            {monthLabel}
          </span>
          <Button
            variant="ghost"
            onClick={() => changeMonth(1)}
            className="text-white hover:bg-white/10 hover:text-white"
          >
            Next
          </Button>
        </div>
      </div>

      <MotionSection>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glassmorphism text-white border-0">
            <CardHeader>
              <CardTitle className="font-normal text-gray-300">
                Total Spending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {data
                  ? `₹${data.totalSpending.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "₹0.00"}
              </div>
            </CardContent>
          </Card>
          <Card className="glassmorphism text-white border-0">
            <CardHeader>
              <CardTitle className="font-normal text-gray-300">
                Total Budget
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {data
                  ? `₹${data.totalBudget.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "₹0.00"}
              </div>
            </CardContent>
          </Card>
          <Card className="glassmorphism text-white border-0">
            <CardHeader>
              <CardTitle className="font-normal text-gray-300">
                Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {data
                  ? `₹${(data.totalBudget - data.totalSpending).toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                    )}`
                  : "₹0.00"}
              </div>
            </CardContent>
          </Card>
        </div>
      </MotionSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MotionSection delay={0.05}>
          <Card className="glassmorphism text-white border-0">
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2 font-semibold">
                <PieIcon className="h-5 w-5" /> Spending Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {data && data.distribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.distribution}
                      dataKey="total"
                      nameKey="categoryName"
                      outerRadius={120}
                      labelLine={false}
                    >
                      {data.distribution.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={colors[index % colors.length]}
                          stroke={""}
                        />
                      ))}
                    </Pie>
                    {/* CORRECTED: Pass the function itself, not a JSX element */}
                    <Tooltip content={CustomTooltip} />
                    <Legend
                      formatter={(value) => (
                        <span className="text-white/80">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No spending data for this month.
                </div>
              )}
            </CardContent>
          </Card>
        </MotionSection>

        <MotionSection delay={0.1}>
          <Card className="glassmorphism text-white border-0">
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2 font-semibold">
                <BarChart3 className="h-5 w-5" /> Budget vs Actual
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {data && data.budgetVsActual.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.budgetVsActual}
                    margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255, 255, 255, 0.2)"
                    />
                    <XAxis
                      dataKey="categoryName"
                      stroke="rgba(255, 255, 255, 0.4)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="rgba(255, 255, 255, 0.4)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    {/* CORRECTED: Pass the function itself, not a JSX element */}
                    <Tooltip
                      content={CustomTooltip}
                      cursor={{ fill: "rgba(255, 255, 255, 0.1)" }}
                    />
                    <Legend
                      formatter={(value) => (
                        <span className="text-white/80">{value}</span>
                      )}
                    />
                    <Bar
                      dataKey="budget"
                      fill="#6366f1"
                      name="Budget"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="actual"
                      fill="#ef4444"
                      name="Actual"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No budget data for this month.
                </div>
              )}
            </CardContent>
          </Card>
        </MotionSection>
      </div>
    </div>
  );
}
