import Link from "next/link";
import Image from "next/image";
import { ExternalLink } from "lucide-react";

const footerLinks = {
  Company: [
    { href: "/about", label: "About Us" },
    { href: "/how-it-works", label: "How It Works" },
    { href: "/features", label: "Features" },
    { href: "/partnership", label: "Partnership" },
  ],
  Legal: [
    { href: "/terms", label: "Terms of Service" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/risk-disclosure", label: "Risk Disclosure" },
  ],
  Support: [
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact Us" },
    { href: "/documents/verify", label: "Verify Document" },
  ],
  Invest: [
    {
      href: process.env.NEXT_PUBLIC_CAPIMAX_URL || "https://panel.capimaxinvestment.com/",
      label: "CapiMax Investment",
      external: true,
    },
  ],
};

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="mb-4 text-sm font-semibold">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      target={"external" in link ? "_blank" : undefined}
                      rel={"external" in link ? "noopener noreferrer" : undefined}
                      className="flex items-center text-sm text-muted-foreground hover:text-primary"
                    >
                      {link.label}
                      {"external" in link && (
                        <ExternalLink className="ml-1 h-3 w-3" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t pt-8">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="Nova Digital Finance"
                width={48}
                height={48}
                className="h-12 w-12 object-contain"
              />
            </Link>
            <p className="text-center text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Nova Digital Finance. All rights reserved.
              Interest-free financing in Pronova (PRN) cryptocurrency.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
