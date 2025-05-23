import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Invoice, InsertInvoice } from "@shared/schema";
import { setupAuthHeaders } from "@/lib/auth";

export const useInvoices = () => {
  return useQuery({
    queryKey: ["/api/invoices"],
    queryFn: async () => {
      const headers = await setupAuthHeaders();
      const response = await fetch("/api/invoices", {
        headers,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch invoices");
      return response.json() as Promise<Invoice[]>;
    },
  });
};

export const useInvoiceStats = () => {
  return useQuery({
    queryKey: ["/api/invoices/stats"],
    queryFn: async () => {
      const headers = await setupAuthHeaders();
      const response = await fetch("/api/invoices/stats", {
        headers,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json() as Promise<{
        totalInvoices: number;
        totalIncome: number;
        outstanding: number;
        deposited: number;
      }>;
    },
  });
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoice: InsertInvoice) => {
      const headers = await setupAuthHeaders();
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoice),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to create invoice");
      return response.json() as Promise<Invoice>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices/stats"] });
    },
  });
};

export const useUpdateInvoiceStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const headers = await setupAuthHeaders();
      const response = await fetch(`/api/invoices/${id}/status`, {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to update invoice status");
      return response.json() as Promise<Invoice>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices/stats"] });
    },
  });
};

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const headers = await setupAuthHeaders();
      const response = await fetch(`/api/invoices/${id}`, {
        method: "DELETE",
        headers,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete invoice");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices/stats"] });
    },
  });
};

export const useSendInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      action, 
      customSubject, 
      customBody 
    }: { 
      id: number; 
      action: "download" | "email" | "both";
      customSubject?: string;
      customBody?: string;
    }) => {
      const headers = await setupAuthHeaders();
      const response = await fetch(`/api/invoices/${id}/send`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, customSubject, customBody }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to send invoice");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices/stats"] });
    },
  });
};
