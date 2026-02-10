"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import {
  Loader2,
  DollarSign,
  CheckCircle2,
  CalendarClock,
  ShieldCheck,
  CreditCard,
  FileText,
  TrendingUp,
  ArrowRight,
  Wallet,
  ExternalLink,
} from "lucide-react";

interface Installment {
  id: string;
  installment_number: number;
  due_date: string;
  amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: string;
}

interface FinancingApplication {
  id: string;
  application_number: string;
  bronova_amount: number;
  monthly_installment: number;
  status: string;
  installments: Installment[];
}

interface Payment {
  id: string;
  transaction_reference: string;
  amount: number;
  payment_type: string;
  payment_method: string;
  status: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  client_id: string;
  kyc_status: string;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [financingApps, setFinancingApps] = useState<FinancingApplication[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const [profileRes, financingRes, paymentsRes] = await Promise.all([
          api.get("/users/me/"),
          api.get("/financing/"),
          api.get("/payments/"),
        ]);
        setProfile(profileRes.data);
        setFinancingApps(
          Array.isArray(financingRes.data) ? financingRes.data : financingRes.data.results || []
        );
        const paymentsList = Array.isArray(paymentsRes.data)
          ? paymentsRes.data
          : paymentsRes.data.results || [];
        setRecentPayments(paymentsList.slice(0, 5));
      } catch (error: any) {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeFinancing = financingApps.filter(
    (app) => app.status === "active" || app.status === "approved"
  );
  const totalActiveAmount = activeFinancing.reduce((sum, app) => sum + Number(app.bronova_amount || 0), 0);

  const completedPayments = recentPayments.filter((p) => p.status === "completed" || p.status === "confirmed");
  const totalPaid = completedPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  // Find the next upcoming installment across all active financing apps
  const upcomingInstallments = activeFinancing
    .flatMap((app) =>
      (app.installments || [])
        .filter((i) => i.status === "upcoming" || i.status === "due" || i.status === "overdue")
        .map((i) => ({ ...i, app }))
    )
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

  const nextInstallment = upcomingInstallments[0];
  const nextPaymentDate = nextInstallment
    ? new Date(nextInstallment.due_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "No upcoming";

  const kycStatus = profile?.kyc_status || "pending";

  const kycBadgeVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default" as const;
      case "pending":
      case "submitted":
        return "secondary" as const;
      case "rejected":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  const paymentStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
      case "confirmed":
        return "default" as const;
      case "pending":
        return "secondary" as const;
      case "failed":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  // Simple bar data from active financing for the chart placeholder
  const barData = activeFinancing.slice(0, 6).map((app) => ({
    label: app.application_number.slice(-6),
    amount: Number(app.monthly_installment || 0),
  }));
  const maxBarValue = Math.max(...barData.map((d) => d.amount), 1);

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            Welcome back, {profile?.first_name || user?.first_name || "User"}
          </CardTitle>
          <CardDescription>
            Client ID: <span className="font-mono font-medium">{profile?.client_id || "---"}</span>
            {" | "}
            Your financial dashboard overview
          </CardDescription>
        </CardHeader>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Financing</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalActiveAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeFinancing.length} active application{activeFinancing.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {completedPayments.length} completed payment{completedPayments.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Payment Due</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nextPaymentDate}</div>
            <p className="text-xs text-muted-foreground">
              {nextInstallment
                ? `$${Number(nextInstallment.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })} due`
                : "No active installments"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KYC Status</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="mb-1">
              <Badge variant={kycBadgeVariant(kycStatus)} className="text-sm">
                {kycStatus.charAt(0).toUpperCase() + kycStatus.slice(1)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {kycStatus === "approved"
                ? "Identity verified"
                : kycStatus === "submitted"
                  ? "Under review"
                  : "Verification required"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4">
              <Link href="/dashboard/financing">
                <TrendingUp className="h-5 w-5" />
                <span>Apply for Financing</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4">
              <Link href="/dashboard/payments">
                <CreditCard className="h-5 w-5" />
                <span>Make Payment</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4">
              <Link href="/dashboard/documents">
                <FileText className="h-5 w-5" />
                <span>View Documents</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4">
              <a href="https://capimax.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-5 w-5" />
                <span>Invest via CapiMax</span>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Payments Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Payments</CardTitle>
              <CardDescription>Your last 5 payments</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/payments">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No payments recorded yet
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-xs">
                        {payment.transaction_reference?.slice(0, 12) || "---"}
                      </TableCell>
                      <TableCell>
                        ${Number(payment.amount).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="capitalize">
                        {payment.payment_method?.replace("_", " ") || "---"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={paymentStatusVariant(payment.status)}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Installment Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Installments</CardTitle>
            <CardDescription>Active financing monthly payments</CardDescription>
          </CardHeader>
          <CardContent>
            {barData.length === 0 ? (
              <div className="flex h-48 items-center justify-center">
                <div className="text-center">
                  <Wallet className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No active financing to display
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {barData.map((item, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-mono text-muted-foreground">{item.label}</span>
                      <span className="font-medium">
                        ${item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${(item.amount / maxBarValue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
