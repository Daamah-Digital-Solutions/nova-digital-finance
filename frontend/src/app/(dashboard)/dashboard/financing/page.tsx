"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { StripeCheckout } from "@/components/payments/stripe-checkout";
import { CryptoPayment } from "@/components/payments/crypto-payment";
import {
  Loader2,
  Calculator,
  Plus,
  Eye,
  DollarSign,
  Calendar,
  Percent,
  TrendingUp,
  CheckCircle2,
  Circle,
  AlertTriangle,
  CreditCard,
  PenTool,
  Clock,
  ShieldAlert,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface FinancingApplication {
  id: string;
  application_number: string;
  bronova_amount: number;
  usd_equivalent: number;
  fee_percentage: number;
  fee_amount: number;
  repayment_period_months: number;
  monthly_installment: number;
  total_with_fee: number;
  status: string;
  created_at: string;
  installments?: Installment[];
}

interface Installment {
  id: string;
  installment_number: number;
  due_date: string;
  amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: string;
  paid_at: string | null;
}

const PERIOD_OPTIONS = [
  { value: "6", label: "6 months" },
  { value: "9", label: "9 months" },
  { value: "12", label: "12 months" },
  { value: "18", label: "18 months" },
  { value: "24", label: "24 months" },
  { value: "30", label: "30 months" },
  { value: "36", label: "36 months" },
];

// Fee is a one-time processing fee of 3-5% (uses ~4% as default estimate)
const DEFAULT_FEE_PERCENTAGE = 4;

const STATUS_STEPS = [
  { key: "submitted", label: "Apply" },
  { key: "pending_signature", label: "Sign" },
  { key: "pending_fee", label: "Pay Fee" },
  { key: "active", label: "Active" },
];

function getStepIndex(status: string): number {
  switch (status) {
    case "draft":
      return -1;
    case "pending_signature":
      return 1;
    case "signed":
    case "pending_fee":
    case "fee_paid":
      return 2;
    case "approved":
    case "active":
      return 3;
    case "completed":
      return 4;
    default:
      return 0;
  }
}

export default function FinancingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const actionParam = searchParams.get("action");
  const tabParam = searchParams.get("tab");
  const defaultTab = (actionParam === "pay-fee" || tabParam === "applications") ? "applications" : "calculator";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [applications, setApplications] = useState<FinancingApplication[]>([]);

  // KYC state
  const [kycStatus, setKycStatus] = useState<string>("pending");
  const [kycLoading, setKycLoading] = useState(true);

  // Calculator state
  const [calcAmount, setCalcAmount] = useState(10000);
  const [calcPeriod, setCalcPeriod] = useState("12");

  // Application dialog
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [acknowledgments, setAcknowledgments] = useState({
    terms: false,
    accuracy: false,
    repayment: false,
    fees: false,
  });

  // Detail dialog
  const [selectedApp, setSelectedApp] = useState<FinancingApplication | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fee payment dialog
  const [showFeeDialog, setShowFeeDialog] = useState(false);
  const [feePaymentApp, setFeePaymentApp] = useState<FinancingApplication | null>(null);
  const [feePaymentMethod, setFeePaymentMethod] = useState<"stripe" | "crypto" | null>(null);

  // Congratulations dialog
  const [showCongratsDialog, setShowCongratsDialog] = useState(false);
  const [congratsApp, setCongratsApp] = useState<FinancingApplication | null>(null);

  // Calculator computations: 1 PRN = 1 USD, one-time 3-5% processing fee
  const calcResults = useMemo(() => {
    const prnAmount = calcAmount; // PRN amount = USD equivalent
    const months = parseInt(calcPeriod);
    const feePercentage = DEFAULT_FEE_PERCENTAGE;
    const totalFee = (prnAmount * feePercentage) / 100;
    const monthlyInstallment = prnAmount / months; // Interest-free: divide evenly
    const totalCost = prnAmount + totalFee; // Total = PRN amount + processing fee

    return {
      prnAmount,
      months,
      totalFee,
      totalCost,
      monthlyInstallment,
      feePercentage,
    };
  }, [calcAmount, calcPeriod]);

  useEffect(() => {
    fetchApplications();
    fetchKycStatus();
  }, []);

  // Auto-open fee payment dialog when redirected from signatures page
  useEffect(() => {
    if (actionParam === "pay-fee" && !loading && applications.length > 0) {
      const pendingFeeApp = applications.find((a) => a.status === "pending_fee");
      if (pendingFeeApp) {
        openFeePayment(pendingFeeApp);
        // Clean URL
        router.replace("/dashboard/financing?tab=applications", { scroll: false });
      }
    }
  }, [actionParam, loading, applications]);

  // Show congrats after Stripe payment redirect
  useEffect(() => {
    const feePaid = searchParams.get("fee_paid");
    if (feePaid === "true" && !loading && applications.length > 0) {
      const activeApp = applications.find((a) => a.status === "active");
      if (activeApp) {
        setCongratsApp(activeApp);
        setShowCongratsDialog(true);
        router.replace("/dashboard/financing?tab=applications", { scroll: false });
      }
    }
  }, [loading, applications]);

  async function fetchKycStatus() {
    try {
      setKycLoading(true);
      const res = await api.get("/users/me/");
      setKycStatus(res.data.kyc_status || "pending");
    } catch {
      setKycStatus("pending");
    } finally {
      setKycLoading(false);
    }
  }

  const kycApproved = kycStatus === "approved";

  async function fetchApplications() {
    try {
      setLoading(true);
      const res = await api.get("/financing/");
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setApplications(data);
    } catch {
      toast.error("Failed to load financing applications");
    } finally {
      setLoading(false);
    }
  }

  async function fetchApplicationDetail(appId: string) {
    try {
      setLoadingDetail(true);
      const res = await api.get(`/financing/${appId}/`);
      setSelectedApp(res.data);
      setShowDetailDialog(true);
    } catch {
      toast.error("Failed to load application details");
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleSubmitApplication() {
    const allAcknowledged = Object.values(acknowledgments).every(Boolean);
    if (!allAcknowledged) {
      toast.error("Please acknowledge all terms before submitting");
      return;
    }

    if (!kycApproved) {
      toast.error("Please complete KYC verification before applying");
      return;
    }

    try {
      setSubmitting(true);

      // Step 1: Create DRAFT application
      const createRes = await api.post("/financing/", {
        bronova_amount: calcResults.prnAmount,
        repayment_period_months: calcResults.months,
        ack_terms: acknowledgments.terms,
        ack_fee_non_refundable: acknowledgments.fees,
        ack_repayment_schedule: acknowledgments.repayment,
        ack_risk_disclosure: acknowledgments.accuracy,
      });

      const appId = createRes.data.id;

      // Step 2: Immediately submit → transitions to PENDING_SIGNATURE
      await api.post(`/financing/${appId}/submit/`);

      toast.success("Application submitted! Redirecting to sign your contract...");
      setShowApplyDialog(false);
      setAcknowledgments({ terms: false, accuracy: false, repayment: false, fees: false });

      // Direct flow: go straight to signatures page
      router.push("/dashboard/signatures");
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || error?.response?.data?.error || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  }

  function openFeePayment(app: FinancingApplication) {
    setFeePaymentApp(app);
    setFeePaymentMethod(null);
    setShowFeeDialog(true);
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case "approved":
      case "active":
      case "completed":
        return "default" as const;
      case "pending_fee":
      case "fee_paid":
      case "pending_signature":
      case "signed":
      case "under_review":
        return "secondary" as const;
      case "rejected":
      case "defaulted":
        return "destructive" as const;
      case "draft":
        return "outline" as const;
      default:
        return "secondary" as const;
    }
  };

  const statusLabel = (status: string) => {
    return status
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const installmentStatusVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "default" as const;
      case "pending":
      case "upcoming":
      case "due":
        return "secondary" as const;
      case "overdue":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  if (loading || kycLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financing</h1>
          <p className="text-muted-foreground">Calculate, apply, and manage your financing</p>
        </div>
      </div>

      {/* KYC Gate Banner */}
      {!kycApproved && (
        <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="flex items-center gap-4 p-4">
            <ShieldAlert className="h-8 w-8 text-yellow-600 shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                KYC Verification Required
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                You must complete KYC verification before applying for financing.
                Your current KYC status: <strong>{statusLabel(kycStatus)}</strong>
              </p>
            </div>
            <Button asChild variant="outline" className="shrink-0">
              <Link href="/dashboard/kyc">Complete KYC</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="calculator">
            <Calculator className="mr-2 h-4 w-4" />
            Calculator
          </TabsTrigger>
          <TabsTrigger value="applications">
            <TrendingUp className="mr-2 h-4 w-4" />
            My Applications ({applications.length})
          </TabsTrigger>
        </TabsList>

        {/* Calculator Tab */}
        <TabsContent value="calculator" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Calculator Inputs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Financing Calculator
                </CardTitle>
                <CardDescription>
                  Calculate your monthly payments and total costs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="amount">How many PRN do you need?</Label>
                    <span className="text-sm font-medium">
                      {calcAmount.toLocaleString()} PRN
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">1 PRN = 1 USD</p>
                  <Input
                    id="amount-input"
                    type="number"
                    min={500}
                    max={100000}
                    step={500}
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(Number(e.target.value) || 500)}
                    className="mb-2"
                  />
                  <input
                    type="range"
                    min={500}
                    max={100000}
                    step={500}
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>500 PRN</span>
                    <span>100,000 PRN</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Repayment Period</Label>
                  <Select value={calcPeriod} onValueChange={setCalcPeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIOD_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Percent className="h-4 w-4" />
                    <span>
                      Processing Fee: <strong>3-5%</strong> (one-time, non-refundable)
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">
                    Interest-free repayment. You only pay the PRN amount in equal monthly installments.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Calculator Results */}
            <Card>
              <CardHeader>
                <CardTitle>Calculation Results</CardTitle>
                <CardDescription>Estimated costs based on your inputs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      PRN Amount
                    </div>
                    <p className="mt-1 text-2xl font-bold">
                      {calcResults.prnAmount.toLocaleString()} PRN
                    </p>
                    <p className="text-xs text-muted-foreground">
                      = ${calcResults.prnAmount.toLocaleString()} USD
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Monthly Installment
                    </div>
                    <p className="mt-1 text-2xl font-bold">
                      ${calcResults.monthlyInstallment.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Percent className="h-4 w-4" />
                      Processing Fee ({calcResults.feePercentage}%)
                    </div>
                    <p className="mt-1 text-2xl font-bold">
                      ${calcResults.totalFee.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      One-time, non-refundable
                    </p>
                  </div>
                  <div className="rounded-lg border bg-primary/5 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      Total Cost
                    </div>
                    <p className="mt-1 text-2xl font-bold text-primary">
                      ${calcResults.totalCost.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PRN amount + processing fee
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Interest-free. 1 PRN = 1 USD. Upon approval, you receive a Certificate of PRN Ownership for investment with CapiMax.
                </p>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setShowApplyDialog(true)}
                  disabled={!kycApproved}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {kycApproved ? "Apply for PRN Financing" : "Complete KYC to Apply"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Financing Applications</CardTitle>
              <CardDescription>
                View and manage your financing applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="py-12 text-center">
                  <TrendingUp className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">No financing applications yet</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowApplyDialog(true)}
                    disabled={!kycApproved}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Apply Now
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Application #</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Monthly Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell className="font-mono text-sm">
                          {app.application_number}
                        </TableCell>
                        <TableCell>
                          ${Number(app.bronova_amount).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>{app.repayment_period_months} months</TableCell>
                        <TableCell>
                          ${Number(app.monthly_installment).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(app.status)}>
                            {statusLabel(app.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(app.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          {app.status === "pending_signature" && (
                            <Button variant="default" size="sm" asChild>
                              <Link href="/dashboard/signatures">
                                <PenTool className="mr-1 h-4 w-4" />
                                Sign Contract
                              </Link>
                            </Button>
                          )}
                          {app.status === "pending_fee" && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => openFeePayment(app)}
                            >
                              <CreditCard className="mr-1 h-4 w-4" />
                              Pay Fee
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fetchApplicationDetail(app.id)}
                            disabled={loadingDetail}
                          >
                            {loadingDetail ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Eye className="mr-1 h-4 w-4" />
                                View
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Apply Dialog */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Apply for Financing</DialogTitle>
            <DialogDescription>
              Review your financing details and acknowledge the terms
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">PRN Amount</span>
                <span className="font-medium">{calcResults.prnAmount.toLocaleString()} PRN</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">USD Equivalent</span>
                <span className="font-medium">${calcResults.prnAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Repayment Period</span>
                <span className="font-medium">{calcResults.months} months</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Monthly Installment</span>
                <span className="font-medium">
                  ${calcResults.monthlyInstallment.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Processing Fee ({calcResults.feePercentage}%)</span>
                <span className="font-medium">${calcResults.totalFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-sm font-bold">
                <span>Total Cost</span>
                <span>${calcResults.totalCost.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Please acknowledge the following:</p>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="ack-terms"
                  checked={acknowledgments.terms}
                  onCheckedChange={(checked) =>
                    setAcknowledgments((prev) => ({ ...prev, terms: checked === true }))
                  }
                />
                <label htmlFor="ack-terms" className="text-sm leading-relaxed">
                  I have read and agree to the financing terms and conditions
                </label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="ack-accuracy"
                  checked={acknowledgments.accuracy}
                  onCheckedChange={(checked) =>
                    setAcknowledgments((prev) => ({ ...prev, accuracy: checked === true }))
                  }
                />
                <label htmlFor="ack-accuracy" className="text-sm leading-relaxed">
                  All information I have provided is accurate and complete
                </label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="ack-repayment"
                  checked={acknowledgments.repayment}
                  onCheckedChange={(checked) =>
                    setAcknowledgments((prev) => ({ ...prev, repayment: checked === true }))
                  }
                />
                <label htmlFor="ack-repayment" className="text-sm leading-relaxed">
                  I understand my obligation to make timely repayments as scheduled
                </label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="ack-fees"
                  checked={acknowledgments.fees}
                  onCheckedChange={(checked) =>
                    setAcknowledgments((prev) => ({ ...prev, fees: checked === true }))
                  }
                />
                <label htmlFor="ack-fees" className="text-sm leading-relaxed">
                  I understand the fee structure and total cost of financing
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowApplyDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitApplication}
                disabled={submitting || !Object.values(acknowledgments).every(Boolean)}
                className="flex-1"
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Application
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Application Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Application {selectedApp?.application_number}
            </DialogTitle>
            <DialogDescription>
              Financing details and installment schedule
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-6">
              {/* Status Stepper */}
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  {STATUS_STEPS.map((step, idx) => {
                    const currentIdx = getStepIndex(selectedApp.status);
                    const isCompleted = idx < currentIdx;
                    const isCurrent = idx === currentIdx;
                    const isRejected = selectedApp.status === "rejected";

                    return (
                      <div key={step.key} className="flex items-center">
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                              isRejected
                                ? "bg-destructive/10 text-destructive"
                                : isCompleted
                                ? "bg-primary text-primary-foreground"
                                : isCurrent
                                ? "bg-primary/20 text-primary ring-2 ring-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : isCurrent ? (
                              <Circle className="h-4 w-4 fill-current" />
                            ) : (
                              <Circle className="h-4 w-4" />
                            )}
                          </div>
                          <span
                            className={`mt-1 text-xs ${
                              isCompleted || isCurrent
                                ? "font-medium text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                        {idx < STATUS_STEPS.length - 1 && (
                          <div
                            className={`mx-1 h-0.5 w-6 sm:w-10 ${
                              idx < currentIdx ? "bg-primary" : "bg-muted"
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Contextual Action Banner */}
              {selectedApp.status === "draft" && (
                <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
                  <AlertTriangle className="h-5 w-5 text-blue-600 shrink-0" />
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    This application is a draft. Submit it to begin the financing process.
                  </p>
                </div>
              )}
              {selectedApp.status === "pending_signature" && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-950/30">
                  <div className="flex items-center gap-3">
                    <PenTool className="h-5 w-5 text-purple-600 shrink-0" />
                    <p className="text-sm text-purple-800 dark:text-purple-200">
                      Sign your financing contract to proceed.
                    </p>
                  </div>
                  <Button size="sm" asChild>
                    <Link href="/dashboard/signatures">Sign Contract</Link>
                  </Button>
                </div>
              )}
              {selectedApp.status === "pending_fee" && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950/30">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-yellow-600 shrink-0" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Pay the processing fee to activate your financing.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setShowDetailDialog(false);
                      openFeePayment(selectedApp);
                    }}
                  >
                    Pay Fee (${Number(selectedApp.fee_amount).toFixed(2)})
                  </Button>
                </div>
              )}
              {selectedApp.status === "active" && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/30">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Your financing is active. Make payments on time.
                    </p>
                  </div>
                  <Button size="sm" asChild>
                    <Link href="/dashboard/payments">Make a Payment</Link>
                  </Button>
                </div>
              )}
              {selectedApp.status === "completed" && (
                <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/30">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <p className="text-sm text-green-800 dark:text-green-200">
                    All payments completed. Thank you!
                  </p>
                </div>
              )}
              {selectedApp.status === "rejected" && (
                <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
                  <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                  <p className="text-sm text-red-800 dark:text-red-200">
                    This application was rejected. You may submit a new application.
                  </p>
                </div>
              )}

              {/* Summary */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Pronova Amount</p>
                  <p className="text-lg font-bold">
                    {Number(selectedApp.bronova_amount).toLocaleString()} PRN
                  </p>
                  <p className="text-xs text-muted-foreground">
                    = ${Number(selectedApp.bronova_amount).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Period</p>
                  <p className="text-lg font-bold">{selectedApp.repayment_period_months} months</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={statusVariant(selectedApp.status)} className="mt-1">
                    {statusLabel(selectedApp.status)}
                  </Badge>
                </div>
              </div>

              {/* Fee Details */}
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fee Rate</span>
                  <span>{selectedApp.fee_percentage}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Processing Fee</span>
                  <span>
                    ${Number(selectedApp.fee_amount).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monthly Installment</span>
                  <span className="font-medium">
                    ${Number(selectedApp.monthly_installment).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 text-sm font-bold">
                  <span>Total Cost (PRN + Fee)</span>
                  <span>
                    ${(Number(selectedApp.bronova_amount) + Number(selectedApp.fee_amount)).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              {/* Installment Schedule */}
              {selectedApp.installments && selectedApp.installments.length > 0 && (
                <div>
                  <h3 className="mb-3 font-semibold">Installment Schedule</h3>
                  <div className="max-h-64 overflow-y-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Paid</TableHead>
                          <TableHead>Remaining</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedApp.installments.map((inst) => (
                          <TableRow key={inst.id}>
                            <TableCell>{inst.installment_number}</TableCell>
                            <TableCell>
                              {new Date(inst.due_date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </TableCell>
                            <TableCell>${Number(inst.amount).toFixed(2)}</TableCell>
                            <TableCell>${Number(inst.paid_amount || 0).toFixed(2)}</TableCell>
                            <TableCell>${Number(inst.remaining_amount || inst.amount).toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant={installmentStatusVariant(inst.status)}>
                                {inst.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Fee Payment Dialog */}
      <Dialog open={showFeeDialog} onOpenChange={setShowFeeDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pay Processing Fee</DialogTitle>
            <DialogDescription>
              Pay the one-time processing fee for application {feePaymentApp?.application_number}
            </DialogDescription>
          </DialogHeader>

          {feePaymentApp && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Application</span>
                  <span className="font-mono">{feePaymentApp.application_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pronova Amount</span>
                  <span>{Number(feePaymentApp.bronova_amount).toLocaleString()} PRN</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t pt-2">
                  <span>Processing Fee</span>
                  <span>${Number(feePaymentApp.fee_amount).toFixed(2)}</span>
                </div>
              </div>

              {!feePaymentMethod && (
                <div className="space-y-3">
                  <Label>Select Payment Method</Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      onClick={() => setFeePaymentMethod("stripe")}
                      className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
                    >
                      <CreditCard className="h-6 w-6 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Card / Bank</p>
                        <p className="text-xs text-muted-foreground">
                          Pay via credit card or bank
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => setFeePaymentMethod("crypto")}
                      className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
                    >
                      <DollarSign className="h-6 w-6 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Cryptocurrency</p>
                        <p className="text-xs text-muted-foreground">
                          Pay with BTC, ETH, USDT
                        </p>
                      </div>
                    </button>
                  </div>
                  {/* DEV: Mock payment for testing */}
                  <Button
                    variant="outline"
                    className="w-full border-dashed border-orange-400 text-orange-600 hover:bg-orange-50"
                    onClick={async () => {
                      try {
                        const res = await api.post(`/financing/${feePaymentApp.id}/mock-pay-fee/`);
                        setShowFeeDialog(false);
                        setCongratsApp(res.data);
                        setShowCongratsDialog(true);
                        fetchApplications();
                      } catch (err: any) {
                        toast.error(err?.response?.data?.error || "Mock payment failed");
                      }
                    }}
                  >
                    [DEV] Mock Pay Fee (skip real payment)
                  </Button>
                </div>
              )}

              {feePaymentMethod === "stripe" && (
                <StripeCheckout
                  financingId={feePaymentApp.id}
                  paymentType="fee"
                  amount={Number(feePaymentApp.fee_amount)}
                  applicationNumber={feePaymentApp.application_number}
                  successUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/dashboard/financing?fee_paid=true`}
                  cancelUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/dashboard/financing?fee_cancelled=true`}
                />
              )}

              {feePaymentMethod === "crypto" && (
                <CryptoPayment
                  financingId={feePaymentApp.id}
                  paymentType="fee"
                  amount={Number(feePaymentApp.fee_amount)}
                />
              )}

              {feePaymentMethod && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFeePaymentMethod(null)}
                  className="w-full"
                >
                  Choose a different payment method
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Congratulations Dialog */}
      <Dialog open={showCongratsDialog} onOpenChange={setShowCongratsDialog}>
        <DialogContent className="max-w-md text-center">
          <div className="flex flex-col items-center space-y-6 py-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Congratulations!</h2>
              <p className="text-muted-foreground">
                Your financing has been activated successfully.
              </p>
            </div>

            {congratsApp && (
              <div className="w-full rounded-lg border bg-muted/30 p-4 space-y-2 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Application</span>
                  <span className="font-mono">{congratsApp.application_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pronova Amount</span>
                  <span className="font-medium">{Number(congratsApp.bronova_amount).toLocaleString()} PRN</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monthly Installment</span>
                  <span className="font-medium">
                    ${Number(congratsApp.monthly_installment).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Period</span>
                  <span className="font-medium">{congratsApp.repayment_period_months} months</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Your installment schedule is now active. You can view your documents and payment schedule from your dashboard.
            </p>

            <div className="flex w-full gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowCongratsDialog(false);
                  router.push("/dashboard/documents");
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                Download Documents
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setShowCongratsDialog(false);
                  router.push("/dashboard");
                }}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
