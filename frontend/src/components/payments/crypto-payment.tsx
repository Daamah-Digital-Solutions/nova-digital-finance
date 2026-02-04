"use client";

import { useState } from "react";
import { Loader2, Wallet, Copy, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { toast } from "sonner";

interface CryptoPaymentProps {
  financingId: string;
  paymentType: "fee" | "installment";
  installmentId?: string;
  amount: number;
}

interface CryptoPaymentResult {
  payment_id: string;
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
  nowpayments_id: string;
}

export function CryptoPayment({
  financingId,
  paymentType,
  installmentId,
  amount,
}: CryptoPaymentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currency, setCurrency] = useState("btc");
  const [result, setResult] = useState<CryptoPaymentResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreatePayment = async () => {
    setIsLoading(true);
    try {
      const response = await api.post("/payments/crypto/create/", {
        financing_id: financingId,
        payment_type: paymentType,
        installment_id: installmentId,
        amount,
        crypto_currency: currency,
      });
      setResult(response.data);
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Failed to create crypto payment"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const copyAddress = () => {
    if (result?.pay_address) {
      navigator.clipboard.writeText(result.pay_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Address copied to clipboard");
    }
  };

  if (result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="h-5 w-5" />
            Crypto Payment Created
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Badge variant="secondary">Awaiting Payment</Badge>

          <div className="space-y-3 rounded-lg bg-muted p-4">
            <div>
              <p className="text-xs text-muted-foreground">Send exactly</p>
              <p className="text-lg font-bold">
                {result.pay_amount} {result.pay_currency.toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">To this address</p>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 break-all rounded bg-background p-2 text-xs">
                  {result.pay_address}
                </code>
                <Button variant="outline" size="sm" onClick={copyAddress}>
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Payment will be confirmed automatically once the transaction is
            verified on the blockchain.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wallet className="h-5 w-5" />
          Pay with Cryptocurrency
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Select Cryptocurrency</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="btc">Bitcoin (BTC)</SelectItem>
              <SelectItem value="eth">Ethereum (ETH)</SelectItem>
              <SelectItem value="usdttrc20">USDT (TRC20)</SelectItem>
              <SelectItem value="usdterc20">USDT (ERC20)</SelectItem>
              <SelectItem value="ltc">Litecoin (LTC)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg bg-muted p-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount (USD)</span>
            <span className="text-lg font-bold">${amount.toFixed(2)}</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          The exact crypto amount will be calculated at the current exchange
          rate when you create the payment.
        </p>

        <Button
          onClick={handleCreatePayment}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wallet className="mr-2 h-4 w-4" />
          )}
          Create Payment
        </Button>
      </CardContent>
    </Card>
  );
}
