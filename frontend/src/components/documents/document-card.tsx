"use client";

import { FileText, Download, Eye, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface DocumentCardProps {
  document: {
    id: string;
    document_type: string;
    document_number: string;
    title: string;
    is_signed: boolean;
    download_url?: string;
    created_at: string;
  };
  onView?: () => void;
  onDownload?: () => void;
}

const typeLabels: Record<string, string> = {
  certificate: "Certificate (Sak)",
  contract: "Contract",
  receipt: "Receipt",
  kyc_summary: "KYC Summary",
  statement: "Statement",
};

export function DocumentCard({ document, onView, onDownload }: DocumentCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="truncate font-medium">{document.title}</p>
                <p className="text-xs text-muted-foreground">
                  {document.document_number}
                </p>
              </div>
              <Badge variant={document.is_signed ? "default" : "secondary"}>
                {document.is_signed ? (
                  <>
                    <CheckCircle className="mr-1 h-3 w-3" /> Signed
                  </>
                ) : (
                  <>
                    <Clock className="mr-1 h-3 w-3" /> Unsigned
                  </>
                )}
              </Badge>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{typeLabels[document.document_type] || document.document_type}</span>
                <span>&middot;</span>
                <span>{format(new Date(document.created_at), "MMM d, yyyy")}</span>
              </div>
              <div className="flex gap-1">
                {onView && (
                  <Button variant="ghost" size="sm" onClick={onView}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                )}
                {onDownload && (
                  <Button variant="ghost" size="sm" onClick={onDownload}>
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
