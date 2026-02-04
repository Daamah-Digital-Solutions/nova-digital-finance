"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
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
  CreditCard,
  History,
  CalendarClock,
  DollarSign,
  Bitcoin,
  Building2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

interface FinancingApplication {
  id: string;
  application_number: string;
  amount: number;
  status: string;
  installments?: Installment[];
}

interface Installment {
  id: string;
  installment_number: number;
  due_date: string;
  amount: number;
  status: string;
}

interface Payment {
  id: string;
  reference: string;
  amount: number;
  payment_type: string;
  payment_method: string;
  status: string;
  created_at: string;
  financing_application?: string;
  installment?: string;
}

interface ScheduledPayment {
  id: string;
  reference: string;
  amount: number;
  scheduled_date: string;
  status: string;
  financing_application_number: string;
}

export default function PaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [financingApps, setFinancingApps] = useState<FinancingApplication[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [scheduledPayments, setScheduledPayments] = useState<ScheduledPayment[]>([]);

  // Make Payment state
  const [selectedAppId, setSelectedAppId] = useState("");
  const [selectedInstallmentId, setSelectedInstallmentId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [financingRes, paymentsRes, scheduledRes] = await Promise.all([
        api.get("/financing/"),
        api.get("/payments/"),
        api.get("/payments/scheduled/").catch(() => ({ data: [] })),
      ]);

      const apps = Array.isArray(financingRes.data)
        ? financingRes.data
        : financingRes.data.results || [];
      setFinancingApps(apps.filter((a: FinancingApplication) => a.status === "active" || a.status === "approved"));

      const paymentsList = Array.isArray(paymentsRes.data)
        ? paymentsRes.data
        : paymentsRes.data.results || [];
      setPayments(paymentsList);

      const scheduled = Array.isArray(scheduledRes.data)
        ? scheduledRes.data
        : scheduledRes.data.results || [];
      setScheduledPayments(scheduled);
    } catch (error: any) {
      toast.error("Failed to load payment data");
    } finally {
      setLoading(false);
    }
  }

  const selectedApp = financingApps.find((a) => a.id === selectedAppId);
  const pendingInstallments =
    selectedApp?.installments?.filter(
      (i) => i.status === "pending" || i.status === "upcoming" || i.status === "overdue"
    ) || [];
  const selectedInstallment = pendingInstallments.find((i) => i.id === selectedInstallmentId);

  async function handleMakePayment() {
    if (!selectedAppId || !selectedInstallmentId || !paymentMethod) {
      toast.error("Please fill in all payment details");
      return;
    }

    try {
      setProcessing(true);
      await api.post("/payments/", {
        financing_application: selectedAppId,
        installment: selectedInstallmentId,
        payment_method: paymentMethod,
        amount: selectedInstallment?.amount,
      });
      toast.success("Payment submitted successfully!");
      setShowConfirmDialog(false);
      setSelectedAppId("");
      setSelectedInstallmentId("");
      setPaymentMethod("");
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Payment failed");
    } finally {
      setProcessing(false);
    }
  }

  async function handleCancelScheduled(paymentId: string) {
    try {
      await api.post(`/payments/scheduled/${paymentId}/cancel/`);
      toast.success("Scheduled payment cancelled");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to cancel scheduled payment");
    }
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case "completed":
      case "confirmed":
      case "paid":
        return "default" as const;
      case "pending":
      case "processing":
        return "secondary" as const;
      case "failed":
      case "cancelled":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "confirmed":
        return <CheckCircle2 className="h-3.5 w-3.5" />;
      case "pending":
      case "processing":
        return <Clock className="h-3.5 w-3.5" />;
      case "failed":
        return <XCircle className="h-3.5 w-3.5" />;
      default:
        return <AlertCircle className="h-3.5 w-3.5" />;
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
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-muted-foreground">Make payments and view your payment history</p>
      </div>

      <Tabs defaultValue="make-payment" className="space-y-6">
        <TabsList>
          <TabsTrigger value="make-payment">
            <CreditCard className="mr-2 h-4 w-4" />
            Make Payment
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-2 h-4 w-4" />
            Payment History
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            <CalendarClock className="mr-2 h-4 w-4" />
            Scheduled
          </TabsTrigger>
        </TabsList>

        {/* Make Payment Tab */}
        <TabsContent value="make-payment">
          <Card>
            <CardHeader>
              <CardTitle>Make a Payment</CardTitle>
              <CardDescription>
                Select your financing application and installment to make a payment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {financingApps.length === 0 ? (
                <div className="py-12 text-center">
                  <DollarSign className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">
                    No active financing applications to make payments for
                  </p>
                </div>
              ) : (
                <>
                  {/* Select Financing Application */}
                  <div className="space-y-2">
                    <Label>Financing Application</Label>
                    <Select value={selectedAppId} onValueChange={(val) => {
                      setSelectedAppId(val);
                      setSelectedInstallmentId("");
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select financing application" />
                      </SelectTrigger>
                      <SelectContent>
                        {financingApps.map((app) => (
                          <SelectItem key={app.id} value={app.id}>
                            {app.application_number} - $
                            {Number(app.amount).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Select Installment */}
                  {selectedAppId && (
                    <div className="space-y-2">
                      <Label>Installment</Label>
                      {pendingInstallments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No pending installments for this application
                        </p>
                      ) : (
                        <Select
                          value={selectedInstallmentId}
                          onValueChange={setSelectedInstallmentId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select installment" />
                          </SelectTrigger>
                          <SelectContent>
                            {pendingInstallments.map((inst) => (
                              <SelectItem key={inst.id} value={inst.id}>
                                #{inst.installment_number} - Due{" "}
                                {new Date(inst.due_date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })} - ${Number(inst.amount).toFixed(2)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}

                  {/* Payment Method */}
                  {selectedInstallmentId && (
                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <button
                          onClick={() => setPaymentMethod("card_bank")}
                          className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                            paymentMethod === "card_bank"
                              ? "border-primary bg-primary/5"
                              : "hover:bg-muted/50"
                          }`}
                        >
                          <Building2
                            className={`h-6 w-6 ${
                              paymentMethod === "card_bank"
                                ? "text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                          <div>
                            <p className="font-medium">Card / Bank Transfer</p>
                            <p className="text-xs text-muted-foreground">
                              Pay via credit card or bank transfer
                            </p>
                          </div>
                        </button>
                        <button
                          onClick={() => setPaymentMethod("crypto")}
                          className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                            paymentMethod === "crypto"
                              ? "border-primary bg-primary/5"
                              : "hover:bg-muted/50"
                          }`}
                        >
                          <Bitcoin
                            className={`h-6 w-6 ${
                              paymentMethod === "crypto"
                                ? "text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                          <div>
                            <p className="font-medium">Cryptocurrency</p>
                            <p className="text-xs text-muted-foreground">
                              Pay with USDT, USDC, or BTC
                            </p>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Amount Display and Pay */}
                  {selectedInstallment && paymentMethod && (
                    <div className="space-y-4">
                      <div className="rounded-lg border bg-muted/50 p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Amount to Pay</span>
                          <span className="text-2xl font-bold">
                            ${Number(selectedInstallment.amount).toFixed(2)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            Method: {paymentMethod === "card_bank" ? "Card/Bank" : "Crypto"}
                          </span>
                          <span>
                            Due: {new Date(selectedInstallment.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="lg"
                        className="w-full"
                        onClick={() => setShowConfirmDialog(true)}
                      >
                        <DollarSign className="mr-2 h-4 w-4" />
                        Pay ${Number(selectedInstallment.amount).toFixed(2)}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Your complete payment history</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="py-12 text-center">
                  <History className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">No payment history yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {new Date(payment.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {payment.reference?.slice(0, 16) || "---"}
                        </TableCell>
                        <TableCell className="capitalize">
                          {payment.payment_type?.replace("_", " ") || "---"}
                        </TableCell>
                        <TableCell className="capitalize">
                          {payment.payment_method?.replace("_", " ") || "---"}
                        </TableCell>
                        <TableCell className="font-medium">
                          ${Number(payment.amount).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusVariant(payment.status)}
                            className="gap-1"
                          >
                            {statusIcon(payment.status)}
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
        </TabsContent>

        {/* Scheduled Tab */}
        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Payments</CardTitle>
              <CardDescription>Upcoming automated payments</CardDescription>
            </CardHeader>
            <CardContent>
              {scheduledPayments.length === 0 ? (
                <div className="py-12 text-center">
                  <CalendarClock className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">No scheduled payments</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scheduledPayments.map((sp) => (
                    <div
                      key={sp.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            ${Number(sp.amount).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                          <Badge variant={statusVariant(sp.status)}>{sp.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {sp.financing_application_number} | Scheduled for{" "}
                          {new Date(sp.scheduled_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          Ref: {sp.reference}
                        </p>
                      </div>
                      {(sp.status === "pending" || sp.status === "scheduled") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelScheduled(sp.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Please confirm the following payment details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Application</span>
                <span className="font-mono">{selectedApp?.application_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Installment</span>
                <span>#{selectedInstallment?.installment_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Due Date</span>
                <span>
                  {selectedInstallment
                    ? new Date(selectedInstallment.due_date).toLocaleDateString()
                    : "---"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Method</span>
                <span className="capitalize">
                  {paymentMethod === "card_bank" ? "Card / Bank Transfer" : "Cryptocurrency"}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2 text-lg font-bold">
                <span>Amount</span>
                <span>${Number(selectedInstallment?.amount || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleMakePayment}
                disabled={processing}
                className="flex-1"
              >
                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
