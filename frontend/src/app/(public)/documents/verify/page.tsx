"use client";

import { useState } from "react";
import {
  Search,
  FileCheck,
  FileX,
  Loader2,
  Calendar,
  User,
  Hash,
  FileText,
  ShieldCheck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { toast } from "sonner";

interface VerificationResult {
  document_number: string;
  type: string;
  title: string;
  issued_to: string;
  issued_date: string;
  is_signed: boolean;
  status: string;
}

export default function DocumentVerifyPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      toast.error("Please enter a verification code.");
      return;
    }

    setLoading(true);
    setResult(null);
    setNotFound(false);

    try {
      const response = await api.get(`/documents/verify/${code.trim()}/`);
      setResult(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setNotFound(true);
      } else {
        toast.error("Failed to verify document. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight lg:text-5xl">
              Document Verification
            </h1>
            <p className="text-lg text-muted-foreground lg:text-xl">
              Enter the verification code found on your Nova Digital Finance
              document to verify its authenticity.
            </p>
          </div>
        </div>
      </section>

      {/* Verification Form */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-lg">
            <Card>
              <CardHeader>
                <CardTitle>Verify a Document</CardTitle>
                <CardDescription>
                  Enter the unique verification code printed on the document you
                  wish to verify.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Verification Code</Label>
                    <Input
                      id="code"
                      placeholder="e.g., DOC-2026-ABCDEF"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Verify Document
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Result */}
            {result && (
              <Card className="mt-6 border-green-500/30 bg-green-500/5">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <FileCheck className="h-6 w-6 text-green-600" />
                    <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">
                      Document Verified
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Document Number
                        </p>
                        <p className="font-medium">{result.document_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Type</p>
                        <p className="font-medium capitalize">{result.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Title</p>
                        <p className="font-medium">{result.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Issued To
                        </p>
                        <p className="font-medium">{result.issued_to}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Issue Date
                        </p>
                        <p className="font-medium">{result.issued_date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Signature Status
                        </p>
                        <Badge
                          variant={result.is_signed ? "success" : "warning"}
                        >
                          {result.is_signed ? "Signed" : "Not Signed"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {notFound && (
              <Card className="mt-6 border-red-500/30 bg-red-500/5">
                <CardContent className="flex gap-4 p-6">
                  <FileX className="h-6 w-6 shrink-0 text-red-600" />
                  <div>
                    <h3 className="mb-1 font-semibold text-red-700 dark:text-red-400">
                      Document Not Found
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      No document was found with the verification code
                      &quot;{code}&quot;. Please check the code and try again.
                      If you believe this is an error, please contact support.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
