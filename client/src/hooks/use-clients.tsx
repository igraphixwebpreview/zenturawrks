import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Client, InsertClient } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export const useClients = () => {
  return useQuery({
    queryKey: ["/api/clients"],
    queryFn: () => apiRequest({ url: "/api/clients", on401: "throw" }),
  });
};

export const useClient = (id: number) => {
  return useQuery({
    queryKey: ["/api/clients", id],
    queryFn: () => apiRequest({ url: `/api/clients/${id}`, on401: "throw" }),
    enabled: !!id,
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (client: InsertClient) => {
      return apiRequest({
        url: "/api/clients",
        method: "POST",
        body: client,
        on401: "throw",
      });
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
      return apiRequest({
        url: `/api/clients/${id}`,
        method: "PATCH",
        body: client,
        on401: "throw",
      });
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
      return apiRequest({
        url: `/api/clients/${id}`,
        method: "DELETE",
        on401: "throw",
      });
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