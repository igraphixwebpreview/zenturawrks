import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Clock, Mail, AlertTriangle, DollarSign, Users } from "lucide-react";
import { format } from "date-fns";

interface OverdueInvoice {
  id: number;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  total: string;
  dueDate: string;
  daysOverdue: number;
  reminderType: 'gentle' | 'urgent' | 'final';
  status: string;
}

const getReminderBadgeVariant = (type: string) => {
  switch (type) {
    case 'gentle': return 'default';
    case 'urgent': return 'secondary';
    case 'final': return 'destructive';
    default: return 'default';
  }
};

const getReminderIcon = (type: string) => {
  switch (type) {
    case 'gentle': return Clock;
    case 'urgent': return AlertTriangle;
    case 'final': return AlertTriangle;
    default: return Clock;
  }
};

export function OverdueReminders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
  const [reminderType, setReminderType] = useState<string>("auto");

  // Fetch overdue invoices
  const { data: overdueData, isLoading } = useQuery({
    queryKey: ["/api/reminders/overdue"],
    queryFn: async () => {
      const response = await fetch("/api/reminders/overdue", {
        headers: { "x-firebase-uid": "demo-uid" },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch overdue invoices");
      return response.json();
    },
  });

  // Send reminders mutation
  const sendRemindersMutation = useMutation({
    mutationFn: async (data: { invoiceIds: number[]; reminderType: string }) => {
      const response = await fetch("/api/reminders/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-firebase-uid": "demo-uid",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to send reminders");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Reminders Sent!",
        description: data.message,
      });
      setSelectedInvoices([]);
      queryClient.invalidateQueries({ queryKey: ["/api/reminders/overdue"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Reminders",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSelectAll = () => {
    if (selectedInvoices.length === overdueData?.overdueInvoices?.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(overdueData?.overdueInvoices?.map((inv: OverdueInvoice) => inv.id) || []);
    }
  };

  const handleSelectInvoice = (invoiceId: number) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId)
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const handleSendReminders = () => {
    if (selectedInvoices.length === 0) {
      toast({
        title: "No Invoices Selected",
        description: "Please select at least one invoice to send reminders.",
        variant: "destructive",
      });
      return;
    }

    sendRemindersMutation.mutate({
      invoiceIds: selectedInvoices,
      reminderType: reminderType === "auto" ? "" : reminderType,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Overdue Invoices...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const overdueInvoices = overdueData?.overdueInvoices || [];
  const totalOverdueAmount = overdueData?.totalOverdueAmount || 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-full">
                <Clock className="h-4 w-4 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue Invoices</p>
                <p className="text-2xl font-bold">{overdueInvoices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-full">
                <DollarSign className="h-4 w-4 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Overdue</p>
                <p className="text-2xl font-bold">${totalOverdueAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-full">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unique Clients</p>
                <p className="text-2xl font-bold">
                  {new Set(overdueInvoices.map((inv: OverdueInvoice) => inv.clientName)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Reminders Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Automated Reminder Emails
          </CardTitle>
          <CardDescription>
            Send professional reminder emails to clients with overdue invoices automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {overdueInvoices.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No Overdue Invoices
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Great job! All your invoices are up to date.
              </p>
            </div>
          ) : (
            <>
              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={selectedInvoices.length === overdueInvoices.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm font-medium">
                    Select All ({selectedInvoices.length} of {overdueInvoices.length} selected)
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Select value={reminderType} onValueChange={setReminderType}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto (Smart)</SelectItem>
                      <SelectItem value="gentle">Gentle Reminder</SelectItem>
                      <SelectItem value="urgent">Urgent Notice</SelectItem>
                      <SelectItem value="final">Final Notice</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    onClick={handleSendReminders}
                    disabled={selectedInvoices.length === 0 || sendRemindersMutation.isPending}
                    className="min-w-32"
                  >
                    {sendRemindersMutation.isPending ? (
                      "Sending..."
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Reminders
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Overdue Invoices List */}
              <div className="space-y-2">
                {overdueInvoices.map((invoice: OverdueInvoice) => {
                  const ReminderIcon = getReminderIcon(invoice.reminderType);
                  
                  return (
                    <div key={invoice.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Checkbox
                            checked={selectedInvoices.includes(invoice.id)}
                            onCheckedChange={() => handleSelectInvoice(invoice.id)}
                          />
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{invoice.invoiceNumber}</span>
                              <Badge variant={getReminderBadgeVariant(invoice.reminderType)}>
                                <ReminderIcon className="w-3 h-3 mr-1" />
                                {invoice.reminderType}
                              </Badge>
                            </div>
                            
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              <p><strong>{invoice.clientName}</strong> • {invoice.clientEmail}</p>
                              <p>Due: {format(new Date(invoice.dueDate), "MMM dd, yyyy")} • 
                                 <span className="text-red-600 ml-1">
                                   {invoice.daysOverdue} days overdue
                                 </span>
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-semibold text-lg">${parseFloat(invoice.total).toFixed(2)}</p>
                          <Badge variant="outline" className="text-xs">
                            {invoice.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}