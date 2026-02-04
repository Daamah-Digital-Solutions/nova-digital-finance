import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; variant: string }> = {
  draft: { label: "Draft", variant: "secondary" },
  pending_fee: { label: "Pending Fee", variant: "warning" },
  fee_paid: { label: "Fee Paid", variant: "default" },
  pending_signature: { label: "Pending Signature", variant: "warning" },
  signed: { label: "Signed", variant: "default" },
  under_review: { label: "Under Review", variant: "secondary" },
  approved: { label: "Approved", variant: "success" },
  active: { label: "Active", variant: "success" },
  completed: { label: "Completed", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "secondary" },
  // KYC statuses
  submitted: { label: "Submitted", variant: "default" },
  // Payment statuses
  pending: { label: "Pending", variant: "warning" },
  processing: { label: "Processing", variant: "default" },
  failed: { label: "Failed", variant: "destructive" },
  refunded: { label: "Refunded", variant: "secondary" },
  // Installment statuses
  upcoming: { label: "Upcoming", variant: "secondary" },
  due: { label: "Due", variant: "warning" },
  paid: { label: "Paid", variant: "success" },
  partially_paid: { label: "Partially Paid", variant: "warning" },
  overdue: { label: "Overdue", variant: "destructive" },
  deferred: { label: "Deferred", variant: "secondary" },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status.replace(/_/g, " "),
    variant: "secondary",
  };

  const variantClasses: Record<string, string> = {
    default: "bg-primary/10 text-primary border-primary/20",
    secondary: "bg-muted text-muted-foreground",
    destructive: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        variantClasses[config.variant] || variantClasses.secondary,
        className
      )}
    >
      {config.label}
    </span>
  );
}
