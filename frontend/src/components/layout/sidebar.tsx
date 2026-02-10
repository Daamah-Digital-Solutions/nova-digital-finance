"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileCheck,
  Wallet,
  CreditCard,
  FileText,
  PenTool,
  MessageSquare,
  Settings,
  ExternalLink,
  LogOut,
  Bell,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const sidebarLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/kyc", label: "KYC Verification", icon: FileCheck },
  { href: "/dashboard/financing", label: "Financing", icon: Wallet },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/documents", label: "Documents", icon: FileText },
  { href: "/dashboard/signatures", label: "Signatures", icon: PenTool },
  { href: "/dashboard/requests", label: "Requests", icon: MessageSquare },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link href="/dashboard" className={collapsed ? "mx-auto block" : ""}>
          <Image
            src="/logo.png"
            alt="Nova Digital Finance"
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
          />
        </Link>
        <button onClick={onToggle} className="hidden lg:block">
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {sidebarLinks.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== "/dashboard" && pathname.startsWith(link.href));

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              title={collapsed ? link.label : undefined}
            >
              <link.icon className={cn("h-4 w-4", !collapsed && "mr-3")} />
              {!collapsed && link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-2">
        <Link
          href={process.env.NEXT_PUBLIC_CAPIMAX_URL || "https://panel.capimaxinvestment.com/"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          title={collapsed ? "CapiMax Investment" : undefined}
        >
          <ExternalLink className={cn("h-4 w-4", !collapsed && "mr-3")} />
          {!collapsed && "CapiMax Investment"}
        </Link>
      </div>
    </aside>
  );
}
