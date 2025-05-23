import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertInvoiceSchema, 
  insertEmailTemplateSchema, 
  insertSettingsSchema,
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
