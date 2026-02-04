"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  X,
  FileText,
  User,
  Mail,
  Calendar,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from "@/lib/api";
import { toast } from "sonner";

interface KYCSubmission {
  id: number;
  client_name: string;
  client_email: string;
  status: string;
  submitted_at: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  nationality?: string;
  address?: string;
  id_type?: string;
  id_number?: string;
  id_document_url?: string;
  proof_of_address_url?: string;
  selfie_url?: string;
}

const statusColors: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  submitted: "warning",
  under_review: "secondary",
  approved: "success",
  rejected: "destructive",
};

export default function AdminKYCPage() {
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedKYC, setSelectedKYC] = useState<KYCSubmission | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSubmissions = async () => {
    try {
      const params: Record<string, string> = {};
      if (statusFilter && statusFilter !== "all") params.status = statusFilter;

      const response = await api.get("/admin/kyc/", { params });
      setSubmissions(response.data.results || response.data);
    } catch (error) {
      toast.error("Failed to load KYC submissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter]);

  const handleReview = async (kyc: KYCSubmission) => {
    setSelectedKYC(kyc);
    setRejectionReason("");
    setReviewOpen(true);

    // Fetch full KYC details
    try {
      const response = await api.get(`/admin/kyc/${kyc.id}/`);
      setSelectedKYC(response.data);
    } catch (error) {
      toast.error("Failed to load KYC details.");
    }
  };

  const handleAction = async (action: "approve" | "reject") => {
    if (!selectedKYC) return;

    if (action === "reject" && !rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection.");
      return;
    }

    setActionLoading(true);
    try {
      await api.post(`/admin/kyc/${selectedKYC.id}/${action}/`, {
        reason: rejectionReason || undefined,
      });
      toast.success(
        `KYC ${action === "approve" ? "approved" : "rejected"} successfully.`
      );
      setReviewOpen(false);
      setSelectedKYC(null);
      fetchSubmissions();
    } catch (error) {
      toast.error(`Failed to ${action} KYC.`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">KYC Review</h1>
        <p className="text-muted-foreground">
          Review and manage client KYC submissions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              KYC Submissions
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
          ) : submissions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No KYC submissions found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((kyc) => (
                  <TableRow key={kyc.id}>
                    <TableCell className="font-medium">
                      {kyc.client_name}
                    </TableCell>
                    <TableCell>{kyc.client_email}</TableCell>
                    <TableCell>
                      <Badge variant={statusColors[kyc.status] || "default"}>
                        {kyc.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(kyc.submitted_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReview(kyc)}
                      >
                        <Eye className="mr-1 h-3 w-3" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      {reviewOpen && selectedKYC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">KYC Review</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReviewOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Client Info */}
              <div className="rounded-lg border p-4">
                <h3 className="mb-3 font-semibold">Client Information</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Full Name</p>
                      <p className="text-sm font-medium">
                        {selectedKYC.first_name} {selectedKYC.last_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium">
                        {selectedKYC.client_email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Date of Birth
                      </p>
                      <p className="text-sm font-medium">
                        {selectedKYC.date_of_birth || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Nationality
                      </p>
                      <p className="text-sm font-medium">
                        {selectedKYC.nationality || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
                {selectedKYC.address && (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="text-sm font-medium">{selectedKYC.address}</p>
                  </div>
                )}
              </div>

              {/* ID Information */}
              <div className="rounded-lg border p-4">
                <h3 className="mb-3 font-semibold">Identification</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">ID Type</p>
                    <p className="text-sm font-medium">
                      {selectedKYC.id_type || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">ID Number</p>
                    <p className="text-sm font-medium font-mono">
                      {selectedKYC.id_number || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="rounded-lg border p-4">
                <h3 className="mb-3 font-semibold">Uploaded Documents</h3>
                <div className="space-y-2">
                  {selectedKYC.id_document_url && (
                    <a
                      href={selectedKYC.id_document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-md border p-2 text-sm hover:bg-muted"
                    >
                      <FileText className="h-4 w-4 text-primary" />
                      ID Document
                    </a>
                  )}
                  {selectedKYC.proof_of_address_url && (
                    <a
                      href={selectedKYC.proof_of_address_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-md border p-2 text-sm hover:bg-muted"
                    >
                      <FileText className="h-4 w-4 text-primary" />
                      Proof of Address
                    </a>
                  )}
                  {selectedKYC.selfie_url && (
                    <a
                      href={selectedKYC.selfie_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-md border p-2 text-sm hover:bg-muted"
                    >
                      <FileText className="h-4 w-4 text-primary" />
                      Selfie
                    </a>
                  )}
                </div>
              </div>

              {/* Actions */}
              {(selectedKYC.status === "submitted" ||
                selectedKYC.status === "under_review") && (
                <div className="rounded-lg border p-4">
                  <h3 className="mb-3 font-semibold">Review Actions</h3>
                  <div className="mb-4 space-y-2">
                    <Label htmlFor="rejection-reason">
                      Rejection Reason (required for rejection)
                    </Label>
                    <Textarea
                      id="rejection-reason"
                      placeholder="Enter reason for rejection..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      className="flex-1"
                      disabled={actionLoading}
                      onClick={() => handleAction("approve")}
                    >
                      {actionLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      disabled={actionLoading}
                      onClick={() => handleAction("reject")}
                    >
                      {actionLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4" />
                      )}
                      Reject
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
