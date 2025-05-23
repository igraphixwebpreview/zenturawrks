import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Invoice } from "@shared/schema";

interface InvoicePreviewProps {
  invoice: Invoice;
}

const statusColors = {
  paid: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  pending: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
  partial: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
};

export function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const items = invoice.items as Array<{
    name: string;
    description?: string;
    rate: number;
    quantity: number;
    amount: number;
  }>;

  const subtotal = parseFloat(invoice.subtotal);
  const discount = parseFloat(invoice.discount);
  const vat = parseFloat(invoice.vat);
  const total = parseFloat(invoice.total);

  const discountAmount = (subtotal * discount) / 100;
  const vatAmount = ((subtotal - discountAmount) * vat) / 100;

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">iGraphix Marketing & Co.</h1>
            <div className="text-sm text-muted-foreground mt-2">
              <p>123 Business Street</p>
              <p>Business City, BC 12345</p>
              <p>Country</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-bold text-foreground">INVOICE</h2>
            <div className="mt-4 space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <Badge 
                  className={statusColors[invoice.status as keyof typeof statusColors]}
                  variant="secondary"
                >
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </Badge>
              </div>
              <p><span className="font-medium">Invoice #:</span> {invoice.invoiceNumber}</p>
              <p><span className="font-medium">Date:</span> {new Date(invoice.invoiceDate).toLocaleDateString()}</p>
              <p><span className="font-medium">Due Date:</span> {new Date(invoice.dueDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Bill To */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Bill To:</h3>
          <div className="text-sm">
            <p className="font-medium">{invoice.clientName}</p>
            {invoice.companyName && <p>{invoice.companyName}</p>}
            <p>{invoice.addressLine1}</p>
            <p>{invoice.city}, {invoice.country}</p>
            {invoice.clientEmail && <p>{invoice.clientEmail}</p>}
            {invoice.clientPhone && <p>{invoice.clientPhone}</p>}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Items Table */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full border border-border rounded-lg">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Item</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Description</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Rate</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Qty</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{item.description || "-"}</td>
                    <td className="px-4 py-3 text-sm text-right text-foreground">${item.rate.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right text-foreground">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-foreground">${item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="flex justify-end">
          <div className="w-full max-w-sm space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount ({discount}%):</span>
                <span className="font-medium">-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            {vat > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT ({vat}%):</span>
                <span className="font-medium">${vatAmount.toFixed(2)}</span>
              </div>
            )}
            {parseFloat(invoice.deposit) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deposit Required:</span>
                <span className="font-medium">${parseFloat(invoice.deposit).toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Notes</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-8">
          <p className="text-sm text-muted-foreground italic">Thank you for your business!</p>
        </div>
      </CardContent>
    </Card>
  );
}
