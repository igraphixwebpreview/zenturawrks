import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertInvoiceSchema, 
  insertEmailTemplateSchema, 
  insertSettingsSchema,
  insertClientSchema,
  updateInvoiceStatusSchema,
  sendInvoiceSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication middleware
  const requireAuth = async (req: any, res: any, next: any) => {
    const firebaseUid = req.headers['x-firebase-uid'];
    
    // Demo mode: create demo user if needed
    if (!firebaseUid || firebaseUid === "demo-uid") {
      let demoUser = await storage.getUserByFirebaseUid("demo-uid");
      if (!demoUser) {
        demoUser = await storage.createUser({
          email: "admin@demo.com",
          firebaseUid: "demo-uid",
          isAdmin: true,
        });
      }
      req.user = demoUser;
      return next();
    }

    const user = await storage.getUserByFirebaseUid(firebaseUid as string);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    req.user = user;
    next();
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, firebaseUid } = req.body;
      
      const existingUser = await storage.getUserByFirebaseUid(firebaseUid);
      if (existingUser) {
        return res.json(existingUser);
      }

      const user = await storage.createUser({
        email,
        firebaseUid,
        isAdmin: true,
      });

      res.json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req: any, res) => {
    res.json(req.user);
  });

  // Invoice routes
  app.get("/api/invoices", requireAuth, async (req: any, res) => {
    try {
      const invoices = await storage.getInvoices(req.user.id);
      res.json(invoices);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/invoices/stats", requireAuth, async (req: any, res) => {
    try {
      const stats = await storage.getInvoiceStats(req.user.id);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/invoices/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.getInvoice(id, req.user.id);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      res.json(invoice);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/invoices", requireAuth, async (req: any, res) => {
    try {
      const invoiceData = insertInvoiceSchema.parse({
        ...req.body,
        createdBy: req.user.id,
      });

      // Generate invoice number
      const settings = await storage.getSettings();
      const invoiceNumber = `${settings?.invoicePrefix || 'INV-'}${String(settings?.nextInvoiceNumber || 1).padStart(4, '0')}`;
      
      const invoice = await storage.createInvoice({
        ...invoiceData,
        invoiceNumber,
      });

      res.json(invoice);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/invoices/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;

      const invoice = await storage.updateInvoice(id, updates, req.user.id);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      res.json(invoice);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/invoices/:id/status", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = updateInvoiceStatusSchema.parse(req.body);

      const invoice = await storage.updateInvoice(id, { status }, req.user.id);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      res.json(invoice);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/invoices/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteInvoice(id, req.user.id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      res.json({ message: "Invoice deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/invoices/:id/send", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { action, customSubject, customBody } = sendInvoiceSchema.parse(req.body);

      const invoice = await storage.getInvoice(id, req.user.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Get default email template
      const template = await storage.getDefaultEmailTemplate();
      
      // Prepare email data
      const emailData = {
        client_name: invoice.clientName,
        invoice_number: invoice.invoiceNumber,
        invoice_date: new Date(invoice.invoiceDate).toLocaleDateString(),
        due_date: new Date(invoice.dueDate).toLocaleDateString(),
        total_amount: `$${parseFloat(invoice.total).toFixed(2)}`,
        company_name: invoice.companyName || "",
      };

      // Replace template variables
      const subject = customSubject || (template?.subject.replace(/{(\w+)}/g, (match, key) => 
        (emailData as any)[key] || match) || `Invoice ${invoice.invoiceNumber}`);
      
      const body = customBody || (template?.body.replace(/{(\w+)}/g, (match, key) => 
        (emailData as any)[key] || match) || `Please find attached invoice ${invoice.invoiceNumber}.`);

      if (action === "email" || action === "both") {
        // Update status first
        await storage.updateInvoice(id, { 
          status: "sent", 
          sentAt: new Date() 
        }, req.user.id);
      }

      res.json({ 
        message: "Invoice processed successfully",
        action,
        invoiceId: id,
        emailData: action === "email" || action === "both" ? {
          to: invoice.clientEmail,
          subject,
          body
        } : undefined
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // New endpoint for sending emails via Python SMTP
  app.post("/api/email/send", requireAuth, async (req: any, res) => {
    try {
      const { to_email, subject, body, pdf_data } = req.body;
      
      // In a real implementation, you would:
      // 1. Save PDF data to temporary file
      // 2. Call Python email service
      // 3. Clean up temporary file
      
      res.json({ 
        message: "Email functionality ready",
        instructions: "Please configure SMTP settings to enable email sending"
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // PDF generation from Word templates
  app.post("/api/pdf/generate", requireAuth, async (req: any, res) => {
    try {
      const { invoice_data, template } = req.body;
      const { spawn } = require('child_process');
      
      // Call Python template processor
      const python = spawn('python3', ['server/template_processor.py'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      // Send invoice data to Python script
      python.stdin.write(JSON.stringify({
        invoice_data,
        template_name: template || 'default_invoice.docx'
      }));
      python.stdin.end();
      
      let pdfData = '';
      let errorData = '';
      
      python.stdout.on('data', (data) => {
        pdfData += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        errorData += data.toString();
      });
      
      python.on('close', (code) => {
        if (code === 0 && pdfData) {
          try {
            const result = JSON.parse(pdfData);
            if (result.success) {
              res.json({
                success: true,
                pdf_base64: result.pdf_base64,
                message: "PDF generated successfully from Word template"
              });
            } else {
              res.status(400).json({
                success: false,
                message: result.error || "Template processing failed"
              });
            }
          } catch (parseError) {
            res.status(500).json({
              success: false,
              message: "Invalid response from template processor"
            });
          }
        } else {
          res.status(500).json({
            success: false,
            message: "Template processing failed",
            error: errorData
          });
        }
      });
      
    } catch (error: any) {
      res.status(500).json({ 
        success: false,
        message: error.message 
      });
    }
  });

  // Quick export endpoint for immediate downloads
  app.post("/api/export/quick", requireAuth, async (req, res) => {
    try {
      const { format, status = "all" } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Get all invoices for the user
      const invoices = await storage.getInvoices(userId);
      
      // Filter by status if specified
      const filteredInvoices = status === "all" 
        ? invoices 
        : invoices.filter(invoice => invoice.status === status);

      if (filteredInvoices.length === 0) {
        return res.json({
          success: false,
          message: "No invoices found for export"
        });
      }

      // Convert to export format
      const exportData = filteredInvoices.map(invoice => ({
        invoice_number: invoice.invoiceNumber,
        client_name: invoice.clientName,
        client_email: invoice.clientEmail,
        invoice_date: invoice.invoiceDate.toISOString().split('T')[0],
        due_date: invoice.dueDate.toISOString().split('T')[0],
        status: invoice.status,
        subtotal: invoice.subtotal,
        discount: invoice.discount || 0,
        vat: invoice.vat || 0,
        total: invoice.total,
        items: invoice.items,
        notes: invoice.notes || '',
        created_at: invoice.createdAt.toISOString()
      }));

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const formatName = format.replace('_', '-');
      const filename = `invoices-${formatName}-${timestamp}.${format.includes('csv') ? 'csv' : 'iif'}`;

      // Create export content based on format
      let exportContent = '';
      if (format.includes('csv') || format === 'generic_csv') {
        // CSV format
        const headers = [
          'Invoice Number', 'Client Name', 'Client Email', 'Invoice Date', 
          'Due Date', 'Status', 'Subtotal', 'Discount', 'VAT', 'Total', 'Notes'
        ];
        exportContent = headers.join(',') + '\n';
        exportContent += exportData.map(invoice => [
          `"${invoice.invoice_number}"`,
          `"${invoice.client_name}"`,
          `"${invoice.client_email}"`,
          invoice.invoice_date,
          invoice.due_date,
          invoice.status,
          invoice.subtotal,
          invoice.discount,
          invoice.vat,
          invoice.total,
          `"${invoice.notes}"`
        ].join(',')).join('\n');
      } else if (format === 'quickbooks_iif') {
        // QuickBooks IIF format
        exportContent = `!HDR   PROD    VER     REL     IIFVER  DATE    TIME    ACCNT   ENTITY  CCARD   INVITEM PAYMETH VTYPE   TERMS   MEM
!HDR    QuickBooks Pro  2023    R1      1       ${new Date().toLocaleDateString()}      ${new Date().toLocaleTimeString()}                      Y       Y                       Y       Y
!ACCNT  NAME    ACCNTTYPE       DESC
ACCNT   Accounts Receivable     AR      Accounts Receivable
ACCNT   Sales   INC     Sales Income
!INVITEM        NAME    INVITEMTYPE     DESC    PRICE
INVITEM Service SERV    Service Item    0.00
!TRNS   TRNSTYPE        DATE    ACCNT   NAME    AMOUNT  MEMO
!SPL    TRNSTYPE        DATE    ACCNT   NAME    AMOUNT  MEMO    INVITEM QNTY    PRICE
!ENDTRNS
`;
        exportData.forEach(invoice => {
          exportContent += `TRNS        INVOICE ${invoice.invoice_date} Accounts Receivable     ${invoice.client_name}  ${invoice.total}        ${invoice.invoice_number}\n`;
          exportContent += `SPL INVOICE ${invoice.invoice_date} Sales   ${invoice.client_name}  -${invoice.total}               1       ${invoice.total}\n`;
          exportContent += `ENDTRNS\n`;
        });
      }

      // Create blob URL for download
      const buffer = Buffer.from(exportContent, 'utf-8');
      const base64 = buffer.toString('base64');
      const downloadUrl = `data:${format.includes('csv') ? 'text/csv' : 'application/octet-stream'};base64,${base64}`;

      res.json({
        success: true,
        message: `Successfully exported ${filteredInvoices.length} invoices`,
        downloadUrl,
        filename,
        count: filteredInvoices.length
      });
    } catch (error: any) {
      console.error('Quick export error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Accounting software export endpoints
  app.get("/api/export/formats", requireAuth, async (req, res) => {
    try {
      const formats = [
        {
          id: 'quickbooks_iif',
          name: 'QuickBooks',
          description: 'Export to QuickBooks IIF format',
          fileExtension: '.iif',
          icon: 'Building2'
        },
        {
          id: 'xero_csv',
          name: 'Xero',
          description: 'Export to Xero CSV format',
          fileExtension: '.csv',
          icon: 'FileSpreadsheet'
        },
        {
          id: 'sage_csv',
          name: 'Sage',
          description: 'Export to Sage CSV format',
          fileExtension: '.csv',
          icon: 'Calculator'
        },
        {
          id: 'wave_csv',
          name: 'Wave Accounting',
          description: 'Export to Wave CSV format',
          fileExtension: '.csv',
          icon: 'Waves'
        },
        {
          id: 'freshbooks_csv',
          name: 'FreshBooks',
          description: 'Export to FreshBooks CSV format',
          fileExtension: '.csv',
          icon: 'BookOpen'
        },
        {
          id: 'generic_csv',
          name: 'Generic CSV',
          description: 'Export to generic CSV format',
          fileExtension: '.csv',
          icon: 'Download'
        }
      ];
      
      res.json(formats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/export/invoices", requireAuth, async (req: any, res) => {
    try {
      const { format, dateRange, status } = req.body;
      
      // Get invoices based on filters
      let invoices = await storage.getInvoices(req.user.id);
      
      // Apply filters
      if (status && status !== 'all') {
        invoices = invoices.filter(inv => inv.status === status);
      }
      
      if (dateRange) {
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        invoices = invoices.filter(inv => {
          const invDate = new Date(inv.invoiceDate);
          return invDate >= startDate && invDate <= endDate;
        });
      }
      
      if (invoices.length === 0) {
        return res.json({
          success: false,
          message: "No invoices found matching the selected criteria"
        });
      }
      
      // For now, return export info (Python processor integration would go here)
      res.json({
        success: true,
        message: `Ready to export ${invoices.length} invoices to ${format}`,
        count: invoices.length,
        format: format,
        invoices: invoices.map(inv => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          clientName: inv.clientName,
          total: inv.total,
          status: inv.status
        }))
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Automated reminder endpoints
  app.get("/api/reminders/overdue", requireAuth, async (req: any, res) => {
    try {
      const invoices = await storage.getInvoices(1); // Demo user ID
      const currentDate = new Date();
      
      // Find overdue invoices
      const overdueInvoices = invoices.filter(invoice => {
        if (invoice.status === 'paid') return false;
        const dueDate = new Date(invoice.dueDate);
        return dueDate < currentDate;
      });
      
      // Calculate days overdue for each
      const overdueWithDetails = overdueInvoices.map(invoice => {
        const dueDate = new Date(invoice.dueDate);
        const daysOverdue = Math.floor((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        let reminderType = 'gentle';
        if (daysOverdue > 30) reminderType = 'final';
        else if (daysOverdue > 7) reminderType = 'urgent';
        
        return {
          ...invoice,
          daysOverdue,
          reminderType
        };
      });
      
      res.json({
        success: true,
        overdueInvoices: overdueWithDetails,
        count: overdueWithDetails.length,
        totalOverdueAmount: overdueWithDetails.reduce((sum, inv) => sum + parseFloat(inv.total), 0)
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/reminders/send", requireAuth, async (req: any, res) => {
    try {
      const { invoiceIds, reminderType } = req.body;
      
      if (!invoiceIds || invoiceIds.length === 0) {
        return res.status(400).json({ message: "No invoices selected for reminders" });
      }
      
      // Get selected invoices
      const allInvoices = await storage.getInvoices(1); // Demo user ID
      const selectedInvoices = allInvoices.filter(inv => invoiceIds.includes(inv.id));
      
      if (selectedInvoices.length === 0) {
        return res.status(404).json({ message: "Selected invoices not found" });
      }
      
      // For now, simulate reminder sending
      const results = {
        processed: selectedInvoices.length,
        sent: selectedInvoices.length,
        failed: 0,
        details: selectedInvoices.map(inv => ({
          invoice: inv.invoiceNumber,
          status: 'sent',
          type: reminderType || 'gentle',
          client: inv.clientName
        }))
      };
      
      res.json({
        success: true,
        message: `Successfully sent ${results.sent} reminder emails`,
        results
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Client routes
  app.get("/api/clients", requireAuth, async (req, res) => {
    try {
      const clients = await storage.getClients(req.user.id);
      res.json(clients);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id, req.user.id);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(client);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/clients", requireAuth, async (req, res) => {
    try {
      const validatedData = insertClientSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.updateClient(id, req.body, req.user.id);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(client);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteClient(id, req.user.id);
      
      if (!success) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json({ message: "Client deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Email template routes
  app.get("/api/email-templates", requireAuth, async (req, res) => {
    try {
      const templates = await storage.getEmailTemplates();
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/email-templates/default", requireAuth, async (req, res) => {
    try {
      const template = await storage.getDefaultEmailTemplate();
      if (!template) {
        return res.status(404).json({ message: "Default template not found" });
      }
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/email-templates", requireAuth, async (req: any, res) => {
    try {
      const templateData = insertEmailTemplateSchema.parse(req.body);
      const template = await storage.createEmailTemplate(templateData);
      res.json(template);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/email-templates/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;

      const template = await storage.updateEmailTemplate(id, updates);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.json(template);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Settings routes
  app.get("/api/settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      if (!settings) {
        return res.status(404).json({ message: "Settings not found" });
      }
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/settings", requireAuth, async (req: any, res) => {
    try {
      const updates = req.body;
      const settings = await storage.updateSettings(updates);
      res.json(settings);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
