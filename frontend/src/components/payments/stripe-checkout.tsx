"use client";

import { useState } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import { toast } from "sonner";

interface StripeCheckoutProps {
  financingId: string;
  paymentType: "fee" | "installment";
  installmentId?: string;
  amount: number;
  applicationNumber?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export function StripeCheckout({
  financingId,
  paymentType,
  installmentId,
  amount,
  applicationNumber,
  successUrl,
  cancelUrl,
}: StripeCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const response = await api.post("/payments/stripe/checkout/", {
        financing_id: financingId,
        payment_type: paymentType,
        installment_id: installmentId,
        amount,
        success_url: successUrl || `${window.location.origin}/dashboard/financing?success=true`,
        cancel_url: cancelUrl || `${window.location.origin}/dashboard/financing?cancelled=true`,
      });

      // Redirect to Stripe Checkout
      if (response.data.session_url) {
        window.location.href = response.data.session_url;
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Failed to create checkout session"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5" />
          Pay with Card
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted p-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Payment Type</span>
            <span className="font-medium capitalize">{paymentType}</span>
          </div>
          {applicationNumber && (
            <div className="mt-1 flex justify-between text-sm">
              <span className="text-muted-foreground">Application</span>
              <span className="font-medium">{applicationNumber}</span>
            </div>
          )}
          <div className="mt-1 flex justify-between text-sm">
            <span className="text-muted-foreground">Amount</span>
            <span className="text-lg font-bold">${amount.toFixed(2)}</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          You will be redirected to Stripe&apos;s secure checkout page to
          complete your payment.
        </p>

        <Button
          onClick={handleCheckout}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CreditCard className="mr-2 h-4 w-4" />
          )}
          Pay ${amount.toFixed(2)}
        </Button>
      </CardContent>
    </Card>
  );
}
