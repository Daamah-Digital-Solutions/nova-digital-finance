"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, fetchUser } = useAuthStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

      if (!token) {
        setShouldRedirect(true);
        setAuthChecked(true);
        return;
      }

      // Only fetch if we don't have user data
      if (!user) {
        try {
          await fetchUser();
        } catch (error) {
          console.error("Auth check failed:", error);
          setShouldRedirect(true);
        }
      }
      setAuthChecked(true);
    };

    checkAuth();
  }, []);

  // Handle redirect after auth check is complete
  useEffect(() => {
    if (authChecked && shouldRedirect) {
      router.replace("/login");
    }
  }, [authChecked, shouldRedirect, router]);

  // Also redirect if user fetch completed but user is not authenticated
  useEffect(() => {
    if (authChecked && !isLoading && !isAuthenticated && !shouldRedirect) {
      // Double check token exists - if not, redirect
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.replace("/login");
      }
    }
  }, [authChecked, isLoading, isAuthenticated, shouldRedirect, router]);

  if (!authChecked || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (shouldRedirect || !isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "transition-transform duration-300"
        )}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setMobileOpen(!mobileOpen)} />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
