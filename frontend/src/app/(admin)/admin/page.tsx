"use client";

import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Shield,
  FileText,
  Clock,
  Coins,
  CreditCard,
  DollarSign,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { toast } from "sonner";

interface DashboardData {
  total_clients: number;
  new_this_month: number;
  pending_kyc: number;
  active_financing: number;
  pending_applications: number;
  total_disbursed: number;
  payments_this_month: number;
  total_revenue: number;
}

const kpiConfig = [
  {
    key: "total_clients" as const,
    label: "Total Clients",
    icon: Users,
    format: "number",
  },
  {
    key: "new_this_month" as const,
    label: "New This Month",
    icon: UserPlus,
    format: "number",
  },
  {
    key: "pending_kyc" as const,
    label: "Pending KYC",
    icon: Shield,
    format: "number",
  },
  {
    key: "active_financing" as const,
    label: "Active Financing",
    icon: FileText,
    format: "number",
  },
  {
    key: "pending_applications" as const,
    label: "Pending Applications",
    icon: Clock,
    format: "number",
  },
  {
    key: "total_disbursed" as const,
    label: "Total Disbursed",
    icon: Coins,
    format: "currency",
  },
  {
    key: "payments_this_month" as const,
    label: "Payments This Month",
    icon: CreditCard,
    format: "currency",
  },
  {
    key: "total_revenue" as const,
    label: "Total Revenue",
    icon: DollarSign,
    format: "currency",
  },
];

function formatValue(value: number, format: string): string {
  if (format === "currency") {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value) + " PRN";
  }
  return new Intl.NumberFormat("en-US").format(value);
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get("/admin/dashboard/");
        setData(response.data);
      } catch (error) {
        toast.error("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of platform activity and key metrics.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? kpiConfig.map((kpi) => (
              <Card key={kpi.key}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20" />
                </CardContent>
              </Card>
            ))
          : kpiConfig.map((kpi) => (
              <Card key={kpi.key}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {kpi.label}
                  </CardTitle>
                  <kpi.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {data
                      ? formatValue(data[kpi.key], kpi.format)
                      : "--"}
                  </p>
                </CardContent>
              </Card>
            ))}
      </div>
    </div>
  );
}
