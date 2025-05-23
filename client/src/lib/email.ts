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
  try {
    // Convert PDF blob to base64 if provided
    let pdfBase64 = undefined;
    if (pdfData) {
      const arrayBuffer = await pdfData.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      pdfBase64 = btoa(String.fromCharCode(...uint8Array));
    }

    // Send email via Python SMTP service
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-firebase-uid': 'demo-uid',
      },
      body: JSON.stringify({
        to_email: to,
        subject,
        body,
        pdf_data: pdfBase64,
      }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    const result = await response.json();
    
    // If SMTP is not configured, fall back to mailto
    if (result.instructions) {
      console.log('SMTP not configured, opening email client...');
      
      // Fallback to mailto link
      const emailBody = encodeURIComponent(body);
      const emailSubject = encodeURIComponent(subject);
      const mailtoLink = `mailto:${to}?subject=${emailSubject}&body=${emailBody}`;
      window.open(mailtoLink);
      
      // Download PDF for manual attachment
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
    }

    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    
    // Fallback to mailto on any error
    const emailBody = encodeURIComponent(body);
    const emailSubject = encodeURIComponent(subject);
    const mailtoLink = `mailto:${to}?subject=${emailSubject}&body=${emailBody}`;
    window.open(mailtoLink);
    
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
  }
};
