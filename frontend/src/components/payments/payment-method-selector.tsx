"use client";

import { CreditCard, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

type PaymentMethod = "stripe_card" | "crypto";

interface PaymentMethodSelectorProps {
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
}

export function PaymentMethodSelector({
  selected,
  onSelect,
}: PaymentMethodSelectorProps) {
  const methods = [
    {
      id: "stripe_card" as PaymentMethod,
      label: "Credit/Debit Card",
      description: "Pay securely with Visa, Mastercard, or other cards",
      icon: CreditCard,
    },
    {
      id: "crypto" as PaymentMethod,
      label: "Cryptocurrency",
      description: "Pay with BTC, ETH, USDT, or other cryptocurrencies",
      icon: Wallet,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {methods.map((method) => (
        <button
          key={method.id}
          type="button"
          onClick={() => onSelect(method.id)}
          className={cn(
            "flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-colors",
            selected === method.id
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          )}
        >
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              selected === method.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            )}
          >
            <method.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">{method.label}</p>
            <p className="text-xs text-muted-foreground">
              {method.description}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
