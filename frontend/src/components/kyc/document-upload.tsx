"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileText, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface UploadedFile {
  id?: string;
  file?: File;
  name: string;
  size: number;
  isVerified?: boolean;
}

interface DocumentUploadProps {
  label: string;
  description: string;
  accept?: Record<string, string[]>;
  maxSize?: number;
  file?: UploadedFile | null;
  onUpload: (file: File) => void;
  onRemove?: () => void;
  disabled?: boolean;
}

export function DocumentUpload({
  label,
  description,
  accept = {
    "image/*": [".jpg", ".jpeg", ".png", ".webp"],
    "application/pdf": [".pdf"],
  },
  maxSize = 10 * 1024 * 1024,
  file,
  onUpload,
  onRemove,
  disabled = false,
}: DocumentUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onUpload(acceptedFiles[0]);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles: 1,
    disabled,
  });

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (file) {
    return (
      <div className="rounded-lg border bg-muted/50 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {file.isVerified ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <FileText className="h-5 w-5 text-primary" />
            )}
            <div>
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatSize(file.size)}
                {file.isVerified && " - Verified"}
              </p>
            </div>
          </div>
          {onRemove && !disabled && (
            <Button variant="ghost" size="sm" onClick={onRemove}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-1 text-sm font-medium">{label}</p>
      <div
        {...getRootProps()}
        className={cn(
          "cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          PDF, JPG, PNG up to {formatSize(maxSize)}
        </p>
      </div>
    </div>
  );
}
