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
  LayoutGrid,
  Search,
  Wallet,
  UploadCloud,
  ImageIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Step 4/5 reference screenshots supplied by the client. Drop the files into
// frontend/public/how-it-works/ and the placeholders below swap to the images.
const NOVA_SUKUK_PAYMENT_SCREENSHOT = "/how-it-works/nova-sukuk-payment-option.png";
const NOVA_SUKUK_GATEWAYS_IMAGE = "/how-it-works/nova-sukuk-payment-gateways.png";

const capimaxJourney = [
  {
    icon: LayoutGrid,
    title: "Choose your Capimax Ecosystem platform",
    description:
      "Enter the platform that best matches the asset or investment opportunity you want — real estate, tokenized assets, portfolios, and more across the Capimax Ecosystem.",
  },
  {
    icon: UserPlus,
    title: "Create an account & complete KYC",
    description:
      "Register and complete identity verification (KYC) according to the requirements of the platform you selected.",
  },
  {
    icon: Search,
    title: "Select the asset or opportunity",
    description:
      "Browse and choose the real-estate asset or investment opportunity you'd like to acquire.",
  },
  {
    icon: CreditCard,
    title: "Choose Nova Sukuk at checkout",
    description:
      "On the payment page you'll find Nova Sukuk offered as a payment method alongside the other options.",
    image: NOVA_SUKUK_PAYMENT_SCREENSHOT,
    imageAlt: "Nova Sukuk shown as a payment option at checkout",
  },
  {
    icon: UploadCloud,
    title: "Select & upload your Nova Sukuk",
    description:
      "Pick the appropriate Nova Sukuk and upload it as your means of payment and application.",
    image: NOVA_SUKUK_GATEWAYS_IMAGE,
    imageAlt: "Payment gateways across Capimax platforms accepting Nova Sukuk",
  },
  {
    icon: Wallet,
    title: "Receive the asset in your wallet",
    description:
      "Once approved, the asset appears in your wallet inside the platform. You can use the full value of the Sukuk or a part of it — and use a single Sukuk to acquire more than one asset across multiple Capimax Ecosystem platforms, within its value and the available financing limits.",
  },
];

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
    title: "Choose Your PRN Amount",
    description:
      "Once your KYC is approved, decide how many Pronova (PRN) tokens you need. Each PRN is valued at exactly 1 USD, so if you need 10,000 PRN, you will pay 10,000 USD plus the processing fee.",
    details: [
      "Choose from 500 to 100,000 PRN (1 PRN = 1 USD)",
      "Repayment periods from 6 to 36 months",
      "Equal monthly installments with zero interest",
    ],
  },
  {
    number: 3,
    icon: CreditCard,
    title: "Pay Processing Fee",
    description:
      "A one-time, non-refundable processing fee of 2% of your financing amount is required. This is the only cost associated with your financing.",
    details: [
      "Fee ranges from 2% based on your financing amount",
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
    title: "Receive Nova Sukuk",
    description:
      "After the contract is signed and the processing fee is paid, you receive an official Nova Sukuk. This document proves you own the specified number of Pronova tokens and can be used for investment with CapiMax Investments.",
    details: [
      "Official Nova Sukuk proving your PRN ownership",
      "Each PRN backed at 1 USD value",
      "Nova Sukuk used to invest across the Capimax Ecosystem",
    ],
  },
  {
    number: 6,
    icon: TrendingUp,
    title: "Invest via CapiMax & Repay Monthly",
    description:
      "Use your Nova Sukuk to invest through CapiMax Investments. Meanwhile, repay your monthly installments through Nova Digital Finance.",
    details: [
      "Present your Nova Sukuk to CapiMax Investments",
      "Make equal monthly repayments in USD",
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
              Getting interest-free Pronova financing is simple. Follow these six
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
              processing fee is a flat 2% of your financing amount, and your
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
                    Processing Fee (2%)
                  </p>
                  <p className="text-2xl font-bold">$200</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="mb-1 text-sm text-muted-foreground">
                    Monthly (12 months)
                  </p>
                  <p className="text-2xl font-bold">$833.33</p>
                </CardContent>
              </Card>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Register to access the full fee calculator in your dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* Using Nova Sukuk across the Capimax Ecosystem */}
      <section className="border-t py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border bg-background/70 px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary backdrop-blur">
              <LayoutGrid className="h-3 w-3" />
              Inside the Capimax Ecosystem
            </div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight lg:text-4xl">
              Using your Nova Sukuk across the Capimax Ecosystem
            </h2>
            <p className="text-base text-muted-foreground lg:text-lg">
              Once you hold your Nova Sukuk, here is how you put it to work to
              acquire real assets across the Capimax Ecosystem platforms.
            </p>
          </div>

          <div className="mx-auto max-w-3xl space-y-6">
            {capimaxJourney.map((step, index) => (
              <div
                key={step.title}
                className="relative flex gap-5 rounded-2xl border bg-card p-6"
              >
                <div className="flex flex-col items-center">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                  {index < capimaxJourney.length - 1 && (
                    <span className="mt-2 h-full w-px flex-1 bg-border" aria-hidden />
                  )}
                </div>
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <step.icon className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>

                  {step.image && (
                    <div className="mt-4 overflow-hidden rounded-xl border bg-muted/40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={step.image}
                        alt={step.imageAlt}
                        loading="lazy"
                        className="w-full object-contain"
                        onError={(e) => {
                          // Until the client supplies the screenshot, show a
                          // labelled placeholder instead of a broken image.
                          const el = e.currentTarget;
                          el.style.display = "none";
                          el.nextElementSibling?.removeAttribute("hidden");
                        }}
                      />
                      <div
                        hidden
                        className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center text-muted-foreground"
                      >
                        <ImageIcon className="h-7 w-7 opacity-60" />
                        <span className="text-xs font-medium">
                          {step.imageAlt}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
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
              interest-free Pronova financing.
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
