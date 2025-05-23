import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Download, Mail, Send } from "lucide-react";
import { useCreateInvoice, useSendInvoice } from "@/hooks/use-invoices";
import { useToast } from "@/hooks/use-toast";
import { generateInvoicePDF, downloadPDF } from "@/lib/pdf";
import { useLocation } from "wouter";

const invoiceItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  rate: z.number().min(0, "Rate must be positive"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  amount: z.number().min(0),
});

const invoiceSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Valid email is required"),
  clientPhone: z.string().optional(),
  companyName: z.string().optional(),
  addressLine1: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  invoiceType: z.enum(["quotation", "invoice_with_deposit", "final_invoice", "receipt", "balance_due_receipt", "contract_invoice"]),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  discount: z.number().min(0).max(100),
  vat: z.number().min(0).max(100),
  deposit: z.number().min(0),
  notes: z.string().optional(),
});

type InvoiceForm = z.infer<typeof invoiceSchema>;
type InvoiceItem = z.infer<typeof invoiceItemSchema>;

export function InvoiceForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createInvoice = useCreateInvoice();
  const sendInvoice = useSendInvoice();

  const form = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      companyName: "",
      addressLine1: "",
      city: "",
      country: "",
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      invoiceType: "final_invoice",
      items: [{ name: "", description: "", rate: 0, quantity: 1, amount: 0 }],
      discount: 0,
      vat: 0,
      deposit: 0,
      notes: "",
    },
  });

  const watchedItems = form.watch("items");
  const watchedDiscount = form.watch("discount");
  const watchedVat = form.watch("vat");

  // Calculate totals
  const subtotal = watchedItems.reduce((sum, item) => sum + (item.rate * item.quantity), 0);
  const discountAmount = (subtotal * watchedDiscount) / 100;
  const vatAmount = ((subtotal - discountAmount) * watchedVat) / 100;
  const total = subtotal - discountAmount + vatAmount;

  const addItem = () => {
    const currentItems = form.getValues("items");
    form.setValue("items", [...currentItems, { name: "", description: "", rate: 0, quantity: 1, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    const currentItems = form.getValues("items");
    if (currentItems.length > 1) {
      form.setValue("items", currentItems.filter((_, i) => i !== index));
    }
  };

  const updateItemAmount = (index: number) => {
    const items = form.getValues("items");
    const item = items[index];
    const amount = item.rate * item.quantity;
    form.setValue(`items.${index}.amount`, amount);
  };

  const onSubmit = async (data: InvoiceForm) => {
    try {
      const invoiceData = {
        ...data,
        invoiceDate: new Date(data.invoiceDate),
        dueDate: new Date(data.dueDate),
        subtotal: subtotal.toString(),
        total: total.toString(),
        createdBy: 1, // This would come from auth context
      };

      const invoice = await createInvoice.mutateAsync(invoiceData);
      
      toast({
        title: "Invoice created successfully",
        description: `Invoice ${invoice.invoiceNumber} has been created.`,
      });

      setLocation("/invoices");
    } catch (error: any) {
      toast({
        title: "Error creating invoice",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = async () => {
    const formData = form.getValues();
    const invoiceData = {
      id: 0,
      invoiceNumber: "PREVIEW",
      ...formData,
      invoiceDate: new Date(formData.invoiceDate),
      dueDate: new Date(formData.dueDate),
      subtotal: subtotal.toString(),
      total: total.toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 1,
      status: "draft",
      pdfUrl: null,
      sentAt: null,
    };

    const companyInfo = {
      companyName: "iGraphix Marketing & Co.",
      companyAddress: "123 Business Street\nBusiness City, BC 12345\nCountry",
    };

    try {
      const pdfBlob = await generateInvoicePDF(invoiceData, companyInfo);
      downloadPDF(pdfBlob, `invoice-preview.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Create New Invoice</h1>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name *</Label>
                <Input {...form.register("clientName")} />
                {form.formState.errors.clientName && (
                  <p className="text-sm text-destructive">{form.formState.errors.clientName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input {...form.register("companyName")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientEmail">Email Address *</Label>
                <Input type="email" {...form.register("clientEmail")} />
                {form.formState.errors.clientEmail && (
                  <p className="text-sm text-destructive">{form.formState.errors.clientEmail.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientPhone">Phone Number</Label>
                <Input {...form.register("clientPhone")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressLine1">Address *</Label>
                <Input {...form.register("addressLine1")} />
                {form.formState.errors.addressLine1 && (
                  <p className="text-sm text-destructive">{form.formState.errors.addressLine1.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input {...form.register("city")} />
                  {form.formState.errors.city && (
                    <p className="text-sm text-destructive">{form.formState.errors.city.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Input {...form.register("country")} />
                  {form.formState.errors.country && (
                    <p className="text-sm text-destructive">{form.formState.errors.country.message}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceType">Invoice Type *</Label>
                <Select onValueChange={(value) => form.setValue("invoiceType", value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quotation">Quotation</SelectItem>
                    <SelectItem value="invoice_with_deposit">Invoice with Deposit</SelectItem>
                    <SelectItem value="final_invoice">Final Invoice</SelectItem>
                    <SelectItem value="receipt">Receipt</SelectItem>
                    <SelectItem value="balance_due_receipt">Balance Due Receipt</SelectItem>
                    <SelectItem value="contract_invoice">Contract Invoice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoiceDate">Invoice Date *</Label>
                <Input type="date" {...form.register("invoiceDate")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input type="date" {...form.register("dueDate")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Invoice Items</CardTitle>
            <Button type="button" onClick={addItem} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {watchedItems.map((item, index) => (
                <div key={index} className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end border rounded-lg p-4 bg-muted/30">
                  <div className="lg:col-span-3 space-y-2">
                    <Label>Item Name</Label>
                    <Input 
                      {...form.register(`items.${index}.name`)}
                      placeholder="Item name"
                      className="w-full"
                    />
                  </div>
                  <div className="lg:col-span-4 space-y-2">
                    <Label>Description</Label>
                    <Textarea 
                      {...form.register(`items.${index}.description`)}
                      placeholder="Detailed description of the item or service"
                      className="min-h-[38px] resize-none"
                      rows={1}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = '38px';
                        target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                      }}
                    />
                  </div>
                  <div className="lg:col-span-2 space-y-2">
                    <Label>Rate</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      {...form.register(`items.${index}.rate`, { 
                        valueAsNumber: true,
                        onChange: () => updateItemAmount(index)
                      })}
                      placeholder="0.00"
                      className="w-full"
                    />
                  </div>
                  <div className="lg:col-span-1 space-y-2">
                    <Label>Qty</Label>
                    <Input 
                      type="number"
                      {...form.register(`items.${index}.quantity`, { 
                        valueAsNumber: true,
                        onChange: () => updateItemAmount(index)
                      })}
                      placeholder="1"
                      className="w-full min-w-[60px]"
                    />
                  </div>
                  <div className="lg:col-span-1 space-y-2">
                    <Label>Amount</Label>
                    <div className="text-sm font-medium py-2 px-3 bg-background rounded-md border min-h-[38px] flex items-center">
                      ${(item.rate * item.quantity).toFixed(2)}
                    </div>
                  </div>
                  <div className="lg:col-span-1 flex justify-end">
                    <Button
                      type="button"
                      onClick={() => removeItem(index)}
                      variant="outline"
                      size="sm"
                      disabled={watchedItems.length === 1}
                      className="h-9 w-9 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    {...form.register("discount", { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vat">VAT (%)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    {...form.register("vat", { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deposit">Required Deposit ($)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    {...form.register("deposit", { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea {...form.register("notes")} placeholder="Additional notes..." />
                </div>
              </div>

              <div className="space-y-3 bg-muted p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount:</span>
                  <span className="font-medium">-${discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT:</span>
                  <span className="font-medium">${vatAmount.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-lg font-bold">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                type="button" 
                onClick={handleDownloadPDF}
                variant="outline"
                className="flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Preview PDF
              </Button>
              <Button 
                type="submit" 
                disabled={createInvoice.isPending}
                className="flex items-center"
              >
                <Send className="h-4 w-4 mr-2" />
                {createInvoice.isPending ? "Creating..." : "Save Invoice"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
