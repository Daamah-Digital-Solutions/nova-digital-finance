"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Installment {
  installment_number: number;
  amount: number;
  paid_amount: number;
  status: string;
  due_date: string;
}

interface InstallmentChartProps {
  installments: Installment[];
}

const statusColors: Record<string, string> = {
  paid: "#22c55e",
  partially_paid: "#eab308",
  due: "#3b82f6",
  upcoming: "#94a3b8",
  overdue: "#ef4444",
  deferred: "#a855f7",
};

export function InstallmentChart({ installments }: InstallmentChartProps) {
  const data = installments.map((inst) => ({
    name: `#${inst.installment_number}`,
    total: inst.amount,
    paid: inst.paid_amount,
    status: inst.status,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Installment Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))",
                }}
              />
              <Bar dataKey="total" name="Total" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={statusColors[entry.status] || "#94a3b8"}
                    opacity={0.3}
                  />
                ))}
              </Bar>
              <Bar dataKey="paid" name="Paid" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-paid-${index}`}
                    fill={statusColors[entry.status] || "#94a3b8"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs capitalize text-muted-foreground">
                {status.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
