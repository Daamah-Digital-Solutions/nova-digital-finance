"use client";

import Link from "next/link";
import {
  Building2,
  Users,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  ExternalLink,
  Handshake,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const benefits = [
  {
    title: "Seamless Financing to Investment",
    description:
      "Receive BroNova tokens through Nova Finance and deploy them directly into CapiMax investment opportunities without friction.",
  },
  {
    title: "Professional Portfolio Management",
    description:
      "CapiMax provides professional investment management services, giving you access to diverse cryptocurrency investment strategies.",
  },
  {
    title: "Unified Dashboard",
    description:
      "Track both your financing status and investment performance from a single, integrated platform experience.",
  },
  {
    title: "Transparent Fee Structure",
    description:
      "Clear and upfront costs with no hidden fees. The only financing cost is the one-time 3-5% processing fee.",
  },
  {
    title: "Secure Digital Contracts",
    description:
      "All agreements are electronically signed and documented through our secure trilateral contract system.",
  },
  {
    title: "Dedicated Support",
    description:
      "Access support from both Nova Digital Finance and CapiMax Investment through integrated communication channels.",
  },
];

export default function PartnershipPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center rounded-full border bg-muted px-4 py-1.5 text-sm font-medium">
              <Handshake className="mr-2 h-4 w-4 text-primary" />
              Strategic Partnership
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight lg:text-5xl">
              Nova Finance & CapiMax Investment
            </h1>
            <p className="text-lg text-muted-foreground lg:text-xl">
              Our strategic partnership with CapiMax Investment creates a unique
              trilateral ecosystem connecting financing, investment, and growth
              for our clients.
            </p>
          </div>
        </div>
      </section>

      {/* How the Trilateral Relationship Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">
              The Trilateral Relationship
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Understanding how Nova Digital Finance, CapiMax Investment, and
              you as the client work together in a seamless financial ecosystem.
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
            <Card className="relative">
              <CardContent className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-3 text-lg font-semibold">
                  Nova Digital Finance
                </h3>
                <ul className="space-y-2 text-left text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    Provides interest-free financing
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    Manages KYC verification
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    Handles repayment collection
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    Issues electronic contracts
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    Disburses BroNova tokens
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="relative border-primary/30 bg-primary/5">
              <CardContent className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-3 text-lg font-semibold">The Client</h3>
                <ul className="space-y-2 text-left text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    Completes KYC verification
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    Applies for financing
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    Pays one-time processing fee
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    Signs trilateral contract
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    Invests and repays monthly
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="relative">
              <CardContent className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-3 text-lg font-semibold">
                  CapiMax Investment
                </h3>
                <ul className="space-y-2 text-left text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    Manages investment portfolios
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    Provides investment platform
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    Offers diverse strategies
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    Reports investment performance
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    Co-signs trilateral contract
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Flow Diagram */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-center text-3xl font-bold">
              How It All Connects
            </h2>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-xl border bg-card p-4 text-center">
                <div className="mb-2 text-sm font-medium text-muted-foreground">
                  Step 1
                </div>
                <p className="text-sm font-semibold">
                  Client applies for financing through Nova Finance
                </p>
              </div>
              <div className="rounded-xl border bg-card p-4 text-center">
                <div className="mb-2 text-sm font-medium text-muted-foreground">
                  Step 2
                </div>
                <p className="text-sm font-semibold">
                  Trilateral contract signed by all three parties
                </p>
              </div>
              <div className="rounded-xl border bg-card p-4 text-center">
                <div className="mb-2 text-sm font-medium text-muted-foreground">
                  Step 3
                </div>
                <p className="text-sm font-semibold">
                  BroNova tokens deployed to CapiMax for investment
                </p>
              </div>
              <div className="rounded-xl border bg-card p-4 text-center">
                <div className="mb-2 text-sm font-medium text-muted-foreground">
                  Step 4
                </div>
                <p className="text-sm font-semibold">
                  Client repays monthly while investments grow
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Benefits for Clients</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              The partnership between Nova Digital Finance and CapiMax
              Investment provides unique advantages for our clients.
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit) => (
              <Card key={benefit.title}>
                <CardContent className="p-6">
                  <h3 className="mb-2 font-semibold">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA to CapiMax */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl rounded-2xl bg-primary p-8 text-center text-primary-foreground lg:p-12">
            <h2 className="mb-4 text-3xl font-bold">
              Explore CapiMax Investment
            </h2>
            <p className="mb-6 text-primary-foreground/80">
              Visit the CapiMax Investment panel to learn more about available
              investment opportunities and strategies.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a
                href="https://capimax.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-transparent text-white hover:bg-white/10"
                >
                  Visit CapiMax
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
