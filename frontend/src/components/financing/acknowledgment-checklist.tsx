"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface AcknowledgmentChecklistProps {
  values: {
    ackTerms: boolean;
    ackFeeNonRefundable: boolean;
    ackRepaymentSchedule: boolean;
    ackRiskDisclosure: boolean;
  };
  onChange: (field: string, value: boolean) => void;
  disabled?: boolean;
}

const acknowledgments = [
  {
    field: "ackTerms",
    label: "Terms & Conditions",
    description:
      "I have read and agree to the Nova Digital Finance Terms of Service and understand the financing terms.",
  },
  {
    field: "ackFeeNonRefundable",
    label: "Non-Refundable Fee",
    description:
      "I understand that the processing fee is non-refundable once paid, regardless of the financing outcome.",
  },
  {
    field: "ackRepaymentSchedule",
    label: "Repayment Schedule",
    description:
      "I agree to repay the full Pronova amount in equal monthly installments as per the schedule above.",
  },
  {
    field: "ackRiskDisclosure",
    label: "Risk Disclosure",
    description:
      "I acknowledge the risks associated with cryptocurrency and understand that investment returns through CapiMax are not guaranteed.",
  },
];

export function AcknowledgmentChecklist({
  values,
  onChange,
  disabled = false,
}: AcknowledgmentChecklistProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium">Acknowledgments</h3>
      <p className="text-sm text-muted-foreground">
        Please review and accept all the following before submitting your
        application.
      </p>
      {acknowledgments.map((ack) => (
        <div key={ack.field} className="flex items-start space-x-3 rounded-lg border p-4">
          <Checkbox
            id={ack.field}
            checked={values[ack.field as keyof typeof values]}
            onCheckedChange={(checked) =>
              onChange(ack.field, checked === true)
            }
            disabled={disabled}
            className="mt-0.5"
          />
          <div className="space-y-1">
            <Label htmlFor={ack.field} className="cursor-pointer font-medium">
              {ack.label}
            </Label>
            <p className="text-xs text-muted-foreground">{ack.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
