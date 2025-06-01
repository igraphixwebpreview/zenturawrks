import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Client, InsertClient } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { setupAuthHeaders } from "@/lib/auth";

export const useClients = () => {
  return useQuery({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const headers = await setupAuthHeaders();
      const response = await fetch("/api/clients", {
        headers,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch clients");
      return response.json();
    },
  });
};

export const useClient = (id: number) => {
  return useQuery({
    queryKey: ["/api/clients", id],
    queryFn: async () => {
      const headers = await setupAuthHeaders();
      const response = await fetch(`/api/clients/${id}`, {
        headers,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch client");
      return response.json();
    },
    enabled: !!id,
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (client: InsertClient) => {
      const headers = await setupAuthHeaders();
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(client),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to create client");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Success",
        description: "Client created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create client",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, client }: { id: number; client: Partial<Client> }) => {
      const headers = await setupAuthHeaders();
      const response = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(client),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to update client");
      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients", id] });
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update client",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const headers = await setupAuthHeaders();
      const response = await fetch(`/api/clients/${id}`, {
        method: "DELETE",
        headers,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete client");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete client",
        variant: "destructive",
      });
    },
  });
};