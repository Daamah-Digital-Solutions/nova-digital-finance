"use client";

export default function TermsPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight lg:text-5xl">
              Terms of Service
            </h1>
            <p className="text-muted-foreground">
              Last updated: January 2026
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="prose prose-neutral dark:prose-invert mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold">1. Introduction</h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              Welcome to Nova Digital Finance. These Terms of Service
              (&quot;Terms&quot;) govern your use of the Nova Digital Finance
              platform and services. By accessing or using our platform, you
              agree to be bound by these Terms. If you do not agree with any
              part of these Terms, you must not use our services.
            </p>

            <h2 className="text-2xl font-bold">2. Service Description</h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              Nova Digital Finance provides interest-free cryptocurrency
              financing services through the BroNova (PRN) token. Our platform
              enables qualified individuals to apply for financing ranging from
              500 to 100,000 PRN, with repayment periods of 6 to 36 months. A
              one-time processing fee of 3-5% applies to all financing
              agreements. Financing is subject to approval based on completion
              of KYC verification and application review.
            </p>

            <h2 className="text-2xl font-bold">3. Eligibility</h2>
            <p className="mb-4 text-muted-foreground leading-relaxed">
              To use our services, you must:
            </p>
            <ul className="mb-6 space-y-2 text-muted-foreground">
              <li>Be at least 18 years of age or the legal age of majority in your jurisdiction</li>
              <li>Complete the Know Your Customer (KYC) verification process with valid identification documents</li>
              <li>Provide accurate and truthful information during registration and application</li>
              <li>Not be a resident of any jurisdiction where cryptocurrency services are prohibited</li>
              <li>Have the legal capacity to enter into binding agreements</li>
            </ul>

            <h2 className="text-2xl font-bold">4. Account Registration</h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              You are responsible for maintaining the confidentiality of your
              account credentials and for all activities that occur under your
              account. You must immediately notify Nova Digital Finance of any
              unauthorized use of your account. We reserve the right to suspend
              or terminate accounts that violate these Terms or are suspected
              of fraudulent activity.
            </p>

            <h2 className="text-2xl font-bold">5. Fees and Charges</h2>
            <p className="mb-4 text-muted-foreground leading-relaxed">
              The following fees apply to our services:
            </p>
            <ul className="mb-6 space-y-2 text-muted-foreground">
              <li>
                <strong>Processing Fee:</strong> A one-time, non-refundable
                fee of 3-5% of the financing amount, payable before the
                disbursement of funds
              </li>
              <li>
                <strong>Interest:</strong> No interest is charged on
                financing. You repay only the principal amount
              </li>
              <li>
                <strong>Late Payment:</strong> Late or missed payments may
                result in penalties as specified in your financing contract
              </li>
            </ul>

            <h2 className="text-2xl font-bold">6. Repayment Obligations</h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              Upon receiving financing, you are obligated to make equal monthly
              repayments as specified in your signed financing contract. Payments
              must be made on or before the scheduled due date each month.
              Failure to make timely payments may result in penalties,
              suspension of services, or legal action as permitted by applicable
              law. The total repayment amount equals the financing principal
              divided equally across the chosen repayment period.
            </p>

            <h2 className="text-2xl font-bold">7. KYC and Privacy</h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              We collect and process personal information as part of our KYC
              verification process and service delivery. All personal data is
              handled in accordance with our Privacy Policy. By using our
              services, you consent to the collection, use, and processing of
              your personal information as described in our Privacy Policy. We
              implement appropriate technical and organizational measures to
              protect your data.
            </p>

            <h2 className="text-2xl font-bold">8. Electronic Signatures and Contracts</h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              By using our platform, you agree that electronic signatures on
              contracts and agreements are legally binding and equivalent to
              handwritten signatures. All contracts entered into through the
              platform are trilateral agreements between you, Nova Digital
              Finance, and CapiMax Investment, and are enforceable under
              applicable law.
            </p>

            <h2 className="text-2xl font-bold">9. Intellectual Property</h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              All content, logos, trademarks, and intellectual property on the
              Nova Digital Finance platform are owned by or licensed to Nova
              Digital Finance. You may not copy, reproduce, distribute, or
              create derivative works from any content on the platform without
              prior written consent.
            </p>

            <h2 className="text-2xl font-bold">10. Limitation of Liability</h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              To the maximum extent permitted by applicable law, Nova Digital
              Finance shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages arising from your use of or
              inability to use the platform or services. This includes, but is
              not limited to, damages for loss of profits, data, or other
              intangible losses. Our total liability for any claim arising from
              these Terms shall not exceed the total fees paid by you to Nova
              Digital Finance in the twelve months preceding the claim.
            </p>

            <h2 className="text-2xl font-bold">11. Termination</h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate your access to our
              services at any time, with or without cause, and with or without
              notice. Upon termination, all outstanding repayment obligations
              remain in effect and must be fulfilled according to the terms of
              your financing contract.
            </p>

            <h2 className="text-2xl font-bold">12. Governing Law</h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with
              applicable laws. Any disputes arising from these Terms or your
              use of the platform shall be resolved through appropriate legal
              channels in the jurisdiction specified in your financing contract.
            </p>

            <h2 className="text-2xl font-bold">13. Changes to Terms</h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              Nova Digital Finance reserves the right to modify these Terms at
              any time. Changes will be effective upon posting to the platform.
              Your continued use of the platform after changes are posted
              constitutes your acceptance of the modified Terms.
            </p>

            <h2 className="text-2xl font-bold">14. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms of Service, please
              contact us through our{" "}
              <a href="/contact" className="text-primary underline">
                contact page
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
