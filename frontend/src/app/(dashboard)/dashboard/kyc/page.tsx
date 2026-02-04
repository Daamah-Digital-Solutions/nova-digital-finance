"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle2,
  User,
  Briefcase,
  FileUp,
  ClipboardCheck,
  Upload,
  X,
  ShieldCheck,
} from "lucide-react";

interface KYCProfile {
  id: string;
  kyc_status: string;
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  nationality: string;
  occupation: string;
  employer: string;
  income_source: string;
  monthly_income: string;
  investment_purpose: string;
}

interface PersonalInfoForm {
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  nationality: string;
}

interface EmploymentForm {
  occupation: string;
  employer: string;
  income_source: string;
  monthly_income: string;
  investment_purpose: string;
}

const STEPS = [
  { number: 1, title: "Personal Info", icon: User },
  { number: 2, title: "Employment", icon: Briefcase },
  { number: 3, title: "Documents", icon: FileUp },
  { number: 4, title: "Review", icon: ClipboardCheck },
];

const INCOME_SOURCES = [
  { value: "salary", label: "Salary / Employment" },
  { value: "business", label: "Business Income" },
  { value: "investments", label: "Investment Returns" },
  { value: "rental", label: "Rental Income" },
  { value: "pension", label: "Pension / Retirement" },
  { value: "other", label: "Other" },
];

const COUNTRIES = [
  { value: "AE", label: "United Arab Emirates" },
  { value: "SA", label: "Saudi Arabia" },
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "IN", label: "India" },
  { value: "PK", label: "Pakistan" },
  { value: "EG", label: "Egypt" },
  { value: "JO", label: "Jordan" },
  { value: "LB", label: "Lebanon" },
  { value: "QA", label: "Qatar" },
  { value: "KW", label: "Kuwait" },
  { value: "BH", label: "Bahrain" },
  { value: "OM", label: "Oman" },
];

interface UploadedDoc {
  file: File;
  preview: string;
}

