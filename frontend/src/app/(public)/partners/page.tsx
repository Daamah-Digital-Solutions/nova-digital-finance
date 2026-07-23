import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Building2,
  Globe,
  HeartHandshake,
} from "lucide-react";

const partners = [
  {
    slug: "tdh-developments",
    name: "TDH Developments",
    countries: "UK · UAE",
    description:
      "Real estate development and investment solutions across the UK and Middle East, focused on residential and mixed-use projects.",
    website: "https://www.tdhdevelopments.com",
    logo: "/partners/tdh-developments.png",
  },
  {
    slug: "nova-property-management",
    name: "Nova Property Management",
    countries: "UK",
    description:
      "Luxury and commercial property specialists managing premium portfolios across the United Kingdom.",
    website: "https://novapropertymanagment.com/",
    logo: "/partners/nova-property-management.png",
  },
  {
    slug: "elitegate-properties",
    name: "Elite Gate Properties",
    countries: "UK",
    description:
      "Premium real estate and property management services, delivering high-end residential and investment opportunities.",
    website: "https://elitegateproperties.com/",
    logo: "/partners/elitegate-properties.png",
  },
  {
    slug: "capimax-development-uk",
    name: "Capimax Development UK",
    countries: "UK",
    description:
      "Construction and development projects across the UK, part of the Capimax Group's real-estate investment arm.",
    website: "https://www.capimaxdevelopment.com",
    logo: "/partners/capimax-development-uk.png",
  },
  {
    slug: "primeinn-hotels",
    name: "Prime Inn Hotels",
    countries: "USA · UK",
    description:
      "Hotel chain offering exclusive hospitality investment opportunities across the United States and United Kingdom.",
    website: "https://priminnhotels.com/",
    logo: "/partners/primeinn-hotels.png",
  },
  {
    slug: "capimax-rt",
    name: "Capimax RT",
    countries: "Global",
    description:
      "Real-estate tokenization platform that converts property assets into digital tokens, opening fractional, blockchain-based property investment to a global audience.",
    website: "https://capimaxrt.tech",
    logo: "/partners/capimax-rt.svg",
  },
  {
    slug: "capimax-asset",
    name: "Capimax Asset",
    countries: "UK · USA · UAE",
    description:
      "A global diversified asset-ownership group headquartered in London, with branches in the US and UAE, holding licensed companies across asset funds, financial markets, real estate, and general trading.",
    website: "https://capimaxinvestment.com",
    logo: "/partners/capimax-asset.svg",
  },
  {
    slug: "capimax-brx",
    name: "Capimax BRX",
    countries: "Global",
    description:
      "Blockchain Real-Estate Exchange — a digital marketplace for issuing and trading tokenized real-estate assets with transparency and liquidity.",
    website: "https://capimaxbrx.com",
    logo: "/partners/capimax-brx.svg",
  },
  {
    slug: "capimax-propshare",
    name: "Capimax PropShare",
    countries: "Global",
    description:
      "Fractional real-estate investment platform that lets investors own shares in premium properties instead of purchasing whole assets outright.",
    website: "https://capimaxpropshare.com",
    logo: "/partners/capimax-propshare.svg",
  },
];

export default function PartnersPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/5 via-background to-primary/10 py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <Link
            href="/"
            className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to home
          </Link>

          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border bg-background/70 px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary backdrop-blur">
              <HeartHandshake className="h-3 w-3" />
              Real-Estate Partners
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight lg:text-5xl">
              Where you can use your{" "}
              <span className="text-primary">Nova Sukuk</span>
            </h1>
            <p className="mx-auto max-w-2xl text-base text-muted-foreground lg:text-lg">
              Your Nova Sukuk are accepted as a
              means of payment across our real-estate partner network — a
              curated group of developers, property managers, and hospitality
              operators within the Capimax Group ecosystem.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                {partners.length} active partners
              </span>
              <span className="hidden h-3 w-px bg-border sm:block" />
              <span className="inline-flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-primary" />
                UK · USA · UAE
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Partners grid */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {partners.map((partner) => (
              <article
                key={partner.slug}
                className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
              >
                {/* Logo plate */}
                <div className="flex h-32 items-center justify-center border-b bg-white p-6 dark:bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-1 flex items-center gap-2">
                    <h2 className="text-lg font-semibold leading-tight">
                      {partner.name}
                    </h2>
                  </div>
                  <p className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                    <Globe className="h-3 w-3" />
                    {partner.countries}
                  </p>
                  <p className="mb-5 flex-1 text-sm text-muted-foreground">
                    {partner.description}
                  </p>

                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center justify-center rounded-lg border bg-background px-4 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    Visit website
                    <ExternalLink className="ml-2 h-3.5 w-3.5" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            Looking for the full Capimax Group company directory?
          </p>
          <a
            href="https://capimaxgroup.com/companies"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center rounded-xl border bg-background px-6 text-sm font-medium hover:border-emerald-500/40 hover:bg-emerald-500/5"
          >
            Explore All Capimax Group Companies
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </div>
      </section>
    </>
  );
}
