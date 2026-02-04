"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Loader2,
  FileText,
  FileCheck,
  Download,
  Eye,
  Search,
  ShieldCheck,
  File,
  FileImage,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

interface Document {
  id: string;
  title: string;
  document_type: string;
  document_number: string;
  file_url: string;
  is_signed: boolean;
  signed_at: string | null;
  created_at: string;
  status: string;
}

interface VerificationResult {
  valid: boolean;
  document_title: string;
  signed_by: string;
  signed_at: string;
}

export default function DocumentsPage() {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    try {
      setLoading(true);
      const res = await api.get("/documents/");
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setDocuments(data);
    } catch (error: any) {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(doc: Document) {
    try {
      const res = await api.get(`/documents/${doc.id}/download/`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.title || `document-${doc.document_number}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error("Failed to download document");
    }
  }

  async function handleView(doc: Document) {
    try {
      if (doc.file_url) {
        window.open(doc.file_url, "_blank");
      } else {
        const res = await api.get(`/documents/${doc.id}/view/`);
        if (res.data.url) {
          window.open(res.data.url, "_blank");
        }
      }
    } catch (error: any) {
      toast.error("Failed to open document");
    }
  }

  async function handleVerify() {
    if (!verificationCode.trim()) {
      toast.error("Please enter a verification code");
      return;
    }

    try {
      setVerifying(true);
      setVerificationResult(null);
      const res = await api.post("/documents/verify/", {
        code: verificationCode.trim(),
      });
      setVerificationResult(res.data);
      if (res.data.valid) {
        toast.success("Document verified successfully!");
      } else {
        toast.error("Invalid verification code");
      }
    } catch (error: any) {
      toast.error("Verification failed. Please check the code and try again.");
      setVerificationResult(null);
    } finally {
      setVerifying(false);
    }
  }

  const getDocIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "contract":
      case "agreement":
        return FileCheck;
      case "invoice":
      case "statement":
        return FileSpreadsheet;
      case "id":
      case "passport":
      case "selfie":
        return FileImage;
      default:
        return FileText;
    }
  };

  const signedBadge = (isSigned: boolean) => {
    if (isSigned) {
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Signed
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" />
        Unsigned
      </Badge>
    );
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
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="text-muted-foreground">View and manage your documents</p>
      </div>

      {/* Document Grid */}
      {documents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <File className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">No documents found</p>
            <p className="text-sm text-muted-foreground">
              Documents will appear here after you submit applications or KYC
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => {
            const DocIcon = getDocIcon(doc.document_type);
            return (
              <Card key={doc.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <DocIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm leading-tight">
                          {doc.title || "Untitled Document"}
                        </CardTitle>
                        <CardDescription className="text-xs capitalize">
                          {doc.document_type?.replace(/_/g, " ") || "Document"}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-3 pt-0">
                  <div className="space-y-2">
                    {doc.document_number && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Doc #</span>
                        <span className="font-mono">{doc.document_number}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Date</span>
                      <span>
                        {new Date(doc.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Status</span>
                      {signedBadge(doc.is_signed)}
                    </div>
                    {doc.is_signed && doc.signed_at && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Signed</span>
                        <span>
                          {new Date(doc.signed_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleView(doc)}
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownload(doc)}
                    >
                      <Download className="mr-1 h-3.5 w-3.5" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Document Verification Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Document Verification
          </CardTitle>
          <CardDescription>
            Enter a verification code to verify the authenticity of a document
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                placeholder="Enter document verification code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleVerify();
                }}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleVerify} disabled={verifying}>
                {verifying ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Verify
              </Button>
            </div>
          </div>

          {verificationResult && (
            <div
              className={`rounded-lg border p-4 ${
                verificationResult.valid
                  ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
                  : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
              }`}
            >
              <div className="flex items-start gap-3">
                {verificationResult.valid ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <div>
                  <p className="font-medium">
                    {verificationResult.valid
                      ? "Document Verified"
                      : "Verification Failed"}
                  </p>
                  {verificationResult.valid && (
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <p>
                        Document: <strong>{verificationResult.document_title}</strong>
                      </p>
                      <p>
                        Signed by: <strong>{verificationResult.signed_by}</strong>
                      </p>
                      <p>
                        Signed at:{" "}
                        <strong>
                          {new Date(verificationResult.signed_at).toLocaleString()}
                        </strong>
                      </p>
                    </div>
                  )}
                  {!verificationResult.valid && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      The verification code you entered is invalid or expired.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
