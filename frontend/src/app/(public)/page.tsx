import Link from "next/link";
import {
  ArrowRight,
  Shield,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle,
  ExternalLink,
} from "lucide-react";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center rounded-full border bg-muted px-4 py-1.5 text-sm">
              <span className="mr-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                New
              </span>
              Interest-Free Cryptocurrency Financing
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight lg:text-6xl">
              Finance Your Future with{" "}
              <span className="text-primary">BroNova (PRN)</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground lg:text-xl">
              Acquire BroNova (PRN) tokens at a fixed rate of 1 PRN = 1 USD with
              only a 3-5% processing fee. Receive a Certificate of PRN Ownership,
              repay monthly, and invest through CapiMax.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-medium text-primary-foreground hover:bg-primary/90"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex h-12 items-center justify-center rounded-lg border bg-background px-8 text-base font-medium hover:bg-accent"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Why Nova Digital Finance?</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              We provide a transparent and accessible way to access BroNova
              cryptocurrency financing.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Shield,
                title: "Interest-Free",
                description:
                  "Zero interest on your financing. Only a small 3-5% processing fee applies.",
              },
              {
                icon: Zap,
                title: "1 PRN = 1 USD",
                description:
                  "Each BroNova token is valued at exactly 1 USD. Choose how many PRN you need and pay the equivalent in dollars.",
              },
              {
                icon: TrendingUp,
                title: "Invest via CapiMax",
                description:
                  "Receive a Certificate of PRN Ownership and use it to invest through the CapiMax investment platform.",
              },
              {
                icon: Clock,
                title: "Flexible Repayment",
                description:
                  "Choose repayment periods from 6 to 36 months with equal monthly installments.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">How It Works</h2>
          </div>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-4">
            {[
              { step: "1", title: "Register & KYC", desc: "Create your account and complete identity verification." },
              { step: "2", title: "Choose Your PRN", desc: "Select how many PRN you need (500-100,000). 1 PRN = 1 USD." },
              { step: "3", title: "Pay Fee & Sign", desc: "Pay the USD amount plus processing fee and sign the contract." },
              { step: "4", title: "Get Certificate & Invest", desc: "Receive your Certificate of PRN Ownership and invest through CapiMax." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="mb-2 font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
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
              Join Nova Digital Finance today and access interest-free BroNova
              cryptocurrency financing.
            </p>
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-white px-8 text-base font-medium text-primary hover:bg-white/90"
            >
              Create Your Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
