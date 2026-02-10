"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Plus,
  MessageSquare,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  ArrowUpRight,
  Inbox,
} from "lucide-react";

interface ClientRequest {
  id: string;
  request_type: string;
  subject: string;
  description: string;
  status: string;
  admin_response: string | null;
  financing_application: string | null;
  financing_application_number: string | null;
  created_at: string;
  updated_at: string;
}

interface FinancingApplication {
  id: string;
  application_number: string;
  bronova_amount: number;
  status: string;
}

const REQUEST_TYPES = [
  { value: "loan_increase", label: "Loan Increase" },
  { value: "settlement", label: "Early Settlement" },
  { value: "transfer", label: "Account Transfer" },
  { value: "deferral", label: "Payment Deferral" },
];

export default function RequestsPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [financingApps, setFinancingApps] = useState<FinancingApplication[]>([]);

  // New request form
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [requestType, setRequestType] = useState("");
  const [selectedAppId, setSelectedAppId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  // Detail view
  const [selectedRequest, setSelectedRequest] = useState<ClientRequest | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [requestsRes, financingRes] = await Promise.all([
        api.get("/requests/"),
        api.get("/financing/"),
      ]);

      const reqData = Array.isArray(requestsRes.data)
        ? requestsRes.data
        : requestsRes.data.results || [];
      setRequests(reqData);

      const appData = Array.isArray(financingRes.data)
        ? financingRes.data
        : financingRes.data.results || [];
      setFinancingApps(appData);
    } catch (error: any) {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setRequestType("");
    setSelectedAppId("");
    setSubject("");
    setDescription("");
  }

  async function handleSubmitRequest() {
    if (!requestType) {
      toast.error("Please select a request type");
      return;
    }
    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }
    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/requests/", {
        request_type: requestType,
        financing_application: selectedAppId || null,
        subject: subject.trim(),
        description: description.trim(),
      });
      toast.success("Request submitted successfully!");
      setShowNewDialog(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  }

  function viewDetail(request: ClientRequest) {
    setSelectedRequest(request);
    setShowDetailDialog(true);
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case "resolved":
      case "completed":
      case "approved":
        return "default" as const;
      case "pending":
      case "open":
        return "secondary" as const;
      case "in_progress":
      case "under_review":
        return "outline" as const;
      case "rejected":
      case "closed":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "resolved":
      case "completed":
      case "approved":
        return <CheckCircle2 className="h-3.5 w-3.5" />;
      case "pending":
      case "open":
        return <Clock className="h-3.5 w-3.5" />;
      case "in_progress":
      case "under_review":
        return <ArrowUpRight className="h-3.5 w-3.5" />;
      case "rejected":
      case "closed":
        return <XCircle className="h-3.5 w-3.5" />;
      default:
        return <AlertCircle className="h-3.5 w-3.5" />;
    }
  };

  const formatRequestType = (type: string) => {
    return REQUEST_TYPES.find((t) => t.value === type)?.label || type.replace(/_/g, " ");
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
          <h1 className="text-2xl font-bold">Client Requests</h1>
          <p className="text-muted-foreground">Submit and track your requests</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Request
        </Button>
      </div>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>My Requests</CardTitle>
          <CardDescription>
            All your submitted requests and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="py-12 text-center">
              <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">No requests submitted yet</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowNewDialog(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Submit Your First Request
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Application</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <span className="text-sm font-medium capitalize">
                        {formatRequestType(req.request_type)}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {req.subject}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {req.financing_application_number || "---"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(req.status)} className="gap-1">
                        {statusIcon(req.status)}
                        {req.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(req.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewDetail(req)}
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New Request Dialog */}
      <Dialog
        open={showNewDialog}
        onOpenChange={(open) => {
          setShowNewDialog(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Request</DialogTitle>
            <DialogDescription>
              Submit a new request to our team. We will review and respond within 1-3 business days.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Request Type *</Label>
              <Select value={requestType} onValueChange={setRequestType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select request type" />
                </SelectTrigger>
                <SelectContent>
                  {REQUEST_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Financing Application (optional)</Label>
              <Select value={selectedAppId} onValueChange={setSelectedAppId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select application (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {financingApps.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.application_number} - $
                      {Number(app.bronova_amount).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="req-subject">Subject *</Label>
              <Input
                id="req-subject"
                placeholder="Brief summary of your request"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="req-description">Description *</Label>
              <Textarea
                id="req-description"
                placeholder="Provide detailed information about your request..."
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewDialog(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitRequest}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>
              {selectedRequest
                ? formatRequestType(selectedRequest.request_type)
                : "Request details"}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={statusVariant(selectedRequest.status)} className="gap-1">
                  {statusIcon(selectedRequest.status)}
                  {selectedRequest.status.replace(/_/g, " ")}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Submitted{" "}
                  {new Date(selectedRequest.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Type</span>
                  <p className="text-sm capitalize">
                    {formatRequestType(selectedRequest.request_type)}
                  </p>
                </div>

                {selectedRequest.financing_application_number && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">
                      Financing Application
                    </span>
                    <p className="font-mono text-sm">
                      {selectedRequest.financing_application_number}
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-xs font-medium text-muted-foreground">Subject</span>
                  <p className="text-sm font-medium">{selectedRequest.subject}</p>
                </div>

                <div>
                  <span className="text-xs font-medium text-muted-foreground">Description</span>
                  <p className="whitespace-pre-wrap text-sm">{selectedRequest.description}</p>
                </div>
              </div>

              {/* Admin Response */}
              {selectedRequest.admin_response && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Admin Response</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">
                    {selectedRequest.admin_response}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Last updated{" "}
                    {new Date(selectedRequest.updated_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}

              {!selectedRequest.admin_response &&
                (selectedRequest.status === "pending" || selectedRequest.status === "open") && (
                  <div className="rounded-lg border bg-muted/50 p-4 text-center">
                    <Clock className="mx-auto h-6 w-6 text-muted-foreground" />
                    <p className="mt-1 text-sm text-muted-foreground">
                      Awaiting admin response
                    </p>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
