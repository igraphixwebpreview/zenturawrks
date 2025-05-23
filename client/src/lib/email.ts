export interface EmailTemplate {
  subject: string;
  body: string;
}

export interface InvoiceEmailData {
  client_name: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total_amount: string;
  company_name?: string;
}

export const replaceTemplateVariables = (
  template: string,
  data: InvoiceEmailData
): string => {
  return template.replace(/{(\w+)}/g, (match, key) => {
    return (data as any)[key] || match;
  });
};

export const generateEmailContent = (
  template: EmailTemplate,
  invoiceData: InvoiceEmailData
): EmailTemplate => {
  return {
    subject: replaceTemplateVariables(template.subject, invoiceData),
    body: replaceTemplateVariables(template.body, invoiceData),
  };
};

export const sendInvoiceEmail = async (
  to: string,
  subject: string,
  body: string,
  pdfData?: Blob
): Promise<boolean> => {
  // Simple email functionality without external services
  // This creates a mailto link that opens the user's default email client
  const emailBody = encodeURIComponent(body);
  const emailSubject = encodeURIComponent(subject);
  
  // Create mailto link
  const mailtoLink = `mailto:${to}?subject=${emailSubject}&body=${emailBody}`;
  
  // Open user's email client
  window.open(mailtoLink);
  
  // If there's a PDF, we'll download it so the user can manually attach it
  if (pdfData) {
    const url = URL.createObjectURL(pdfData);
    const link = document.createElement("a");
    link.href = url;
    link.download = "invoice.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  
  return true;
};
