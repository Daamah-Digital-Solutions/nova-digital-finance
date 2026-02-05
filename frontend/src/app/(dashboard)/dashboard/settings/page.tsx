"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { User as UserType } from "@/types";
import { toast } from "sonner";
import {
  Loader2,
  User,
  Shield,
  Info,
  Save,
  Key,
  Smartphone,
  Eye,
  EyeOff,
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  client_id: string;
  account_number: string;
  mfa_enabled: boolean;
}

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [togglingMFA, setTogglingMFA] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Profile form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateField, setStateField] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setLoading(true);
      const res = await api.get("/users/me/");
      const data = res.data;
      const profile = data.profile || {};
      setProfile({
        ...data,
        phone: profile.phone || "",
        address_line_1: profile.address_line_1 || "",
        address_line_2: profile.address_line_2 || "",
        city: profile.city || "",
        state: profile.state || "",
        postal_code: profile.postal_code || "",
        country: profile.country || "",
      });
      setFirstName(data.first_name || "");
      setLastName(data.last_name || "");
      setPhone(profile.phone || "");
      setAddressLine1(profile.address_line_1 || "");
      setAddressLine2(profile.address_line_2 || "");
      setCity(profile.city || "");
      setStateField(profile.state || "");
      setPostalCode(profile.postal_code || "");
    } catch (error: any) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    try {
      setSavingProfile(true);
      const res = await api.patch("/users/me/", {
        first_name: firstName,
        last_name: lastName,
        profile: {
          phone,
          address_line_1: addressLine1,
          address_line_2: addressLine2,
          city,
          state: stateField,
          postal_code: postalCode,
        },
      });
      setProfile(res.data);
      if (setUser) {
        setUser({ ...user, first_name: firstName, last_name: lastName } as UserType);
      }
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }
    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      setChangingPassword(true);
      await api.post("/auth/password/change/", {
        old_password: currentPassword,
        new_password: newPassword,
      });
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleToggleMFA() {
    if (!profile) return;

    try {
      setTogglingMFA(true);
      if (profile.mfa_enabled) {
        await api.post("/auth/mfa/disable/");
        setProfile({ ...profile, mfa_enabled: false });
        toast.success("MFA has been disabled");
      } else {
        await api.post("/auth/mfa/enable/");
        setProfile({ ...profile, mfa_enabled: true });
        toast.success("MFA has been enabled. Please set up your authenticator app.");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to toggle MFA");
    } finally {
      setTogglingMFA(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      {/* Account Info (Read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>Your account details (read-only)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Client ID</Label>
              <div className="rounded-md border bg-muted/50 px-3 py-2 font-mono text-sm">
                {profile?.client_id || "---"}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Account Number</Label>
              <div className="rounded-md border bg-muted/50 px-3 py-2 font-mono text-sm">
                {profile?.account_number || "---"}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Email</Label>
              <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
                {profile?.email || "---"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="settings-first-name">First Name</Label>
              <Input
                id="settings-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-last-name">Last Name</Label>
              <Input
                id="settings-last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-phone">Phone Number</Label>
            <Input
              id="settings-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+971 50 123 4567"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="settings-address1">Address Line 1</Label>
            <Input
              id="settings-address1"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="Street address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-address2">Address Line 2</Label>
            <Input
              id="settings-address2"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              placeholder="Apartment, suite, etc. (optional)"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="settings-city">City</Label>
              <Input
                id="settings-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-state">State / Emirate</Label>
              <Input
                id="settings-state"
                value={stateField}
                onChange={(e) => setStateField(e.target.value)}
                placeholder="State"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-postal">Postal Code</Label>
              <Input
                id="settings-postal"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="Postal code"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>Manage your password and security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Change Password */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Change Password</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-sm text-destructive">Passwords do not match</p>
            )}

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={handleChangePassword}
                disabled={changingPassword}
              >
                {changingPassword ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Key className="mr-2 h-4 w-4" />
                )}
                Change Password
              </Button>
            </div>
          </div>

          <Separator />

          {/* MFA Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="font-medium">Two-Factor Authentication (MFA)</h3>
                <p className="text-sm text-muted-foreground">
                  {profile?.mfa_enabled
                    ? "MFA is currently enabled on your account"
                    : "Add an extra layer of security to your account"}
                </p>
              </div>
            </div>
            <Switch
              checked={profile?.mfa_enabled || false}
              onCheckedChange={handleToggleMFA}
              disabled={togglingMFA}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
