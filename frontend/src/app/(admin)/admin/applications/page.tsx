"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

interface Application {
  id: number;
  application_number: string;
  client_name: string;
  amount: number;
  period_months: number;
  processing_fee: number;
  status: string;
  created_at: string;
}

const statusColors: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  draft: "default",
  submitted: "warning",
  under_review: "secondary",
  approved: "success",
  rejected: "destructive",
  cancelled: "default",
  disbursed: "success",
};

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchApplications = async () => {
    try {
      const params: Record<string, string> = {};
      if (statusFilter && statusFilter !== "all") params.status = statusFilter;

      const response = await api.get("/admin/applications/", { params });
      setApplications(response.data.results || response.data);
    } catch (error) {
      toast.error("Failed to load applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const handleAction = async (id: number, action: "approve" | "reject") => {
    setActionLoading(id);
    try {
      await api.post(`/admin/applications/${id}/${action}/`);
      toast.success(
        `Application ${action === "approve" ? "approved" : "rejected"} successfully.`
      );
      fetchApplications();
    } catch (error) {
      toast.error(`Failed to ${action} application.`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Application Management</h1>
        <p className="text-muted-foreground">
          Review and manage financing applications.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Applications
            </CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="disbursed">Disbursed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : applications.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No applications found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>App Number</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount (PRN)</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Fee (PRN)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-mono text-sm">
                      {app.application_number}
                    </TableCell>
                    <TableCell className="font-medium">
                      {app.client_name}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("en-US").format(app.amount)}
                    </TableCell>
                    <TableCell>{app.period_months} months</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("en-US", {
                        minimumFractionDigits: 2,
                      }).format(app.processing_fee)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusColors[app.status] || "default"}
                      >
                        {app.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(app.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {(app.status === "submitted" ||
                        app.status === "under_review") && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-green-600 hover:bg-green-50 hover:text-green-700"
                            disabled={actionLoading === app.id}
                            onClick={() => handleAction(app.id, "approve")}
                          >
                            {actionLoading === app.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                            disabled={actionLoading === app.id}
                            onClick={() => handleAction(app.id, "reject")}
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
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
