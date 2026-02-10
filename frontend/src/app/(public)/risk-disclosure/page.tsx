"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function RiskDisclosurePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight lg:text-5xl">
              Risk Disclosure
            </h1>
            <p className="text-muted-foreground">
              Last updated: January 2026
            </p>
          </div>
        </div>
      </section>

      {/* Important Notice */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <CardContent className="flex gap-4 p-6">
                <AlertTriangle className="h-6 w-6 shrink-0 text-yellow-600" />
                <div>
                  <h3 className="mb-2 font-semibold">Important Notice</h3>
                  <p className="text-sm text-muted-foreground">
                    Please read this risk disclosure carefully before using Nova
                    Digital Finance services. By using our platform, you
                    acknowledge that you have read, understood, and accepted the
                    risks outlined below.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="prose prose-neutral dark:prose-invert mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold">
              1. Cryptocurrency Market Risks
            </h2>
            <p className="mb-4 text-muted-foreground leading-relaxed">
              Cryptocurrency markets are highly volatile and subject to
              significant price fluctuations. The value of Pronova (PRN) tokens
              and other cryptocurrencies can increase or decrease substantially
              in a short period of time. Specific risks include:
            </p>
            <ul className="mb-6 space-y-2 text-muted-foreground">
              <li>
                <strong>Price Volatility:</strong> The market value of Pronova
                tokens may fluctuate significantly, and past performance is not
                indicative of future results
              </li>
              <li>
                <strong>Market Liquidity:</strong> There may be periods where it
                is difficult to buy or sell Pronova tokens at desired prices due
                to low market liquidity
              </li>
              <li>
                <strong>Regulatory Changes:</strong> Cryptocurrency regulations
                may change in various jurisdictions, potentially affecting the
                value, legality, or usability of Pronova tokens
              </li>
              <li>
                <strong>Technology Risks:</strong> Blockchain technology, while
                robust, is subject to potential technical issues including
                network congestion, smart contract vulnerabilities, and
                cybersecurity threats
              </li>
            </ul>

            <h2 className="text-2xl font-bold">
              2. Investment Risks through CapiMax
            </h2>
            <p className="mb-4 text-muted-foreground leading-relaxed">
              Pronova tokens received through financing may be used for
              investment through the CapiMax Investment platform. Investment
              activities carry inherent risks:
            </p>
            <ul className="mb-6 space-y-2 text-muted-foreground">
              <li>
                <strong>No Guaranteed Returns:</strong> Investment returns are
                not guaranteed. You may receive returns lower than expected, or
                you may lose part or all of your invested capital
              </li>
              <li>
                <strong>Third-Party Risk:</strong> CapiMax Investment is a
                separate entity from Nova Digital Finance. We do not guarantee
                the performance, solvency, or reliability of CapiMax or any
                investment opportunities offered through their platform
              </li>
              <li>
                <strong>Investment Strategy Risks:</strong> Different investment
                strategies carry different levels of risk. Higher potential
                returns typically involve higher risk of loss
              </li>
              <li>
                <strong>Operational Risk:</strong> Technical failures, system
                outages, or operational errors at CapiMax could affect your
                investments
              </li>
            </ul>

            <h2 className="text-2xl font-bold">3. Repayment Obligations</h2>
            <p className="mb-4 text-muted-foreground leading-relaxed">
              Regardless of the performance of your investments or the market
              value of Pronova tokens, you are obligated to make all scheduled
              repayments as specified in your financing contract:
            </p>
            <ul className="mb-6 space-y-2 text-muted-foreground">
              <li>
                <strong>Unconditional Obligation:</strong> Your repayment
                obligation is independent of the performance of any investments
                made with the financed tokens. Even if the value of your
                investments decreases, you must continue making scheduled
                payments
              </li>
              <li>
                <strong>Late Payment Consequences:</strong> Failure to make
                timely payments may result in penalties, additional charges,
                suspension of services, or legal action
              </li>
              <li>
                <strong>Full Repayment Required:</strong> The entire principal
                financing amount must be repaid regardless of market conditions
                or investment outcomes
              </li>
            </ul>

            <h2 className="text-2xl font-bold">
              4. No Guarantee of Returns
            </h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              Nova Digital Finance does not provide any guarantee of returns on
              investments made through CapiMax or any other platform. The value
              of Pronova tokens and any investment returns are subject to market
              forces and other factors beyond our control. You should only
              engage in financing and investment activities that you can afford
              and with funds you are prepared to potentially lose.
            </p>

            <h2 className="text-2xl font-bold">5. Processing Fee</h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              The processing fee of 3-5% is non-refundable once paid, regardless
              of whether the financing is subsequently cancelled, defaulted
              upon, or if investment returns are negative. This fee is a cost
              of the financing service and is not recoverable.
            </p>

            <h2 className="text-2xl font-bold">
              6. Security and Fraud Risks
            </h2>
            <p className="mb-4 text-muted-foreground leading-relaxed">
              While we implement security measures to protect your account and
              personal information, risks remain:
            </p>
            <ul className="mb-6 space-y-2 text-muted-foreground">
              <li>
                Phishing attacks, social engineering, and other forms of fraud
                may target users of cryptocurrency platforms
              </li>
              <li>
                You are responsible for maintaining the security of your account
                credentials and personal devices
              </li>
              <li>
                Cryptocurrency transactions are generally irreversible once
                confirmed on the blockchain
              </li>
            </ul>

            <h2 className="text-2xl font-bold">7. Regulatory Uncertainty</h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              The regulatory landscape for cryptocurrency and digital finance is
              evolving. Changes in laws, regulations, or enforcement actions in
              any jurisdiction may adversely affect the use, transfer, or value
              of Pronova tokens, or the ability of Nova Digital Finance or
              CapiMax to operate. There is no assurance that the current
              regulatory environment will remain unchanged.
            </p>

            <h2 className="text-2xl font-bold">8. Acknowledgement</h2>
            <p className="text-muted-foreground leading-relaxed">
              By using Nova Digital Finance services, you acknowledge that you
              have read and understood this risk disclosure, that you are aware
              of the risks associated with cryptocurrency financing and
              investment, and that you accept these risks. You confirm that you
              have conducted your own research and, where appropriate, have
              consulted with independent financial, legal, and tax advisors
              before making any decisions.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
