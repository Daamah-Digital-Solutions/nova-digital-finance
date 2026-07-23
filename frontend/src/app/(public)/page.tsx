import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Shield,
  ShieldCheck,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle,
  ExternalLink,
  Building2,
  Globe,
  Award,
  Coins,
  Wallet,
  Star,
  Sparkles,
  Bitcoin,
  Banknote,
  PieChart,
  Network,
  Briefcase,
  HeartHandshake,
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
              <span className="text-primary">Pronova (PRN)</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground lg:text-xl">
              Receive Pronova (PRN) financing at a fixed value of 1 PRN = 1 USD
              with only a 2% processing fee. Your financed PRN is immediately
              usable across the Capimax Ecosystem to acquire tokenized real
              estate, real-world digital assets, investment portfolios,
              completed and under-construction properties, and other global
              investment opportunities. Start investing from day one with
              flexible ownership, growth potential, and multiple exit options
              through an integrated institutional ecosystem.
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

      {/* About Pronova */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-muted/40 to-background py-20 lg:py-28">
        {/* Decorative background blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl"
        />

        <div className="container relative mx-auto px-4">
          {/* Section header with floating coin */}
          <div className="mb-14 text-center">
            <div className="relative mx-auto mb-8 h-32 w-32 lg:h-40 lg:w-40">
              <div
                aria-hidden
                className="absolute inset-0 rounded-full bg-purple-500/30 blur-2xl"
              />
              <Image
                src="/pronova-coin.png"
                alt="Pronova (PRN) coin"
                fill
                priority
                sizes="(min-width: 1024px) 160px, 128px"
                style={{ objectFit: "contain" }}
                className="animate-pronova-float drop-shadow-2xl"
              />
            </div>

            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border bg-background/70 px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary backdrop-blur">
              <Sparkles className="h-3 w-3" />
              About Pronova
            </div>
            <h2 className="mb-4 text-4xl font-bold tracking-tight lg:text-5xl">
              What is{" "}
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Pronova?
              </span>
            </h2>
            <p className="mx-auto max-w-2xl text-base text-muted-foreground lg:text-lg">
              The cryptocurrency powering every financing on Nova Digital
              Finance — backed by institutional foundations, not speculation.
            </p>
          </div>

          {/* Description + features grid */}
          <div className="mb-20 grid gap-10 lg:grid-cols-5 lg:items-center">
            <div className="space-y-5 text-muted-foreground lg:col-span-2">
              <p className="leading-relaxed">
                <strong className="text-foreground">Pronova (PRN)</strong> is a
                digital cryptocurrency founded by a British–American group
                through{" "}
                <strong className="text-foreground">
                  Capimax Blockchain &amp; FinTech
                </strong>{" "}
                and{" "}
                <strong className="text-foreground">
                  Capimax Virtual Assets
                </strong>
                , both subsidiaries of Capimax Holding UK.
              </p>
              <p className="leading-relaxed">
                Unlike speculative tokens, Pronova was designed to be a{" "}
                <strong className="text-foreground">
                  secure, stable, and valuable currency
                </strong>{" "}
                that combines everyday utility with institutional protection.
              </p>
              <ul className="space-y-2.5 pt-2">
                {[
                  "Backed by Capimax Holding UK (18+ companies)",
                  "British–American institutional foundation",
                  "Operates across UK, USA, and UAE",
                  "7+ years of blockchain & fintech experience",
                ].map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2 text-sm text-foreground"
                  >
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-3">
              {[
                {
                  icon: Building2,
                  title: "Institutional Foundation",
                  description:
                    "Developed by Capimax Blockchain & FinTech and Capimax Virtual Assets, subsidiaries of Capimax Holding UK.",
                },
                {
                  icon: ShieldCheck,
                  title: "Security & Stability",
                  description:
                    "Designed to be secure, stable, and valuable — combining daily utility with institutional protection.",
                },
                {
                  icon: Globe,
                  title: "Global Reach",
                  description:
                    "Backed by 18+ international companies across the UK, USA, and UAE for real-world opportunities.",
                },
                {
                  icon: Award,
                  title: "7+ Years Experience",
                  description:
                    "Built on extensive experience in blockchain, fintech, and virtual assets management.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="group relative overflow-hidden rounded-2xl border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-opacity group-hover:opacity-100"
                  />
                  <div className="relative mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-purple-500/15 ring-1 ring-primary/20">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="relative mb-2 text-base font-semibold">
                    {feature.title}
                  </h3>
                  <p className="relative text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div
            aria-hidden
            className="mx-auto mb-12 flex max-w-md items-center gap-3"
          >
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
            <Coins className="h-4 w-4 text-primary" />
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
          </div>

          {/* Pre-Sale Breakdown */}
          <div className="mb-10 text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border bg-background/70 px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary backdrop-blur">
              <TrendingUp className="h-3 w-3" />
              Token Sale
            </div>
            <h3 className="mb-3 text-3xl font-bold tracking-tight lg:text-4xl">
              Pre-Sale{" "}
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Breakdown
              </span>
            </h3>
            <p className="mx-auto max-w-xl text-sm text-muted-foreground lg:text-base">
              Snapshot of the Pronova (PRN) pre-sale structure across all three
              phases.
            </p>
          </div>

          {/* Stat cards */}
          <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Coins,
                label: "Total Supply",
                value: "1,000,000,000",
                hint: "PRN Tokens",
              },
              {
                icon: TrendingUp,
                label: "Pre-Sale Allocation",
                value: "250,000,000",
                hint: "25% of total supply",
              },
              {
                icon: Clock,
                label: "Duration",
                value: "90 days",
                hint: "3 phases × 30 days",
              },
              {
                icon: Wallet,
                label: "Accepted Currencies",
                value: "ETH · BNB",
                hint: "USD · USDT",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="group relative overflow-hidden rounded-2xl border bg-card p-6 text-center transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-purple-500/15 ring-1 ring-primary/20">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </div>
                <div className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-xl font-extrabold tracking-tight text-transparent lg:text-2xl">
                  {stat.value}
                </div>
                <div className="mt-1.5 text-xs text-muted-foreground">
                  {stat.hint}
                </div>
              </div>
            ))}
          </div>

          {/* Phases table */}
          <div className="mb-10 overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-1.5 py-4 sm:px-4 lg:px-6">Phase</th>
                    <th className="px-1.5 py-4 sm:px-4 lg:px-6">Duration</th>
                    <th className="px-1.5 py-4 sm:px-4 lg:px-6">Tokens</th>
                    <th className="px-1.5 py-4 sm:px-4 lg:px-6">Price / PRN</th>
                    <th className="px-1.5 py-4 text-right sm:px-4 lg:px-6">
                      Total Raised
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      n: 1,
                      duration: "30 days",
                      tokens: "100M PRN",
                      price: "$0.8",
                      raised: "$80M",
                    },
                    {
                      n: 2,
                      duration: "30 days",
                      tokens: "75M PRN",
                      price: "$1.0",
                      raised: "$75M",
                    },
                    {
                      n: 3,
                      duration: "30 days",
                      tokens: "75M PRN",
                      price: "$1.5",
                      raised: "$112.5M",
                    },
                  ].map((row) => (
                    <tr
                      key={row.n}
                      className="border-b transition-colors last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-1.5 py-4 sm:px-4 lg:px-6">
                        <div className="inline-flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary ring-1 ring-primary/20">
                            {row.n}
                          </span>
                          <span className="hidden font-semibold sm:inline">
                            Phase {row.n}
                          </span>
                        </div>
                      </td>
                      <td className="px-1.5 py-4 text-muted-foreground sm:px-4 lg:px-6">
                        {row.duration}
                      </td>
                      <td className="px-2 py-4 font-medium sm:px-4 lg:px-6">
                        {row.tokens}
                      </td>
                      <td className="px-2 py-4 font-medium sm:px-4 lg:px-6">
                        {row.price}
                      </td>
                      <td className="px-1.5 py-4 text-right font-bold text-primary sm:px-4 lg:px-6">
                        {row.raised}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gradient-to-r from-primary/5 via-purple-500/5 to-primary/5 font-semibold">
                    <td className="px-1.5 py-4 sm:px-4 lg:px-6">
                      <span className="text-foreground">Total</span>
                    </td>
                    <td className="px-1.5 py-4 sm:px-4 lg:px-6">90 days</td>
                    <td className="px-1.5 py-4 sm:px-4 lg:px-6">250M (25%)</td>
                    <td className="px-1.5 py-4 text-muted-foreground sm:px-4 lg:px-6">
                      —
                    </td>
                    <td className="px-1.5 py-4 text-right text-base font-extrabold text-primary sm:px-4 lg:px-6">
                      $267.5M
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Expected listing price callout */}
          <div className="mb-12">
            <div className="relative mx-auto max-w-2xl overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-50 via-amber-100/80 to-orange-50 p-6 text-center shadow-sm dark:border-amber-400/30 dark:from-amber-950/40 dark:via-amber-900/30 dark:to-orange-950/40 sm:p-8">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-400/30 blur-3xl"
              />
              <div className="relative mb-3 inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                <Sparkles className="h-3 w-3" />
                Projection
              </div>
              <div className="relative mb-2 text-sm font-medium text-amber-800/80 dark:text-amber-200/80">
                Expected Listing Price
              </div>
              <div className="relative flex items-center justify-center gap-3">
                <Star className="h-6 w-6 fill-amber-500 text-amber-500" />
                <div className="text-4xl font-extrabold tracking-tight text-amber-700 dark:text-amber-200 sm:text-5xl">
                  $1.7 – $2.5
                </div>
                <Star className="h-6 w-6 fill-amber-500 text-amber-500" />
              </div>
              <div className="relative mt-2 text-xs text-amber-800/70 dark:text-amber-200/70">
                Projected price range at public exchange listing.
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="https://pronovacrypto.tech/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-purple-600 px-7 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
            >
              <span className="relative mr-2 inline-block h-5 w-5">
                <Image
                  src="/pronova-coin.png"
                  alt=""
                  fill
                  sizes="20px"
                  style={{ objectFit: "contain" }}
                />
              </span>
              Visit Pronova Official
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center rounded-xl border bg-background px-7 text-sm font-medium hover:bg-accent"
            >
              Start Financing Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Capimax Group */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-emerald-50/30 to-background py-20 dark:via-emerald-950/10 lg:py-28">
        {/* Decorative blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 right-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl"
        />

        <div className="container relative mx-auto px-4">
          {/* Header */}
          <div className="mb-14 text-center">
            <div className="mx-auto mb-6 flex h-20 w-72 items-center justify-center sm:h-24 sm:w-80">
              <div className="relative flex h-full w-full items-center justify-center rounded-2xl dark:bg-white/95 dark:px-6 dark:py-3 dark:shadow-lg dark:shadow-emerald-500/10">
                <div
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-emerald-500/15 blur-2xl dark:hidden"
                />
                <div className="relative h-full w-full">
                  <Image
                    src="/capimax-group-logo.png"
                    alt="Capimax Group"
                    fill
                    sizes="(min-width: 640px) 320px, 288px"
                    style={{ objectFit: "contain" }}
                  />
                </div>
              </div>
            </div>

            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border bg-background/70 px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 backdrop-blur dark:text-emerald-400">
              <Network className="h-3 w-3" />
              Group Ecosystem
            </div>
            <h2 className="mb-4 text-4xl font-bold tracking-tight lg:text-5xl">
              Use Nova across{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
                Capimax Group
              </span>
            </h2>
            <p className="mx-auto max-w-2xl text-base text-muted-foreground lg:text-lg">
              Your Nova-financed PRN tokens are accepted across the{" "}
              <strong className="text-foreground">Capimax Group</strong>{" "}
              ecosystem — a global platform spanning fractional ownership, real
              estate, digital assets, and fintech solutions.
            </p>
          </div>

          {/* Capimax Ecosystem banner */}
          <div className="mx-auto mb-12 max-w-4xl overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="flex flex-col items-center gap-5 p-6 sm:flex-row sm:gap-7 sm:p-8">
              <div className="flex h-20 w-40 shrink-0 items-center justify-center rounded-xl bg-white p-3 dark:bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/capimax-group-logo.png"
                  alt="Capimax Ecosystem"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="mb-1.5 text-xl font-bold">Capimax Ecosystem</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  The main digital gateway that brings together all of the group&apos;s
                  platforms, partnerships, services, news, and updates in one
                  integrated ecosystem — where your Nova Sukuk goes to work.
                </p>
              </div>
              <a
                href="https://www.capimax.io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:shadow-xl"
              >
                Explore Ecosystem
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Sectors grid */}
          <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Building2,
                title: "Real Estate",
                description: "Institutional property portfolios.",
              },
              {
                icon: Bitcoin,
                title: "Digital Assets",
                description: "Tokenized financial products.",
              },
              {
                icon: Banknote,
                title: "Fintech",
                description: "Modern financial infrastructure.",
              },
              {
                icon: PieChart,
                title: "Fractional Ownership",
                description: "Accessible investment access.",
              },
            ].map((sector) => (
              <div
                key={sector.title}
                className="group relative overflow-hidden rounded-2xl border bg-card p-5 text-center transition-all hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-lg"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-emerald-500/5 blur-2xl"
                />
                <div className="relative mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 to-emerald-400/10 ring-1 ring-emerald-500/25">
                  <sector.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="relative mb-1 text-sm font-semibold">
                  {sector.title}
                </h3>
                <p className="relative text-xs leading-relaxed text-muted-foreground">
                  {sector.description}
                </p>
              </div>
            ))}
          </div>

          {/* Credibility line */}
          <div className="mb-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              UK · USA · UAE
            </span>
            <span className="hidden h-3 w-px bg-border sm:block" />
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              18+ subsidiary companies
            </span>
            <span className="hidden h-3 w-px bg-border sm:block" />
            <span className="inline-flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              British–American foundation
            </span>
          </div>

          {/* CTA */}
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="https://capimaxgroup.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-7 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:shadow-xl hover:shadow-emerald-600/30"
            >
              Visit Capimax Group
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
            <a
              href="https://capimaxgroup.com/companies"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center rounded-xl border bg-background px-7 text-sm font-medium hover:border-emerald-500/40 hover:bg-emerald-500/5"
            >
              Explore All Companies
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Why Nova Digital Finance?</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              We provide a transparent and accessible way to access Pronova
              cryptocurrency financing.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Shield,
                title: "Interest-Free",
                description:
                  "Zero interest on your financing. Only a small 2% processing fee applies.",
              },
              {
                icon: Zap,
                title: "1 PRN = 1 USD",
                description:
                  "Each Pronova token is valued at exactly 1 USD. Choose how many PRN you need and pay the equivalent in dollars.",
              },
              {
                icon: TrendingUp,
                title: "Invest via CapiMax",
                description:
                  "Receive a Nova Sukuk and use it to invest through the CapiMax investment platform.",
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
              { step: "4", title: "Get Your Nova Sukuk & Invest", desc: "Receive your Nova Sukuk and invest through the Capimax Ecosystem." },
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

      {/* Use Nova */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-primary/5 to-background py-20 lg:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 right-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
        />
        <div className="container relative mx-auto px-4">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border bg-background/70 px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary backdrop-blur">
              <Wallet className="h-3 w-3" />
              Use Nova
            </div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight lg:text-4xl">
              Spend your{" "}
              <span className="text-primary">Nova Sukuk</span> here
            </h2>
            <p className="mx-auto max-w-2xl text-base text-muted-foreground lg:text-lg">
              Your Nova Sukuk are accepted as a
              means of payment across these platforms in the Capimax Group
              ecosystem.
            </p>
          </div>

          {/* Platforms grid */}
          <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Network,
                title: "Capimax Ecosystem",
                tagline: "The digital gateway to the group",
                href: "https://www.capimax.io",
                external: true,
              },
              {
                icon: Building2,
                title: "Capimax BRX",
                tagline: "Blockchain real-estate exchange",
                href: "https://capimaxbrx.com",
                external: true,
              },
              {
                icon: PieChart,
                title: "Capimax PropShare",
                tagline: "Fractional property ownership",
                href: "https://capimaxpropshare.com",
                external: true,
              },
              {
                icon: Globe,
                title: "Capimax RT",
                tagline: "Real-estate tokenization",
                href: "https://capimaxrt.tech",
                external: true,
              },
              {
                icon: Briefcase,
                title: "Capimax Asset",
                tagline: "Diversified asset ownership",
                href: "https://capimaxinvestment.com",
                external: true,
              },
              {
                icon: HeartHandshake,
                title: "Partners",
                tagline: "Real-estate partner network",
                href: "/partners",
                external: false,
                highlight: true,
              },
            ].map((platform) => {
              const Wrapper: any = platform.external ? "a" : Link;
              const wrapperProps = platform.external
                ? {
                    href: platform.href,
                    target: "_blank",
                    rel: "noopener noreferrer",
                  }
                : { href: platform.href };

              const highlightClasses = platform.highlight
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-card hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg";

              return (
                <Wrapper
                  key={platform.title}
                  {...wrapperProps}
                  className={`group relative overflow-hidden rounded-2xl border p-5 transition-all ${highlightClasses}`}
                >
                  {!platform.highlight && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/5 blur-2xl"
                    />
                  )}

                  <div className="relative flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                        platform.highlight
                          ? "bg-primary-foreground/15 ring-1 ring-primary-foreground/20"
                          : "bg-primary/10 ring-1 ring-primary/15"
                      }`}
                    >
                      <platform.icon
                        className={`h-5 w-5 ${platform.highlight ? "text-primary-foreground" : "text-primary"}`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="truncate text-sm font-semibold">
                          {platform.title}
                        </h3>
                        {platform.external ? (
                          <ExternalLink
                            className={`h-3 w-3 shrink-0 ${platform.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                          />
                        ) : (
                          <ArrowRight
                            className={`h-3 w-3 shrink-0 transition-transform group-hover:translate-x-0.5 ${platform.highlight ? "text-primary-foreground" : "text-primary"}`}
                          />
                        )}
                      </div>
                      <p
                        className={`mt-0.5 text-xs ${
                          platform.highlight
                            ? "text-primary-foreground/80"
                            : "text-muted-foreground"
                        }`}
                      >
                        {platform.tagline}
                      </p>
                    </div>
                  </div>
                </Wrapper>
              );
            })}
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
              Join Nova Digital Finance today and access interest-free Pronova
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
