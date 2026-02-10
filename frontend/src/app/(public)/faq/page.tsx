"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, Coins, FileText, CreditCard, Shield, UserCheck, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface FAQ {
  question: string;
  answer: string;
}

interface FAQCategory {
  name: string;
  icon: React.ElementType;
  faqs: FAQ[];
}

const faqCategories: FAQCategory[] = [
  {
    name: "General",
    icon: HelpCircle,
    faqs: [
      {
        question: "What is Nova Digital Finance?",
        answer:
          "Nova Digital Finance is a digital financing platform that provides interest-free cryptocurrency financing to individuals and businesses. We offer financing in Pronova (PRN) tokens, allowing clients to access digital assets without the burden of traditional interest charges. Our mission is to democratize cryptocurrency access through an innovative, transparent, and accessible financing model.",
      },
      {
        question: "What is Pronova (PRN)?",
        answer:
          "Pronova (PRN) is the cryptocurrency token at the heart of our financing ecosystem. When you receive financing through Nova Digital Finance, your approved amount is disbursed in PRN tokens at the current USD equivalent value. These tokens can be used for investment through our partner platform, CapiMax Investment, giving you access to cryptocurrency-based investment opportunities.",
      },
      {
        question: "Is Nova Digital Finance regulated?",
        answer:
          "Nova Digital Finance operates within the framework of digital asset regulations. We implement strict Know Your Customer (KYC) and Anti-Money Laundering (AML) procedures to ensure compliance and protect our clients. All financing agreements are formalized through electronic contracts that are legally binding.",
      },
      {
        question: "Who can use Nova Digital Finance?",
        answer:
          "Our platform is available to individuals aged 18 and above who can pass our KYC verification process. You will need a valid government-issued ID and proof of address to complete the verification. We aim to make cryptocurrency financing accessible to as many people as possible while maintaining regulatory compliance.",
      },
    ],
  },
  {
    name: "Financing",
    icon: Coins,
    faqs: [
      {
        question: "How does the financing process work?",
        answer:
          "The financing process is straightforward: First, you submit a financing application specifying the amount you need (between 500 and 100,000 PRN). After submitting, you sign the financing contract electronically. Then you pay a one-time processing fee (3-5% of the financing amount). Once the fee is confirmed, your financing becomes active and Pronova tokens are disbursed to your account. You then repay the principal in equal monthly installments over your chosen term.",
      },
      {
        question: "What financing amounts are available?",
        answer:
          "We offer financing amounts ranging from 500 PRN to 100,000 PRN, equivalent to their USD value at the time of disbursement. You can choose the exact amount that suits your needs within this range when submitting your application.",
      },
      {
        question: "What are the repayment terms?",
        answer:
          "Repayment terms range from 6 to 36 months. You can select the term that best fits your financial situation. All repayments are made in equal monthly installments. Since our financing is interest-free, you only repay the original principal amount plus the one-time processing fee paid upfront.",
      },
      {
        question: "Is the financing really interest-free?",
        answer:
          "Yes, our financing is completely interest-free. You only pay back the principal amount you received, divided into equal monthly installments over your chosen repayment period. The only additional cost is the one-time processing fee (3-5%) paid at the start of the financing, which covers administrative and operational costs.",
      },
      {
        question: "What is the processing fee?",
        answer:
          "The processing fee is a one-time charge of 3% to 5% of the total financing amount, depending on the term length and amount. This fee is paid upfront after you sign the financing contract and before the tokens are disbursed. It covers administrative costs, KYC verification, contract processing, and platform maintenance. There are no hidden fees or recurring charges beyond this.",
      },
    ],
  },
  {
    name: "Application Process",
    icon: FileText,
    faqs: [
      {
        question: "How do I apply for financing?",
        answer:
          "To apply, create an account on our platform, complete the KYC verification process, and then navigate to the financing section in your dashboard. Fill in the application form with your desired financing amount and repayment term, then submit it. The process is fully digital and can be completed in minutes.",
      },
      {
        question: "What documents do I need for KYC verification?",
        answer:
          "For KYC verification, you will need: a valid government-issued photo ID (passport, national ID card, or driver's license), proof of address (utility bill, bank statement, or government letter dated within the last 3 months), and a selfie for identity confirmation. All documents can be uploaded directly through our platform.",
      },
      {
        question: "How long does the application process take?",
        answer:
          "The entire process from application to receiving your tokens can be completed quickly. After submitting your application, you immediately proceed to sign the electronic contract. Once you pay the processing fee, your financing is activated and tokens are disbursed. The speed depends primarily on how quickly you complete each step.",
      },
      {
        question: "What happens after I submit my application?",
        answer:
          "After submitting your application, you will be directed to review and sign the financing contract electronically. The contract outlines all terms including the financing amount, repayment schedule, and processing fee. Once signed, you proceed to pay the processing fee. After the fee payment is confirmed, your financing becomes active and PRN tokens are added to your account.",
      },
    ],
  },
  {
    name: "Payments & Repayment",
    icon: CreditCard,
    faqs: [
      {
        question: "How do I make monthly repayments?",
        answer:
          "Monthly repayments can be made through your dashboard on the Nova Digital Finance platform. You will see your repayment schedule with due dates and amounts. Payments can be made using supported payment methods available on the platform. You will receive reminders before each payment is due.",
      },
      {
        question: "What payment methods are accepted for the processing fee?",
        answer:
          "The processing fee can be paid via credit card, debit card, or bank transfer through our secure payment gateway powered by Stripe. All payment transactions are encrypted and processed securely.",
      },
      {
        question: "Can I repay my financing early?",
        answer:
          "Yes, early repayment is allowed. Since our financing is interest-free, there are no prepayment penalties. You can pay off your remaining balance at any time through your dashboard. Early repayment will simply close your financing ahead of schedule without any additional charges.",
      },
      {
        question: "What happens if I miss a payment?",
        answer:
          "If you miss a payment, you will receive a notification reminding you of the overdue amount. We encourage you to contact our support team as soon as possible if you anticipate any difficulty making a payment. We work with our clients to find solutions and may be able to adjust your repayment schedule in certain circumstances.",
      },
    ],
  },
  {
    name: "Pronova Token & CapiMax",
    icon: Building2,
    faqs: [
      {
        question: "How do I use my Pronova (PRN) tokens?",
        answer:
          "Once your financing is activated and PRN tokens are disbursed to your account, you can use them for investment through the CapiMax Investment platform. CapiMax provides various cryptocurrency-based investment opportunities where you can deploy your tokens to potentially grow your portfolio while you repay your financing.",
      },
      {
        question: "What is CapiMax Investment?",
        answer:
          "CapiMax Investment is our strategic partner that provides a platform for deploying Pronova tokens into investment opportunities. Through the trilateral relationship between Nova Digital Finance, the client, and CapiMax, you can seamlessly invest your PRN tokens while managing your repayment schedule through our platform.",
      },
      {
        question: "What is the value of PRN tokens?",
        answer:
          "PRN tokens are valued at their USD equivalent at the time of disbursement. When you receive financing, the token amount corresponds to the dollar value of your approved financing. The value of PRN within the CapiMax investment ecosystem may fluctuate based on market conditions and investment performance.",
      },
      {
        question: "Can I withdraw or transfer my PRN tokens?",
        answer:
          "PRN tokens received through financing are primarily designed for use within the CapiMax Investment ecosystem. Specific withdrawal and transfer policies are outlined in your financing contract. For detailed information about token transferability, please refer to your contract terms or contact our support team.",
      },
    ],
  },
  {
    name: "Account & Security",
    icon: Shield,
    faqs: [
      {
        question: "How do I create an account?",
        answer:
          "Creating an account is simple. Click the 'Get Started' or 'Sign Up' button on our website, provide your email address and create a secure password. You will receive a verification email to confirm your account. Once verified, you can log in and begin the KYC verification process to access financing features.",
      },
      {
        question: "How is my personal information protected?",
        answer:
          "We take data security seriously. All personal information is encrypted both in transit and at rest using industry-standard encryption protocols. Our platform uses HTTPS for all communications, and we implement strict access controls. KYC documents are stored securely and handled in compliance with data protection regulations.",
      },
      {
        question: "What if I forget my password?",
        answer:
          "If you forget your password, click the 'Forgot Password' link on the login page. Enter your registered email address, and we will send you a password reset link. Follow the instructions in the email to create a new password. For security purposes, the reset link expires after a limited time.",
      },
      {
        question: "How do I contact customer support?",
        answer:
          "You can reach our customer support team through the Contact page on our website, by emailing support@novadf.com, or through the help section in your dashboard. Our team is available to assist you with any questions about your account, financing, payments, or any other concerns.",
      },
    ],
  },
  {
    name: "Contracts & Documents",
    icon: UserCheck,
    faqs: [
      {
        question: "How does electronic signing work?",
        answer:
          "Our platform uses a secure electronic signature system. After submitting your financing application, you will be presented with the financing contract. You can review all terms carefully and then sign by typing your full legal name. The signed document is timestamped and stored securely. You can download a copy of your signed contract at any time from your dashboard.",
      },
      {
        question: "What documents will I receive?",
        answer:
          "After completing the financing process, you will receive two key documents: a Financing Certificate confirming the details of your financing (amount, term, repayment schedule), and a Financing Contract which is the legally binding agreement outlining all terms and conditions. Both documents are available for download from your dashboard at any time.",
      },
      {
        question: "Can I review the contract before signing?",
        answer:
          "Absolutely. We encourage all clients to read the contract thoroughly before signing. The contract is presented to you in full before you provide your electronic signature. You can take as much time as you need to review the terms. If you have any questions about the contract, contact our support team before signing.",
      },
    ],
  },
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (key: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight lg:text-5xl">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-muted-foreground lg:text-xl">
              Find answers to common questions about Nova Digital Finance,
              Pronova tokens, and our financing process.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <div className="space-y-10">
              {faqCategories.map((category) => (
                <div key={category.name}>
                  <div className="mb-4 flex items-center gap-2">
                    <category.icon className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">{category.name}</h2>
                  </div>
                  <div className="space-y-3">
                    {category.faqs.map((faq, index) => {
                      const key = `${category.name}-${index}`;
                      return (
                        <Card key={key}>
                          <button
                            onClick={() => toggleItem(key)}
                            className="flex w-full items-center justify-between p-4 text-left"
                          >
                            <span className="pr-4 font-medium">
                              {faq.question}
                            </span>
                            <ChevronDown
                              className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
                                openItems.has(key) ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                          {openItems.has(key) && (
                            <CardContent className="border-t pt-4">
                              <p className="text-muted-foreground whitespace-pre-line">
                                {faq.answer}
                              </p>
                            </CardContent>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-2xl font-bold">
              Still Have Questions?
            </h2>
            <p className="mb-6 text-muted-foreground">
              If you could not find the answer you were looking for, feel free to
              reach out to our support team.
            </p>
            <a
              href="/contact"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
