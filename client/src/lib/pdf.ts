import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Invoice } from "@shared/schema";

export interface InvoiceItem {
  name: string;
  description?: string;
  rate: number;
  quantity: number;
  amount: number;
}

export const generateInvoicePDF = async (invoice: Invoice, companyInfo?: any): Promise<Blob> => {
  try {
    // Prepare invoice data for Word template processing
    const invoiceData = {
      // Company information
      companyName: companyInfo?.companyName || "Your Company",
      companyAddress: companyInfo?.companyAddress || "123 Business St, City, State 12345",
      companyPhone: companyInfo?.companyPhone || "(555) 123-4567", 
      companyEmail: companyInfo?.companyEmail || "info@company.com",
      companyWebsite: companyInfo?.companyWebsite || "",
      
      // Invoice details
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: new Date(invoice.invoiceDate).toLocaleDateString(),
      dueDate: new Date(invoice.dueDate).toLocaleDateString(),
      status: invoice.status,
      
      // Client information
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail,
      clientAddress: `${invoice.addressLine1}\n${invoice.city}, ${invoice.country}`,
      clientPhone: invoice.clientPhone || "",
      
      // Financial information
      subtotal: invoice.subtotal,
      discount: invoice.discount || "0",
      vat: invoice.vat || "0", 
      deposit: invoice.deposit || "0",
      total: invoice.total,
      
      // Items
      items: invoice.items as InvoiceItem[],
      
      // Additional fields
      notes: invoice.notes || "",
      paymentTerms: "Net 30 days"
    };

    // Call the Python template processor
    const response = await fetch('/api/pdf/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-firebase-uid': 'demo-uid',
      },
      body: JSON.stringify({
        invoice_data: invoiceData,
        template: 'default_invoice.docx'
      }),
      credentials: 'include',
    });

    if (response.ok) {
      const result = await response.json();
      
      if (result.success) {
        // Convert base64 PDF back to blob
        const binaryString = atob(result.pdf_base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        return new Blob([bytes], { type: 'application/pdf' });
      }
    }
    
    // Fall through to existing PDF generation if template processing fails
    console.log('Using fallback PDF generation...');
  } catch (error) {
    console.log('Template processing not available, using built-in PDF generation...');
  }

  // Existing PDF generation code as fallback
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(companyInfo.companyName || "iGraphix Marketing & Co.", 20, 30);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(companyInfo.companyAddress || "123 Business Street\nBusiness City, BC 12345\nCountry", 20, 40);
  
  // Invoice title and number
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", pageWidth - 20, 30, { align: "right" });
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, pageWidth - 20, 45, { align: "right" });
  doc.text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`, pageWidth - 20, 55, { align: "right" });
  doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, pageWidth - 20, 65, { align: "right" });
  
  // Bill To section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 20, 85);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  let billToY = 95;
  doc.text(invoice.clientName, 20, billToY);
  if (invoice.companyName) {
    billToY += 10;
    doc.text(invoice.companyName, 20, billToY);
  }
  billToY += 10;
  doc.text(invoice.addressLine1, 20, billToY);
  billToY += 10;
  doc.text(`${invoice.city}, ${invoice.country}`, 20, billToY);
  if (invoice.clientEmail) {
    billToY += 10;
    doc.text(invoice.clientEmail, 20, billToY);
  }
  if (invoice.clientPhone) {
    billToY += 10;
    doc.text(invoice.clientPhone, 20, billToY);
  }
  
  // Items table
  const items = invoice.items as InvoiceItem[];
  const tableData = items.map(item => [
    item.name,
    item.description || "",
    `$${item.rate.toFixed(2)}`,
    item.quantity.toString(),
    `$${item.amount.toFixed(2)}`
  ]);
  
  autoTable(doc, {
    startY: billToY + 20,
    head: [["Item", "Description", "Rate", "Qty", "Amount"]],
    body: tableData,
    theme: "grid",
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: "bold",
    },
  });
  
  // Summary section
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  const summaryX = pageWidth - 80;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  let summaryY = finalY;
  doc.text("Subtotal:", summaryX, summaryY);
  doc.text(`$${invoice.subtotal}`, summaryX + 50, summaryY, { align: "right" });
  
  if (parseFloat(invoice.discount) > 0) {
    summaryY += 10;
    doc.text(`Discount (${invoice.discount}%):`, summaryX, summaryY);
    const discountAmount = (parseFloat(invoice.subtotal) * parseFloat(invoice.discount)) / 100;
    doc.text(`-$${discountAmount.toFixed(2)}`, summaryX + 50, summaryY, { align: "right" });
  }
  
  if (parseFloat(invoice.vat) > 0) {
    summaryY += 10;
    doc.text(`VAT (${invoice.vat}%):`, summaryX, summaryY);
    const vatAmount = (parseFloat(invoice.subtotal) * parseFloat(invoice.vat)) / 100;
    doc.text(`$${vatAmount.toFixed(2)}`, summaryX + 50, summaryY, { align: "right" });
  }
  
  if (parseFloat(invoice.deposit) > 0) {
    summaryY += 10;
    doc.text("Deposit Required:", summaryX, summaryY);
    doc.text(`$${invoice.deposit}`, summaryX + 50, summaryY, { align: "right" });
  }
  
  // Total
  summaryY += 15;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Total:", summaryX, summaryY);
  doc.text(`$${invoice.total}`, summaryX + 50, summaryY, { align: "right" });
  
  // Footer
  if (invoice.notes) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Notes:", 20, summaryY + 20);
    doc.text(invoice.notes, 20, summaryY + 30);
  }
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("Thank you for your business!", pageWidth / 2, doc.internal.pageSize.height - 20, { align: "center" });
  
  return doc.output("blob");
};

export const downloadPDF = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const previewPDF = (blob: Blob): void => {
  const url = URL.createObjectURL(blob);
  // Open PDF in new tab for preview
  const newWindow = window.open(url, '_blank');
  if (!newWindow) {
    // Fallback: download if popup blocked
    const link = document.createElement("a");
    link.href = url;
    link.download = "invoice-preview.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  // Clean up URL after a delay
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
