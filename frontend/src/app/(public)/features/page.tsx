"use client";

import {
  Shield,
  Clock,
  Receipt,
  UserCheck,
  PenTool,
  FileSearch,
  Wallet,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Shield,
    title: "Interest-Free Financing",
    description:
      "Our financing model is completely interest-free. You only repay the principal amount you borrowed, with no hidden charges or compounding interest. This is our commitment to accessible, ethical financing.",
    highlight: "0% Interest",
  },
  {
    icon: Clock,
    title: "Flexible Repayment Periods",
    description:
      "Choose a repayment schedule that works for you. We offer periods from 6 to 36 months, with equal monthly installments calculated by dividing the total financing amount by your chosen number of months.",
    highlight: "6-36 Months",
  },
  {
    icon: Receipt,
    title: "Small Processing Fee",
    description:
      "A one-time, non-refundable processing fee of 3-5% is the only cost associated with your financing. This transparent fee structure ensures you always know exactly what you are paying.",
    highlight: "3-5% One-Time",
  },
  {
    icon: UserCheck,
    title: "Secure KYC Process",
    description:
      "Our Know Your Customer verification process ensures the security and integrity of the platform. Upload your documents securely, and our team will review them promptly to get you started quickly.",
    highlight: "Verified & Secure",
  },
  {
    icon: PenTool,
    title: "Electronic Signatures",
    description:
      "Sign your financing contracts digitally from anywhere. Our electronic signature system provides a legally binding, convenient, and paperless experience for all parties involved.",
    highlight: "Digital Contracts",
  },
  {
    icon: FileSearch,
    title: "Document Verification System",
    description:
      "Every document issued through Nova Digital Finance comes with a unique verification code. Anyone can verify the authenticity of a document through our public verification portal.",
    highlight: "Verifiable Documents",
  },
  {
    icon: Wallet,
    title: "Multiple Payment Methods",
    description:
      "We accept a variety of payment methods for processing fees and repayments, including credit and debit cards, bank transfers, and cryptocurrency payments, giving you flexibility and convenience.",
    highlight: "Cards, Bank, Crypto",
  },
  {
    icon: TrendingUp,
    title: "Investment through CapiMax",
    description:
      "Through our strategic partnership with CapiMax Investment, you can deploy your BroNova tokens into investment opportunities. The trilateral relationship ensures a seamless experience.",
    highlight: "Grow Your Tokens",
  },
];

export default function FeaturesPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight lg:text-5xl">
              Platform Features
            </h1>
            <p className="text-lg text-muted-foreground lg:text-xl">
              Discover everything Nova Digital Finance offers to make your
              cryptocurrency financing experience simple, transparent, and
              secure.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="group transition-shadow hover:shadow-lg"
              >
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                      {feature.highlight}
                    </span>
                  </div>
                  <h3 className="mb-3 text-lg font-semibold">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Summary Section */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-8 md:grid-cols-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">0%</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Interest Rate
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">500-100K</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  PRN Financing Range
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">6-36</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Month Terms
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">3-5%</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Processing Fee
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl rounded-2xl bg-primary p-8 text-center text-primary-foreground lg:p-12">
            <h2 className="mb-4 text-3xl font-bold">
              Experience These Features Today
            </h2>
            <p className="mb-6 text-primary-foreground/80">
              Create your account and explore all that Nova Digital Finance has
              to offer.
            </p>
            <Link href="/register">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
