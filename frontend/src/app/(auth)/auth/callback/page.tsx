"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api";
import { toast } from "sonner";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const accessToken = searchParams.get("access");
      const refreshToken = searchParams.get("refresh");
      const errorParam = searchParams.get("error");

      if (errorParam) {
        setError("Authentication failed. Please try again.");
        toast.error("Google sign-in failed");
        setTimeout(() => router.push("/login"), 2000);
        return;
      }

      if (!accessToken) {
        setError("No access token received.");
        toast.error("Authentication error");
        setTimeout(() => router.push("/login"), 2000);
        return;
      }

      // Store tokens
      localStorage.setItem("access_token", accessToken);
      if (refreshToken) {
        localStorage.setItem("refresh_token", refreshToken);
      }

      // Fetch user data
      try {
        const userResponse = await api.get("/users/me/");
        setUser(userResponse.data);
        toast.success("Welcome!");
        router.push("/dashboard");
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setError("Failed to complete authentication.");
        toast.error("Authentication error");
        setTimeout(() => router.push("/login"), 2000);
      }
    };

    handleCallback();
  }, [searchParams, router, setUser]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        {error ? (
          <div className="space-y-4">
            <p className="text-destructive">{error}</p>
            <p className="text-sm text-muted-foreground">Redirecting to login...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Completing sign-in...</p>
          </div>
        )}
      </div>
    </div>
  );
}
