"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
  PenTool,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface SignatureRequest {
  id: string;
  document_title: string;
  document_type: string;
  document_id: string;
  document_number: string;
  status: string;
  expires_at: string;
  created_at: string;
}

export default function SignaturesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [requests, setRequests] = useState<SignatureRequest[]>([]);

  // Signing dialog state
  const [selectedRequest, setSelectedRequest] = useState<SignatureRequest | null>(null);
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [signatureText, setSignatureText] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    try {
      setLoading(true);
      const res = await api.get("/signatures/pending/");
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setRequests(data);
    } catch (error: any) {
      toast.error("Failed to load signature requests");
    } finally {
      setLoading(false);
    }
  }

  function openSignDialog(request: SignatureRequest) {
    setSelectedRequest(request);
    setShowSignDialog(true);
    setConsentChecked(false);
    setSignatureText("");
  }

  function base64ToBlob(base64: string, contentType: string): Blob {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: contentType });
  }

  async function handleViewContract(request: SignatureRequest) {
    try {
      const res = await api.get(`/documents/${request.document_id}/download/`);
      const blob = base64ToBlob(res.data.data, res.data.content_type || "application/pdf");
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (error: any) {
      toast.error("Failed to open document");
    }
  }

  async function handleSign() {
    if (!selectedRequest) return;

    if (!signatureText.trim()) {
      toast.error("Please type your full name as signature");
      return;
    }

    if (!consentChecked) {
      toast.error("Please confirm the consent checkbox");
      return;
    }

    try {
      setSigning(true);

      await api.post(`/signatures/${selectedRequest.id}/sign/`, {
        signature_text: signatureText.trim(),
        consent_text:
          "I hereby confirm that I have reviewed the document in its entirety and agree to be legally bound by its terms. I understand that this electronic signature has the same legal effect as a handwritten signature.",
      });

      toast.success("Document signed successfully!");
      setShowSignDialog(false);
      setSelectedRequest(null);

      // Refresh list to check if more documents need signing
      const res = await api.get("/signatures/pending/");
      const remaining = Array.isArray(res.data) ? res.data : res.data.results || [];

      if (remaining.length > 0) {
        setRequests(remaining);
        toast.info(`${remaining.length} more document(s) to sign`);
      } else {
        // All documents signed - go to fee payment
        toast.success("All documents signed! Redirecting to pay processing fee...");
        router.push("/dashboard/financing?action=pay-fee");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to sign document");
    } finally {
      setSigning(false);
    }
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case "signed":
      case "completed":
        return "default" as const;
      case "pending":
        return "secondary" as const;
      case "expired":
      case "rejected":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "signed":
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "expired":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === "pending" && !isExpired(r.expires_at));
  const otherRequests = requests.filter((r) => r.status !== "pending" || isExpired(r.expires_at));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Signatures</h1>
        <p className="text-muted-foreground">Review and sign pending documents</p>
      </div>

      {/* Pending Signature Requests */}
      {pendingRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Pending Signatures ({pendingRequests.length})</h2>
          {pendingRequests.map((request) => (
            <Card key={request.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                    <PenTool className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">{request.document_title}</h3>
                    <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="capitalize">
                        {request.document_type?.replace(/_/g, " ") || "Document"}
                      </span>
                      <span>|</span>
                      <span>
                        Expires{" "}
                        {new Date(request.expires_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <Badge variant="secondary" className="mt-2">
                      Pending
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleViewContract(request)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Contract
                  </Button>
                  <Button onClick={() => openSignDialog(request)}>
                    <PenTool className="mr-2 h-4 w-4" />
                    Sign
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Pending Requests */}
      {pendingRequests.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
            <p className="mt-2 font-medium">All caught up!</p>
            <p className="text-sm text-muted-foreground">
              No pending signature requests at this time
            </p>
          </CardContent>
        </Card>
      )}

      {/* Completed / Expired Requests */}
      {otherRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Previous Requests</h2>
          {otherRequests.map((request) => (
            <Card key={request.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                    {statusIcon(isExpired(request.expires_at) ? "expired" : request.status)}
                  </div>
                  <div>
                    <h3 className="font-medium">{request.document_title}</h3>
                    <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="capitalize">
                        {request.document_type?.replace(/_/g, " ") || "Document"}
                      </span>
                      <span>|</span>
                      <span>
                        Created{" "}
                        {new Date(request.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <Badge
                      variant={statusVariant(
                        isExpired(request.expires_at) ? "expired" : request.status
                      )}
                      className="mt-2"
                    >
                      {isExpired(request.expires_at)
                        ? "Expired"
                        : request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Signing Dialog */}
      <Dialog
        open={showSignDialog}
        onOpenChange={(open) => {
          setShowSignDialog(open);
          if (!open) {
            setSelectedRequest(null);
            setConsentChecked(false);
            setSignatureText("");
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Sign Document</DialogTitle>
            <DialogDescription>
              {selectedRequest?.document_title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Document Preview */}
            <div className="rounded-lg border bg-muted/30 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{selectedRequest?.document_title}</p>
                    <p className="text-sm capitalize text-muted-foreground">
                      {selectedRequest?.document_type?.replace(/_/g, " ") || "Document"}
                    </p>
                  </div>
                </div>
                {selectedRequest && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewContract(selectedRequest)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Contract
                  </Button>
                )}
              </div>
            </div>

            {/* Signature Input */}
            <div className="space-y-2">
              <Label htmlFor="signature-text">Type Your Full Name as Signature</Label>
              <Input
                id="signature-text"
                placeholder="Enter your full legal name"
                value={signatureText}
                onChange={(e) => setSignatureText(e.target.value)}
              />
              {signatureText && (
                <div className="mt-2 rounded-lg border bg-white p-4 dark:bg-gray-950">
                  <p className="text-xs text-muted-foreground mb-1">Signature Preview:</p>
                  <p className="text-2xl italic font-semibold text-blue-900 dark:text-blue-300">
                    {signatureText}
                  </p>
                </div>
              )}
            </div>

            {/* Consent Checkbox */}
            <div className="flex items-start space-x-3 rounded-lg border bg-muted/50 p-4">
              <Checkbox
                id="sign-consent"
                checked={consentChecked}
                onCheckedChange={(checked) => setConsentChecked(checked === true)}
              />
              <label htmlFor="sign-consent" className="text-sm leading-relaxed">
                I hereby confirm that I have reviewed the document in its entirety and agree to be
                legally bound by its terms. I understand that this electronic signature has the same
                legal effect as a handwritten signature.
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowSignDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSign}
                disabled={signing || !signatureText.trim() || !consentChecked}
                className="flex-1"
              >
                {signing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <PenTool className="mr-2 h-4 w-4" />
                Sign Document
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
