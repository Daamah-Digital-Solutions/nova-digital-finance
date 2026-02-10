"use client";

import { useState } from "react";
import { Mail, MapPin, Clock, Send, Phone, MessageSquare, ShieldCheck, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const subject = encodeURIComponent(
      formData.subject || "Contact Form Inquiry"
    );
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`
    );

    window.location.href = `mailto:support@novadf.com?subject=${subject}&body=${body}`;
  };

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight lg:text-5xl">
              Contact Us
            </h1>
            <p className="text-lg text-muted-foreground lg:text-xl">
              Have questions or need assistance? We are here to help. Reach out
              to us and our team will respond as soon as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_380px]">
            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>Send Us a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Your full name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Select a topic...</option>
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Financing Application">Financing Application</option>
                      <option value="Payment & Repayment">Payment & Repayment</option>
                      <option value="KYC Verification">KYC Verification</option>
                      <option value="Account Issues">Account Issues</option>
                      <option value="Technical Support">Technical Support</option>
                      <option value="Pronova Tokens & CapiMax">Pronova Tokens & CapiMax</option>
                      <option value="Partnership Inquiry">Partnership Inquiry</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Please describe your question or concern in detail..."
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Send Message
                    <Send className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    This will open your email client to send the message directly.
                  </p>
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-6">
              <Card>
                <CardContent className="flex gap-4 p-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Email</h3>
                    <a
                      href="mailto:support@novadf.com"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      support@novadf.com
                    </a>
                    <br />
                    <a
                      href="mailto:info@novadf.com"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      info@novadf.com
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex gap-4 p-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Phone</h3>
                    <a
                      href="tel:+18001234567"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      +1 (800) 123-4567
                    </a>
                    <p className="text-xs text-muted-foreground mt-1">
                      Available during business hours
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex gap-4 p-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Office</h3>
                    <p className="text-sm text-muted-foreground">
                      Nova Digital Finance
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Digital Finance District
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex gap-4 p-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Business Hours</h3>
                    <p className="text-sm text-muted-foreground">
                      Monday - Friday: 9:00 AM - 6:00 PM
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Saturday: 10:00 AM - 2:00 PM
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Sunday: Closed
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary text-primary-foreground">
                <CardContent className="p-6">
                  <h3 className="mb-2 font-semibold">Need Urgent Help?</h3>
                  <p className="text-sm text-primary-foreground/80">
                    For urgent account or payment issues, email us at{" "}
                    <a
                      href="mailto:support@novadf.com?subject=URGENT"
                      className="underline font-medium text-primary-foreground"
                    >
                      support@novadf.com
                    </a>{" "}
                    with your client ID in the subject line for priority
                    assistance.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Help Topics */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="mb-4 text-2xl font-bold">How Can We Help?</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Choose the topic that best matches your inquiry so we can direct
              you to the right team.
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">Financing</h3>
                <p className="text-sm text-muted-foreground">
                  Questions about applications, terms, amounts, fees, or the
                  financing process.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">KYC & Verification</h3>
                <p className="text-sm text-muted-foreground">
                  Help with identity verification, document uploads, or
                  account approval status.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">Account Support</h3>
                <p className="text-sm text-muted-foreground">
                  Password resets, login issues, account settings, or profile
                  updates.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">General Inquiries</h3>
                <p className="text-sm text-muted-foreground">
                  Partnership opportunities, media inquiries, or anything else
                  we can help with.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Response Time */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-2xl font-bold">Expected Response Times</h2>
            <p className="mb-8 text-muted-foreground">
              We strive to respond to all inquiries promptly. Here is what you
              can expect:
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border bg-card p-6">
                <p className="text-3xl font-bold text-primary">{"<"} 2h</p>
                <p className="mt-2 text-sm font-medium">Urgent Issues</p>
                <p className="text-xs text-muted-foreground">
                  Account lockouts, payment failures
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <p className="text-3xl font-bold text-primary">{"<"} 24h</p>
                <p className="mt-2 text-sm font-medium">General Support</p>
                <p className="text-xs text-muted-foreground">
                  Financing questions, KYC help
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <p className="text-3xl font-bold text-primary">2-3 days</p>
                <p className="mt-2 text-sm font-medium">Partnerships</p>
                <p className="text-xs text-muted-foreground">
                  Business inquiries, media requests
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
