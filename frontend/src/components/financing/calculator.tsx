"use client";

import { useState, useEffect } from "react";
import { Calculator, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/api";

interface CalculatorResult {
  bronova_amount: string;
  usd_equivalent: string;
  fee_percentage: string;
  fee_amount: string;
  repayment_period_months: number;
  monthly_installment: string;
  total_repayment: string;
  total_cost: string;
}

interface FinancingCalculatorProps {
  onApply?: (amount: number, period: number) => void;
  showApplyButton?: boolean;
}

export function FinancingCalculator({
  onApply,
  showApplyButton = true,
}: FinancingCalculatorProps) {
  const [amount, setAmount] = useState(5000);
  const [period, setPeriod] = useState("12");
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      calculate();
    }, 300);
    return () => clearTimeout(timer);
  }, [amount, period]);

  const calculate = async () => {
    if (amount < 500 || amount > 100000) return;
    setLoading(true);
    try {
      const response = await api.get("/financing/calculator/", {
        params: { amount, period: parseInt(period) },
      });
      setResult(response.data);
    } catch {
      // Calculate locally as fallback
      const feeAmount = (amount * 4) / 100;
      const monthly = amount / parseInt(period);
      setResult({
        bronova_amount: amount.toString(),
        usd_equivalent: amount.toString(),
        fee_percentage: "4.00",
        fee_amount: feeAmount.toFixed(2),
        repayment_period_months: parseInt(period),
        monthly_installment: monthly.toFixed(2),
        total_repayment: amount.toString(),
        total_cost: (amount + feeAmount).toFixed(2),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Financing Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>How many PRN do you need?</Label>
            <p className="text-xs text-muted-foreground">1 PRN = 1 USD</p>
            <Input
              type="number"
              min={500}
              max={100000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
            <input
              type="range"
              min={500}
              max={100000}
              step={500}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>500 PRN</span>
              <span>100,000 PRN</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Repayment Period</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[6, 9, 12, 18, 24, 30, 36].map((m) => (
                  <SelectItem key={m} value={m.toString()}>
                    {m} months
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {result && (
          <>
            <Separator />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Pronova Amount</p>
                <p className="text-lg font-bold">
                  {parseFloat(result.bronova_amount).toLocaleString()} PRN
                </p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">USD Equivalent</p>
                <p className="text-lg font-bold">
                  ${parseFloat(result.usd_equivalent).toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">
                  Processing Fee ({result.fee_percentage}%)
                </p>
                <p className="text-lg font-bold">${result.fee_amount}</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-3">
                <p className="text-xs text-muted-foreground">
                  Monthly Installment
                </p>
                <p className="text-lg font-bold text-primary">
                  {parseFloat(result.monthly_installment).toLocaleString()} PRN
                </p>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Repayment</span>
                <span className="font-medium">
                  {parseFloat(result.total_repayment).toLocaleString()} PRN
                </span>
              </div>
              <div className="mt-1 flex justify-between text-sm">
                <span className="text-muted-foreground">Total Cost (incl. fee)</span>
                <span className="font-medium">
                  ${parseFloat(result.total_cost).toLocaleString()}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                * Interest-free. 1 PRN = 1 USD. You pay the PRN amount in USD plus the one-time processing fee.
                Upon approval, you receive a Certificate of PRN Ownership for investment with CapiMax.
              </p>
            </div>

            {showApplyButton && onApply && (
              <Button
                className="w-full"
                onClick={() => onApply(amount, parseInt(period))}
              >
                Apply for PRN
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
