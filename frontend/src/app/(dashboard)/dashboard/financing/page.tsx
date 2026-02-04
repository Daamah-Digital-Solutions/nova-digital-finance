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
import {
  Loader2,
  Calculator,
  Plus,
  Eye,
  DollarSign,
  Calendar,
  Percent,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

interface FinancingApplication {
  id: string;
  application_number: string;
  amount: number;
  period_months: number;
  monthly_payment: number;
  fee_percentage: number;
  total_fee: number;
  total_amount: number;
  status: string;
  created_at: string;
  installments?: Installment[];
}

interface Installment {
  id: string;
  installment_number: number;
  due_date: string;
  amount: number;
  principal: number;
  fee: number;
  status: string;
  paid_date: string | null;
}

const PERIOD_OPTIONS = [
  { value: "6", label: "6 months" },
  { value: "12", label: "12 months" },
  { value: "18", label: "18 months" },
  { value: "24", label: "24 months" },
  { value: "36", label: "36 months" },
];

const FEE_RATE = 0.08; // 8% annual fee rate

export default function FinancingPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [applications, setApplications] = useState<FinancingApplication[]>([]);

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

  // Calculator computations
  const calcResults = useMemo(() => {
    const amount = calcAmount;
    const months = parseInt(calcPeriod);
    const annualRate = FEE_RATE;
    const totalFee = amount * annualRate * (months / 12);
    const totalAmount = amount + totalFee;
    const monthlyPayment = totalAmount / months;
    const feePercentage = (totalFee / amount) * 100;

    return {
      amount,
      months,
      totalFee,
      totalAmount,
      monthlyPayment,
      feePercentage,
    };
  }, [calcAmount, calcPeriod]);

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    try {
      setLoading(true);
      const res = await api.get("/financing/");
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setApplications(data);
    } catch (error: any) {
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
    } catch (error: any) {
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

    try {
      setSubmitting(true);
      await api.post("/financing/", {
        amount: calcResults.amount,
        period_months: calcResults.months,
      });
      toast.success("Financing application submitted successfully!");
      setShowApplyDialog(false);
      setAcknowledgments({ terms: false, accuracy: false, repayment: false, fees: false });
      fetchApplications();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case "approved":
      case "active":
        return "default" as const;
      case "pending":
      case "under_review":
        return "secondary" as const;
      case "rejected":
      case "defaulted":
        return "destructive" as const;
      case "completed":
        return "outline" as const;
      default:
        return "secondary" as const;
    }
  };

  const installmentStatusVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "default" as const;
      case "pending":
      case "upcoming":
        return "secondary" as const;
      case "overdue":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  if (loading) {
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

      <Tabs defaultValue="calculator" className="space-y-6">
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
                    <Label htmlFor="amount">Financing Amount (USD)</Label>
                    <span className="text-sm font-medium">
                      ${calcAmount.toLocaleString()}
                    </span>
                  </div>
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
                    <span>$500</span>
                    <span>$100,000</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Financing Period</Label>
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

                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Percent className="h-4 w-4" />
                    <span>
                      Annual Fee Rate: <strong>{(FEE_RATE * 100).toFixed(1)}%</strong>
                    </span>
                  </div>
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
                      Monthly Payment
                    </div>
                    <p className="mt-1 text-2xl font-bold">
                      ${calcResults.monthlyPayment.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Period
                    </div>
                    <p className="mt-1 text-2xl font-bold">{calcResults.months} months</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Percent className="h-4 w-4" />
                      Total Fee
                    </div>
                    <p className="mt-1 text-2xl font-bold">
                      ${calcResults.totalFee.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {calcResults.feePercentage.toFixed(1)}% of principal
                    </p>
                  </div>
                  <div className="rounded-lg border bg-primary/5 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      Total Amount
                    </div>
                    <p className="mt-1 text-2xl font-bold text-primary">
                      ${calcResults.totalAmount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setShowApplyDialog(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Apply for Financing
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
                          ${Number(app.amount).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>{app.period_months} months</TableCell>
                        <TableCell>
                          ${Number(app.monthly_payment).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(app.status)}>
                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(app.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-right">
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
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">${calcResults.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Period</span>
                <span className="font-medium">{calcResults.months} months</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Monthly Payment</span>
                <span className="font-medium">
                  ${calcResults.monthlyPayment.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Fee</span>
                <span className="font-medium">${calcResults.totalFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-sm font-bold">
                <span>Total Amount</span>
                <span>${calcResults.totalAmount.toFixed(2)}</span>
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
              {/* Summary */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="text-lg font-bold">
                    ${Number(selectedApp.amount).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Period</p>
                  <p className="text-lg font-bold">{selectedApp.period_months} months</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={statusVariant(selectedApp.status)} className="mt-1">
                    {selectedApp.status.charAt(0).toUpperCase() + selectedApp.status.slice(1)}
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
                  <span className="text-muted-foreground">Total Fee</span>
                  <span>
                    ${Number(selectedApp.total_fee).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monthly Payment</span>
                  <span className="font-medium">
                    ${Number(selectedApp.monthly_payment).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 text-sm font-bold">
                  <span>Total Amount</span>
                  <span>
                    ${Number(selectedApp.total_amount).toLocaleString("en-US", {
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
                          <TableHead>Principal</TableHead>
                          <TableHead>Fee</TableHead>
                          <TableHead>Total</TableHead>
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
                            <TableCell>${Number(inst.principal).toFixed(2)}</TableCell>
                            <TableCell>${Number(inst.fee).toFixed(2)}</TableCell>
                            <TableCell className="font-medium">
                              ${Number(inst.amount).toFixed(2)}
                            </TableCell>
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
    </div>
  );
}
