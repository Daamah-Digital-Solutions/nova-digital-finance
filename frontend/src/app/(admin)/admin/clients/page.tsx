"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api";
import { toast } from "sonner";

interface Client {
  id: number;
  full_name: string;
  email: string;
  client_id: string;
  kyc_status: string;
  active_financing_count: number;
  date_joined: string;
}

const kycStatusColors: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  approved: "success",
  pending: "warning",
  submitted: "warning",
  under_review: "secondary",
  rejected: "destructive",
  not_submitted: "default",
};

export default function AdminClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [kycFilter, setKycFilter] = useState("all");

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const params: Record<string, string> = {};
        if (search) params.search = search;
        if (kycFilter && kycFilter !== "all") params.kyc_status = kycFilter;

        const response = await api.get("/admin/clients/", { params });
        setClients(response.data.results || response.data);
      } catch (error) {
        toast.error("Failed to load clients.");
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, [search, kycFilter]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Client Management</h1>
        <p className="text-muted-foreground">
          View and manage all registered clients.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Clients
            </CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={kycFilter} onValueChange={setKycFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="KYC Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : clients.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No clients found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Client ID</TableHead>
                  <TableHead>KYC Status</TableHead>
                  <TableHead>Active Financing</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow
                    key={client.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/admin/clients/${client.id}`)}
                  >
                    <TableCell className="font-medium">
                      {client.full_name}
                    </TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {client.client_id}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={kycStatusColors[client.kyc_status] || "default"}
                      >
                        {client.kyc_status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{client.active_financing_count}</TableCell>
                    <TableCell>
                      {new Date(client.date_joined).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
