"use client";

import {
  Shield,
  Eye,
  Lightbulb,
  Handshake,
  Coins,
  Building2,
  Target,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const values = [
  {
    icon: Eye,
    title: "Transparency",
    description:
      "Clear fee structures, no hidden charges, and open communication at every step of the financing process.",
  },
  {
    icon: Shield,
    title: "Accessibility",
    description:
      "Making cryptocurrency financing available to everyone with flexible amounts from 500 to 100,000 PRN.",
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description:
      "Leveraging blockchain technology and the BroNova token to provide a modern, interest-free financing solution.",
  },
  {
    icon: Handshake,
    title: "Trust",
    description:
      "Built on secure KYC processes, electronic contracts, and a reliable partnership with CapiMax Investment.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight lg:text-5xl">
              About Nova Digital Finance
            </h1>
            <p className="text-lg text-muted-foreground lg:text-xl">
              Providing accessible, interest-free cryptocurrency financing to
              empower individuals and businesses through the BroNova (PRN) token
              ecosystem.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <div className="mb-4 inline-flex items-center rounded-full border bg-muted px-4 py-1.5 text-sm font-medium">
                  <Target className="mr-2 h-4 w-4 text-primary" />
                  Our Mission
                </div>
                <h2 className="mb-4 text-3xl font-bold">
                  Democratizing Cryptocurrency Access
                </h2>
                <p className="mb-4 text-muted-foreground">
                  Nova Digital Finance was founded with a simple yet powerful
                  mission: to make cryptocurrency financing accessible to
                  everyone, without the burden of interest charges. We believe
                  that access to digital assets should not be limited by
                  traditional financial barriers.
                </p>
                <p className="text-muted-foreground">
                  Through our innovative financing model, clients receive
                  BroNova (PRN) tokens at their USD equivalent value, repaying
                  only the principal amount in equal monthly installments with
                  just a small one-time processing fee.
                </p>
              </div>
              <div className="rounded-2xl border bg-card p-8">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                  <Coins className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-3 text-xl font-semibold">
                  About BroNova (PRN)
                </h3>
                <p className="mb-4 text-muted-foreground">
                  BroNova (PRN) is the cryptocurrency token at the heart of our
                  financing ecosystem. When you receive financing through Nova
                  Digital Finance, your approved amount is disbursed in PRN
                  tokens at the current USD equivalent value.
                </p>
                <p className="text-muted-foreground">
                  These tokens can then be used for investment through the
                  CapiMax Investment platform, giving you access to
                  cryptocurrency-based investment opportunities while you repay
                  your financing through convenient monthly installments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Our Values</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              These core principles guide everything we do at Nova Digital
              Finance and define how we serve our clients.
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <Card key={value.title} className="text-center">
                <CardContent className="pt-6">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <value.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Partnership */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-2xl border bg-card p-8 lg:p-12">
              <div className="grid items-center gap-8 lg:grid-cols-2">
                <div>
                  <div className="mb-4 inline-flex items-center rounded-full border bg-muted px-4 py-1.5 text-sm font-medium">
                    <Building2 className="mr-2 h-4 w-4 text-primary" />
                    Strategic Partnership
                  </div>
                  <h2 className="mb-4 text-3xl font-bold">
                    Partnership with CapiMax Investment
                  </h2>
                  <p className="mb-4 text-muted-foreground">
                    Nova Digital Finance has established a strategic partnership
                    with CapiMax Investment to provide our clients with a
                    comprehensive financing and investment experience.
                  </p>
                  <p className="text-muted-foreground">
                    Through this trilateral relationship between Nova Finance,
                    the client, and CapiMax, clients can seamlessly use their
                    BroNova tokens for investment opportunities while managing
                    their repayment schedule through our platform.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <h4 className="mb-1 font-semibold">Nova Digital Finance</h4>
                    <p className="text-sm text-muted-foreground">
                      Provides interest-free financing in BroNova tokens and
                      manages the client relationship.
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <h4 className="mb-1 font-semibold">CapiMax Investment</h4>
                    <p className="text-sm text-muted-foreground">
                      Manages investment portfolios and provides the platform for
                      deploying BroNova tokens.
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <h4 className="mb-1 font-semibold">The Client</h4>
                    <p className="text-sm text-muted-foreground">
                      Receives financing, invests through CapiMax, and repays
                      monthly through Nova Finance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