export default function KYCPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [kycStatus, setKycStatus] = useState<string>("pending");
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);

  // Document uploads
  const [documents, setDocuments] = useState<{
    passport: UploadedDoc | null;
    address_proof: UploadedDoc | null;
    income_proof: UploadedDoc | null;
    selfie: UploadedDoc | null;
  }>({
    passport: null,
    address_proof: null,
    income_proof: null,
    selfie: null,
  });

  // Forms
  const personalForm = useForm<PersonalInfoForm>({
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
      date_of_birth: "",
      address_line_1: "",
      address_line_2: "",
      city: "",
      state: "",
      postal_code: "",
      country: "",
      nationality: "",
    },
  });

  const employmentForm = useForm<EmploymentForm>({
    defaultValues: {
      occupation: "",
      employer: "",
      income_source: "",
      monthly_income: "",
      investment_purpose: "",
    },
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const res = await api.get("/users/me/");
        const data = res.data as KYCProfile;
        setKycStatus(data.kyc_status || "pending");

        personalForm.reset({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          phone: data.phone || "",
          date_of_birth: data.date_of_birth || "",
          address_line_1: data.address_line_1 || "",
          address_line_2: data.address_line_2 || "",
          city: data.city || "",
          state: data.state || "",
          postal_code: data.postal_code || "",
          country: data.country || "",
          nationality: data.nationality || "",
        });

        employmentForm.reset({
          occupation: data.occupation || "",
          employer: data.employer || "",
          income_source: data.income_source || "",
          monthly_income: data.monthly_income || "",
          investment_purpose: data.investment_purpose || "",
        });
      } catch (error: any) {
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep((s) => s + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  const handleSubmitKYC = async () => {
    if (!confirmAccuracy) {
      toast.error("Please confirm the accuracy of your information");
      return;
    }

    try {
      setSubmitting(true);
      const personalData = personalForm.getValues();
      const employmentData = employmentForm.getValues();

      // Submit profile data
      await api.patch("/users/me/", {
        ...personalData,
        ...employmentData,
      });

      // Upload documents
      const docEntries = Object.entries(documents).filter(([, doc]) => doc !== null);
      for (const [docType, doc] of docEntries) {
        if (doc) {
          const formData = new FormData();
          formData.append("file", doc.file);
          formData.append("document_type", docType);
          await api.post("/documents/upload/", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
      }

      // Submit KYC
      await api.post("/users/me/kyc/submit/");
      setKycStatus("submitted");
      toast.success("KYC application submitted successfully!");
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to submit KYC application");
    } finally {
      setSubmitting(false);
    }
  };

  // Dropzone helpers
  function DocumentDropzone({
    docKey,
    label,
    description,
  }: {
    docKey: keyof typeof documents;
    label: string;
    description: string;
  }) {
    const onDrop = useCallback(
      (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
          setDocuments((prev) => ({
            ...prev,
            [docKey]: {
              file,
              preview: URL.createObjectURL(file),
            },
          }));
        }
      },
      [docKey]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: {
        "image/*": [".png", ".jpg", ".jpeg"],
        "application/pdf": [".pdf"],
      },
      maxFiles: 1,
      maxSize: 10 * 1024 * 1024, // 10MB
    });

    const doc = documents[docKey];

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
        {doc ? (
          <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm">{doc.file.name}</span>
              <span className="text-xs text-muted-foreground">
                ({(doc.file.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setDocuments((prev) => ({ ...prev, [docKey]: null }))
              }
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              {isDragActive ? "Drop the file here" : "Drag & drop or click to upload"}
            </p>
            <p className="text-xs text-muted-foreground">PNG, JPG or PDF up to 10MB</p>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If already approved, show approved status
  if (kycStatus === "approved") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <div className="rounded-full bg-green-100 p-4 dark:bg-green-900/30">
              <ShieldCheck className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">KYC Approved</h2>
            <p className="text-center text-muted-foreground">
              Your identity has been verified successfully. You have full access to all financing
              services.
            </p>
            <Badge variant="default" className="text-sm">
              Verified
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If submitted and pending review
  if (kycStatus === "submitted" || kycStatus === "under_review") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h2 className="text-2xl font-bold">KYC Under Review</h2>
            <p className="text-center text-muted-foreground">
              Your KYC application has been submitted and is currently under review. This process
              typically takes 1-3 business days.
            </p>
            <Badge variant="secondary" className="text-sm">
              {kycStatus === "under_review" ? "Under Review" : "Submitted"}
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercentage = ((currentStep - 1) / 3) * 100;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">KYC Verification</h1>
          <p className="text-muted-foreground">Complete your identity verification to access financing</p>
        </div>
        <Badge variant={kycStatus === "rejected" ? "destructive" : "secondary"}>
          {kycStatus.charAt(0).toUpperCase() + kycStatus.slice(1)}
        </Badge>
      </div>

      {/* Step Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4">
            <Progress value={progressPercentage} className="h-2" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              return (
                <button
                  key={step.number}
                  onClick={() => setCurrentStep(step.number)}
                  className={`flex flex-col items-center gap-1 rounded-lg p-2 text-center transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : isCompleted
                        ? "text-primary/70"
                        : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      isCompleted
                        ? "bg-primary text-primary-foreground"
                        : isActive
                          ? "border-2 border-primary text-primary"
                          : "border-2 border-muted-foreground/30 text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <span className="text-xs font-medium">{step.title}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Provide your personal details as they appear on your official ID
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  placeholder="Enter first name"
                  {...personalForm.register("first_name", { required: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  placeholder="Enter last name"
                  {...personalForm.register("last_name", { required: true })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+971 50 123 4567"
                  {...personalForm.register("phone", { required: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth *</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  {...personalForm.register("date_of_birth", { required: true })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line_1">Address Line 1 *</Label>
              <Input
                id="address_line_1"
                placeholder="Street address"
                {...personalForm.register("address_line_1", { required: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line_2">Address Line 2</Label>
              <Input
                id="address_line_2"
                placeholder="Apartment, suite, etc. (optional)"
                {...personalForm.register("address_line_2")}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="City"
                  {...personalForm.register("city", { required: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State / Emirate</Label>
                <Input
                  id="state"
                  placeholder="State"
                  {...personalForm.register("state")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  placeholder="Postal code"
                  {...personalForm.register("postal_code")}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Country *</Label>
                <Select
                  value={personalForm.watch("country")}
                  onValueChange={(val) => personalForm.setValue("country", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nationality *</Label>
                <Select
                  value={personalForm.watch("nationality")}
                  onValueChange={(val) => personalForm.setValue("nationality", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select nationality" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Employment & Financial Information</CardTitle>
            <CardDescription>
              Provide details about your employment and income
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation *</Label>
                <Input
                  id="occupation"
                  placeholder="e.g., Software Engineer"
                  {...employmentForm.register("occupation", { required: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employer">Employer</Label>
                <Input
                  id="employer"
                  placeholder="Company name"
                  {...employmentForm.register("employer")}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Source of Income *</Label>
                <Select
                  value={employmentForm.watch("income_source")}
                  onValueChange={(val) => employmentForm.setValue("income_source", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select income source" />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOME_SOURCES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly_income">Monthly Income (USD) *</Label>
                <Input
                  id="monthly_income"
                  type="number"
                  placeholder="e.g., 5000"
                  {...employmentForm.register("monthly_income", { required: true })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="investment_purpose">Purpose of Financing / Investment *</Label>
              <Textarea
                id="investment_purpose"
                placeholder="Describe the purpose of your financing or investment..."
                rows={4}
                {...employmentForm.register("investment_purpose", { required: true })}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Document Upload</CardTitle>
            <CardDescription>
              Upload the required documents for identity verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <DocumentDropzone
              docKey="passport"
              label="Passport or National ID *"
              description="Upload a clear copy of your passport or national ID card"
            />
            <DocumentDropzone
              docKey="address_proof"
              label="Proof of Address *"
              description="Utility bill, bank statement, or government letter (less than 3 months old)"
            />
            <DocumentDropzone
              docKey="income_proof"
              label="Proof of Income *"
              description="Salary certificate, bank statements, or tax return"
            />
            <DocumentDropzone
              docKey="selfie"
              label="Selfie with ID *"
              description="Take a selfie holding your passport or ID next to your face"
            />
          </CardContent>
        </Card>
      )}

      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Submit</CardTitle>
            <CardDescription>
              Review your information before submitting your KYC application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personal Info Review */}
            <div>
              <h3 className="mb-3 font-semibold">Personal Information</h3>
              <div className="grid gap-2 rounded-lg border p-4 sm:grid-cols-2">
                <div>
                  <span className="text-xs text-muted-foreground">Name</span>
                  <p className="text-sm font-medium">
                    {personalForm.getValues("first_name")} {personalForm.getValues("last_name")}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Phone</span>
                  <p className="text-sm font-medium">{personalForm.getValues("phone") || "---"}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Date of Birth</span>
                  <p className="text-sm font-medium">
                    {personalForm.getValues("date_of_birth") || "---"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Country</span>
                  <p className="text-sm font-medium">
                    {COUNTRIES.find((c) => c.value === personalForm.getValues("country"))?.label ||
                      personalForm.getValues("country") ||
                      "---"}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-xs text-muted-foreground">Address</span>
                  <p className="text-sm font-medium">
                    {[
                      personalForm.getValues("address_line_1"),
                      personalForm.getValues("address_line_2"),
                      personalForm.getValues("city"),
                      personalForm.getValues("state"),
                      personalForm.getValues("postal_code"),
                    ]
                      .filter(Boolean)
                      .join(", ") || "---"}
                  </p>
                </div>
              </div>
            </div>

            {/* Employment Review */}
            <div>
              <h3 className="mb-3 font-semibold">Employment & Financial</h3>
              <div className="grid gap-2 rounded-lg border p-4 sm:grid-cols-2">
                <div>
                  <span className="text-xs text-muted-foreground">Occupation</span>
                  <p className="text-sm font-medium">
                    {employmentForm.getValues("occupation") || "---"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Employer</span>
                  <p className="text-sm font-medium">
                    {employmentForm.getValues("employer") || "---"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Income Source</span>
                  <p className="text-sm font-medium">
                    {INCOME_SOURCES.find(
                      (s) => s.value === employmentForm.getValues("income_source")
                    )?.label || "---"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Monthly Income</span>
                  <p className="text-sm font-medium">
                    ${Number(employmentForm.getValues("monthly_income") || 0).toLocaleString()}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-xs text-muted-foreground">Purpose</span>
                  <p className="text-sm font-medium">
                    {employmentForm.getValues("investment_purpose") || "---"}
                  </p>
                </div>
              </div>
            </div>

            {/* Documents Review */}
            <div>
              <h3 className="mb-3 font-semibold">Documents</h3>
              <div className="grid gap-2 rounded-lg border p-4 sm:grid-cols-2">
                {(
                  [
                    ["passport", "Passport / ID"],
                    ["address_proof", "Address Proof"],
                    ["income_proof", "Income Proof"],
                    ["selfie", "Selfie with ID"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2">
                    {documents[key] ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-destructive" />
                    )}
                    <span className="text-sm">
                      {label}: {documents[key]?.file.name || "Not uploaded"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirm */}
            <div className="flex items-start space-x-3 rounded-lg border bg-muted/50 p-4">
              <Checkbox
                id="confirm"
                checked={confirmAccuracy}
                onCheckedChange={(checked) => setConfirmAccuracy(checked === true)}
              />
              <label htmlFor="confirm" className="text-sm leading-relaxed">
                I confirm that all information provided is accurate and complete. I understand that
                providing false information may result in the rejection of my application and
                potential legal consequences.
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
          Back
        </Button>
        <div className="flex gap-2">
          {currentStep < 4 ? (
            <Button onClick={handleNext}>Continue</Button>
          ) : (
            <Button onClick={handleSubmitKYC} disabled={submitting || !confirmAccuracy}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit KYC Application
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
