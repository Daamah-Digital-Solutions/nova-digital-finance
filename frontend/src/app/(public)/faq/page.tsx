"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Loader2, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { toast } from "sonner";

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  order: number;
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const response = await api.get("/content/faq/");
        setFaqs(response.data.results || response.data);
      } catch (error) {
        toast.error("Failed to load FAQs. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchFAQs();
  }, []);

  const toggleItem = (id: number) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Group FAQs by category
  const groupedFaqs = faqs.reduce<Record<string, FAQ[]>>((acc, faq) => {
    const category = faq.category || "General";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(faq);
    return acc;
  }, {});

  const categoryOrder = Object.keys(groupedFaqs).sort();

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
              BroNova tokens, and our financing process.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                  </div>
                ))}
              </div>
            ) : categoryOrder.length === 0 ? (
              <div className="py-12 text-center">
                <HelpCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No FAQs available</h3>
                <p className="text-muted-foreground">
                  Check back later for frequently asked questions.
                </p>
              </div>
            ) : (
              <div className="space-y-10">
                {categoryOrder.map((category) => (
                  <div key={category}>
                    <h2 className="mb-4 text-xl font-semibold">{category}</h2>
                    <div className="space-y-3">
                      {groupedFaqs[category]
                        .sort((a, b) => a.order - b.order)
                        .map((faq) => (
                          <Card key={faq.id}>
                            <button
                              onClick={() => toggleItem(faq.id)}
                              className="flex w-full items-center justify-between p-4 text-left"
                            >
                              <span className="pr-4 font-medium">
                                {faq.question}
                              </span>
                              <ChevronDown
                                className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
                                  openItems.has(faq.id) ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                            {openItems.has(faq.id) && (
                              <CardContent className="border-t pt-4">
                                <p className="text-muted-foreground whitespace-pre-line">
                                  {faq.answer}
                                </p>
                              </CardContent>
                            )}
                          </Card>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
