"use client";

import Link from "next/link";
import {
  UserPlus,
  FileText,
  CreditCard,
  PenTool,
  Coins,
  TrendingUp,
  ArrowRight,
  Calculator,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const steps = [
  {
    number: 1,
    icon: UserPlus,
    title: "Register & Complete KYC",
    description:
      "Create your account on the Nova Digital Finance platform and complete the Know Your Customer (KYC) verification process. Upload your identification documents and personal information for review.",
    details: [
      "Provide personal details and contact information",
      "Upload government-issued ID and proof of address",
      "Verification typically completed within 24-48 hours",
    ],
  },
  {
    number: 2,
    icon: FileText,
    title: "Apply for Financing",
    description:
      "Once your KYC is approved, submit a financing application. Choose your desired amount and repayment period that best suits your needs.",
    details: [
      "Financing amounts from 500 to 100,000 PRN",
      "Repayment periods from 6 to 36 months",
      "Equal monthly installments with zero interest",
    ],
  },
  {
    number: 3,
    icon: CreditCard,
    title: "Pay Processing Fee",
    description:
      "A one-time, non-refundable processing fee of 3-5% of your financing amount is required. This is the only cost associated with your financing.",
    details: [
      "Fee ranges from 3% to 5% based on your financing amount",
      "One-time payment, not recurring",
      "Multiple payment methods accepted (Card, Bank Transfer, Crypto)",
    ],
  },
  {
    number: 4,
    icon: PenTool,
    title: "Sign the Contract",
    description:
      "Review and sign the electronic trilateral contract between you, Nova Digital Finance, and CapiMax Investment. Everything is handled digitally for your convenience.",
    details: [
      "Electronic signature for convenience and security",
      "Trilateral agreement covering all parties",
      "Clear terms for repayment and investment",
    ],
  },
  {
    number: 5,
    icon: Coins,
    title: "Receive BroNova Tokens",
    description:
      "After the contract is signed and the processing fee is confirmed, your BroNova (PRN) tokens are disbursed to your account at the current USD equivalent value.",
    details: [
      "Tokens disbursed at current USD equivalent rate",
      "Tokens appear in your Nova Finance wallet",
      "Ready for investment through CapiMax",
    ],
  },
  {
    number: 6,
    icon: TrendingUp,
    title: "Invest through CapiMax & Repay Monthly",
    description:
      "Deploy your BroNova tokens through the CapiMax Investment platform while making your monthly repayment installments through Nova Digital Finance.",
    details: [
      "Access CapiMax investment opportunities",
      "Make equal monthly repayments",
      "Track everything from your dashboard",
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight lg:text-5xl">
              How It Works
            </h1>
            <p className="text-lg text-muted-foreground lg:text-xl">
              Getting interest-free BroNova financing is simple. Follow these six
              steps to get started on your journey.
            </p>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl space-y-8">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                {index < steps.length - 1 && (
                  <div className="absolute left-6 top-16 hidden h-full w-0.5 bg-border lg:block" />
                )}
                <Card>
                  <CardContent className="p-6 lg:p-8">
                    <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                          {step.number}
                        </div>
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 lg:hidden">
                          <step.icon className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <div>
                        <div className="mb-4 flex items-center gap-3">
                          <div className="hidden h-10 w-10 items-center justify-center rounded-lg bg-primary/10 lg:flex">
                            <step.icon className="h-5 w-5 text-primary" />
                          </div>
                          <h3 className="text-xl font-semibold">
                            {step.title}
                          </h3>
                        </div>
                        <p className="mb-4 text-muted-foreground">
                          {step.description}
                        </p>
                        <ul className="space-y-2">
                          {step.details.map((detail, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm text-muted-foreground"
                            >
                              <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fee Calculator Preview */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center rounded-full border bg-background px-4 py-1.5 text-sm font-medium">
              <Calculator className="mr-2 h-4 w-4 text-primary" />
              Fee Calculator
            </div>
            <h2 className="mb-4 text-3xl font-bold">
              Estimate Your Financing
            </h2>
            <p className="mb-8 text-muted-foreground">
              Our financing comes with a simple, transparent fee structure. The
              processing fee ranges from 3-5% of your financing amount, and your
              monthly repayment is calculated by dividing the total amount evenly
              across your chosen period.
            </p>
            <div className="mx-auto grid max-w-2xl gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="mb-1 text-sm text-muted-foreground">
                    Example Amount
                  </p>
                  <p className="text-2xl font-bold">10,000 PRN</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="mb-1 text-sm text-muted-foreground">
                    Processing Fee (5%)
                  </p>
                  <p className="text-2xl font-bold">500 PRN</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="mb-1 text-sm text-muted-foreground">
                    Monthly (12 months)
                  </p>
                  <p className="text-2xl font-bold">833.33 PRN</p>
                </CardContent>
              </Card>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Register to access the full fee calculator in your dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl rounded-2xl bg-primary p-8 text-center text-primary-foreground lg:p-12">
            <h2 className="mb-4 text-3xl font-bold">
              Ready to Get Started?
            </h2>
            <p className="mb-6 text-primary-foreground/80">
              Create your account today and begin the process of obtaining
              interest-free BroNova financing.
            </p>
            <Link href="/register">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90"
              >
                Register Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
