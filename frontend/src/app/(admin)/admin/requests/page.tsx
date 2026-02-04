"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  Eye,
  X,
  Loader2,
  Send,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface ClientRequest {
  id: number;
  subject: string;
  client_name: string;
  type: string;
  status: string;
  message: string;
  admin_response: string | null;
  created_at: string;
}

const statusColors: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  open: "warning",
  in_progress: "secondary",
  resolved: "success",
  closed: "default",
};

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ClientRequest | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [adminResponse, setAdminResponse] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      const response = await api.get("/admin/requests/");
      setRequests(response.data.results || response.data);
    } catch (error) {
      toast.error("Failed to load requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleReview = (request: ClientRequest) => {
    setSelectedRequest(request);
    setAdminResponse(request.admin_response || "");
    setNewStatus(request.status);
    setReviewOpen(true);
  };

  const handleSubmitResponse = async () => {
    if (!selectedRequest) return;

    if (!adminResponse.trim()) {
      toast.error("Please enter a response.");
      return;
    }

    setActionLoading(true);
    try {
      await api.patch(`/admin/requests/${selectedRequest.id}/`, {
        admin_response: adminResponse,
        status: newStatus,
      });
      toast.success("Response submitted successfully.");
      setReviewOpen(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      toast.error("Failed to submit response.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Request Management</h1>
        <p className="text-muted-foreground">
          Review and respond to client requests and inquiries.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Client Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No requests found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="max-w-[200px] truncate font-medium">
                      {request.subject}
                    </TableCell>
                    <TableCell>{request.client_name}</TableCell>
                    <TableCell className="capitalize">
                      {request.type?.replace(/_/g, " ") || "General"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusColors[request.status] || "default"}
                      >
                        {request.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(request.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReview(request)}
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

      {/* Review Panel */}
      {reviewOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Review Request</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReviewOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Request Details */}
              <div className="rounded-lg border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold">{selectedRequest.subject}</h3>
                  <Badge
                    variant={statusColors[selectedRequest.status] || "default"}
                  >
                    {selectedRequest.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <p className="mb-2 text-sm text-muted-foreground">
                  From: {selectedRequest.client_name} | Type:{" "}
                  {selectedRequest.type?.replace(/_/g, " ") || "General"} |{" "}
                  {new Date(selectedRequest.created_at).toLocaleDateString()}
                </p>
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="text-sm whitespace-pre-line">
                    {selectedRequest.message}
                  </p>
                </div>
              </div>

              {/* Admin Response */}
              <div className="rounded-lg border p-4">
                <h3 className="mb-3 font-semibold">Admin Response</h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="status">Update Status</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="response">Response</Label>
                    <Textarea
                      id="response"
                      placeholder="Type your response to the client..."
                      value={adminResponse}
                      onChange={(e) => setAdminResponse(e.target.value)}
                      rows={5}
                    />
                  </div>
                  <Button
                    className="w-full"
                    disabled={actionLoading}
                    onClick={handleSubmitResponse}
                  >
                    {actionLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Submit Response
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
