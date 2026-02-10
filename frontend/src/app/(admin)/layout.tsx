"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  FileCheck,
  MessageSquare,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Menu,
  LogOut,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/applications", label: "Applications", icon: FileText },
  { href: "/admin/kyc", label: "KYC Reviews", icon: FileCheck },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/requests", label: "Requests", icon: MessageSquare },
  { href: "/admin/content", label: "Content", icon: BookOpen },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-sidebar transition-all duration-300 lg:relative lg:z-auto",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/admin" className={collapsed ? "mx-auto block" : ""}>
            <Image
              src="/logo.png"
              alt="Nova Digital Finance"
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
            />
          </Link>
          {!collapsed && (
            <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:block">
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          {collapsed && (
            <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:block">
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-1 p-2">
          {adminLinks.map((link) => {
            const isActive = pathname === link.href ||
              (link.href !== "/admin" && pathname.startsWith(link.href));
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
              >
                <link.icon className={cn("h-4 w-4", !collapsed && "mr-3")} />
                {!collapsed && link.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-2">
          <Link
            href="/dashboard"
            className="flex items-center rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
          >
            <Settings className={cn("h-4 w-4", !collapsed && "mr-3")} />
            {!collapsed && "Client View"}
          </Link>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setMobileOpen(!mobileOpen)} />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
