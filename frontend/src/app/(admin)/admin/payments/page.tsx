"use client";

import { useState, useEffect } from "react";
import { CreditCard, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api";
import { toast } from "sonner";

interface Payment {
  id: number;
  reference: string;
  client_name: string;
  type: string;
  method: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

const statusColors: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  pending: "warning",
  processing: "secondary",
  completed: "success",
  failed: "destructive",
  refunded: "default",
};

const typeLabels: Record<string, string> = {
  processing_fee: "Processing Fee",
  repayment: "Repayment",
  refund: "Refund",
};

const methodLabels: Record<string, string> = {
  card: "Card",
  bank_transfer: "Bank Transfer",
  crypto: "Crypto",
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const params: Record<string, string> = {};
        if (typeFilter && typeFilter !== "all") params.type = typeFilter;
        if (methodFilter && methodFilter !== "all") params.method = methodFilter;
        if (statusFilter && statusFilter !== "all") params.status = statusFilter;

        const response = await api.get("/admin/payments/", { params });
        setPayments(response.data.results || response.data);
      } catch (error) {
        toast.error("Failed to load payments.");
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [typeFilter, methodFilter, statusFilter]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Payment Management</h1>
        <p className="text-muted-foreground">
          View and manage all platform payments.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payments
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="processing_fee">Processing Fee</SelectItem>
                  <SelectItem value="repayment">Repayment</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                </SelectContent>
              </Select>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No payments found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-sm">
                      {payment.reference}
                    </TableCell>
                    <TableCell className="font-medium">
                      {payment.client_name}
                    </TableCell>
                    <TableCell>
                      {typeLabels[payment.type] || payment.type}
                    </TableCell>
                    <TableCell>
                      {methodLabels[payment.method] || payment.method}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(payment.amount)}{" "}
                      {payment.currency || "PRN"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusColors[payment.status] || "default"}
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(payment.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
