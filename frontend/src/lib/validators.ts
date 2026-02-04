import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "First name is required"),
    lastName: z
      .string()
      .min(1, "Last name is required"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const kycPersonalSchema = z.object({
  phone: z
    .string()
    .min(1, "Phone number is required"),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required"),
  addressLine1: z
    .string()
    .min(1, "Address is required"),
  city: z
    .string()
    .min(1, "City is required"),
  country: z
    .string()
    .min(1, "Country is required"),
  nationality: z
    .string()
    .min(1, "Nationality is required"),
  postalCode: z
    .string()
    .min(1, "Postal code is required"),
});

export type KycPersonalFormData = z.infer<typeof kycPersonalSchema>;

export const kycEmploymentSchema = z.object({
  occupation: z
    .string()
    .min(1, "Occupation is required"),
  employer: z
    .string()
    .min(1, "Employer is required"),
  incomeSource: z.enum(
    ["employment", "self_employment", "investments", "inheritance", "other"],
    { required_error: "Income source is required" }
  ),
  monthlyIncome: z
    .number({ required_error: "Monthly income is required" })
    .positive("Monthly income must be a positive number"),
  investmentPurpose: z
    .string()
    .min(1, "Investment purpose is required"),
});

export type KycEmploymentFormData = z.infer<typeof kycEmploymentSchema>;

export const financingSchema = z.object({
  bronovaAmount: z
    .number({ required_error: "Amount is required" })
    .min(500, "Minimum amount is 500 BRNV")
    .max(100000, "Maximum amount is 100,000 BRNV"),
  repaymentPeriodMonths: z
    .number({ required_error: "Repayment period is required" })
    .min(6, "Minimum repayment period is 6 months")
    .max(36, "Maximum repayment period is 36 months"),
  feePercentage: z
    .number({ required_error: "Fee percentage is required" })
    .min(3, "Minimum fee is 3%")
    .max(5, "Maximum fee is 5%"),
  ackTerms: z
    .literal(true, {
      errorMap: () => ({ message: "You must accept the terms and conditions" }),
    }),
  ackFeeNonRefundable: z
    .literal(true, {
      errorMap: () => ({
        message: "You must acknowledge the non-refundable fee",
      }),
    }),
  ackRepaymentSchedule: z
    .literal(true, {
      errorMap: () => ({
        message: "You must acknowledge the repayment schedule",
      }),
    }),
  ackRiskDisclosure: z
    .literal(true, {
      errorMap: () => ({
        message: "You must acknowledge the risk disclosure",
      }),
    }),
});

export type FinancingFormData = z.infer<typeof financingSchema>;

export const clientRequestSchema = z.object({
  requestType: z.enum(
    ["general", "financing", "kyc", "payment", "technical", "complaint"],
    { required_error: "Request type is required" }
  ),
  subject: z
    .string()
    .min(1, "Subject is required"),
  description: z
    .string()
    .min(1, "Description is required")
    .min(10, "Description must be at least 10 characters"),
  financingId: z
    .string()
    .uuid("Invalid financing ID")
    .optional()
    .or(z.literal("")),
});

export type ClientRequestFormData = z.infer<typeof clientRequestSchema>;
