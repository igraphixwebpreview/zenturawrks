import { 
  users, 
  invoices, 
  emailTemplates, 
  settings,
  clients,
  type User, 
  type InsertUser,
  type Invoice,
  type InsertInvoice,
  type EmailTemplate,
  type InsertEmailTemplate,
  type Settings,
  type InsertSettings,
  type Client,
  type InsertClient
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Invoice operations
  getInvoices(userId: number): Promise<Invoice[]>;
  getInvoice(id: number, userId: number): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<Invoice>, userId: number): Promise<Invoice | undefined>;
  deleteInvoice(id: number, userId: number): Promise<boolean>;
  getInvoiceStats(userId: number): Promise<{
    totalInvoices: number;
    totalIncome: number;
    outstanding: number;
    deposited: number;
  }>;
  
  // Client operations
  getClients(userId: number): Promise<Client[]>;
  getClient(id: number, userId: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<Client>, userId: number): Promise<Client | undefined>;
  deleteClient(id: number, userId: number): Promise<boolean>;
  
  // Email template operations
  getEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplate(id: number): Promise<EmailTemplate | undefined>;
  getDefaultEmailTemplate(): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: number, template: Partial<EmailTemplate>): Promise<EmailTemplate | undefined>;
  
  // Settings operations
  getSettings(): Promise<Settings | undefined>;
  updateSettings(settings: Partial<Settings>): Promise<Settings>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private invoices: Map<number, Invoice>;
  private emailTemplates: Map<number, EmailTemplate>;
  private clients: Map<number, Client>;
  private settings: Settings | undefined;
  private currentUserId: number;
  private currentInvoiceId: number;
  private currentTemplateId: number;
  private currentClientId: number;

  constructor() {
    this.users = new Map();
    this.invoices = new Map();
    this.emailTemplates = new Map();
    this.clients = new Map();
    this.currentUserId = 1;
    this.currentInvoiceId = 1;
    this.currentTemplateId = 1;
    this.currentClientId = 1;
    
    // Create demo user account
    const demoUser: User = {
      id: 1,
      email: "demo@invoicegen.com",
      firebaseUid: "demo-uid",
      isAdmin: true,
      createdAt: new Date(),
    };
    this.users.set(1, demoUser);
    this.currentUserId = 2;
    
    // Initialize default settings
    this.settings = {
      id: 1,
      companyName: "iGraphix Marketing & Co.",
      companyAddress: "123 Business Street\nBusiness City, BC 12345\nCountry",
      companyPhone: "+1 (555) 123-4567",
      companyEmail: "info@igraphix.com",
      invoicePrefix: "INV-",
      nextInvoiceNumber: 4,
      defaultVat: "20.00",
      paymentTerms: 30,
      updatedAt: new Date(),
    };
    
    // Initialize default email template
    // Create default email templates for each invoice type
    const defaultTemplates = [
      {
        id: this.currentTemplateId++,
        name: "Quotation Email Template",
        subject: "Your Quotation from {company_name} - #{invoice_number}",
        body: `Dear {client_name},

Thank you for your interest in our services. Please find attached your quotation #{invoice_number}.

Quotation Details:
- Quotation Number: {invoice_number}
- Date: {invoice_date}
- Valid Until: {due_date}
- Total Amount: {total_amount}

This quotation is valid for 30 days. Please review the details and let us know if you have any questions.

Best regards,
{company_name}`,
        invoiceType: "quotation",
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.currentTemplateId++,
        name: "Final Invoice Email Template",
        subject: "Invoice #{invoice_number} from {company_name}",
        body: `Dear {client_name},

Please find attached your invoice #{invoice_number} for the services completed.

Invoice Details:
- Invoice Number: {invoice_number}
- Invoice Date: {invoice_date}
- Due Date: {due_date}
- Amount Due: {total_amount}

Payment is due by {due_date}. Thank you for your business!

Best regards,
{company_name}`,
        invoiceType: "final_invoice",
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.currentTemplateId++,
        name: "Receipt Email Template",
        subject: "Payment Receipt #{invoice_number} from {company_name}",
        body: `Dear {client_name},

Thank you for your payment! Please find attached your receipt #{invoice_number}.

Receipt Details:
- Receipt Number: {invoice_number}
- Payment Date: {invoice_date}
- Amount Paid: {total_amount}

We appreciate your prompt payment and continued business.

Best regards,
{company_name}`,
        invoiceType: "receipt",
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    
    defaultTemplates.forEach(template => {
      this.emailTemplates.set(template.id, template);
    });
    
    // Add demo clients for demo account
    this.createDemoClients();
    
    // Add sample invoices for demo account
    this.createDemoInvoices();
  }

  private createDemoClients() {
    const demoUserId = 1;
    
    const client1: Client = {
      id: this.currentClientId++,
      userId: demoUserId,
      name: "John Smith",
      email: "john.smith@example.com",
      phone: "+1 (555) 123-4567",
      companyName: "Smith Enterprises",
      addressLine1: "123 Main Street",
      addressLine2: "Suite 200",
      city: "New York",
      state: "NY",
      postalCode: "10001",
      country: "United States",
      notes: "Preferred communication via email",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const client2: Client = {
      id: this.currentClientId++,
      userId: demoUserId,
      name: "Sarah Johnson",
      email: "sarah.johnson@techcorp.com",
      phone: "+1 (555) 987-6543",
      companyName: "TechCorp Solutions",
      addressLine1: "456 Technology Blvd",
      addressLine2: null,
      city: "San Francisco",
      state: "CA",
      postalCode: "94105",
      country: "United States",
      notes: "Net 15 payment terms",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.clients.set(client1.id, client1);
    this.clients.set(client2.id, client2);
  }

  private createDemoInvoices() {
    const demoUserId = 1;
    
    // Sample Invoice 1 - Paid
    const invoice1: Invoice = {
      id: 1,
      userId: demoUserId,
      invoiceNumber: "INV-001",
      clientName: "ABC Corporation",
      clientEmail: "billing@abccorp.com",
      companyName: "ABC Corporation",
      addressLine1: "456 Corporate Blvd",
      city: "Business City",
      country: "United States",
      clientPhone: "+1 (555) 987-6543",
      invoiceDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      items: JSON.stringify([
        {
          name: "Website Design",
          description: "Custom responsive website design",
          quantity: 1,
          rate: 2500.00,
          amount: 2500.00
        },
        {
          name: "Logo Design",
          description: "Brand identity and logo package",
          quantity: 1,
          rate: 800.00,
          amount: 800.00
        }
      ]),
      subtotal: "3300.00",
      discount: "10",
      vat: "20",
      deposit: "0",
      total: "3564.00",
      status: "paid",
      notes: "Thank you for choosing iGraphix Marketing & Co. for your design needs!",
      sentAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    };

    // Sample Invoice 2 - Sent (Awaiting Payment)
    const invoice2: Invoice = {
      id: 2,
      userId: demoUserId,
      invoiceNumber: "INV-002",
      clientName: "Tech Startup Inc",
      clientEmail: "finance@techstartup.com",
      companyName: "Tech Startup Inc",
      addressLine1: "789 Innovation Drive",
      city: "Tech Valley",
      country: "United States",
      clientPhone: "+1 (555) 555-0123",
      invoiceDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      items: JSON.stringify([
        {
          name: "Social Media Management",
          description: "Monthly social media strategy and content creation",
          quantity: 3,
          rate: 1200.00,
          amount: 3600.00
        },
        {
          name: "Digital Marketing Consultation",
          description: "Strategic planning session and market analysis",
          quantity: 2,
          rate: 450.00,
          amount: 900.00
        }
      ]),
      subtotal: "4500.00",
      discount: "5",
      vat: "20",
      deposit: "0",
      total: "5130.00",
      status: "sent",
      notes: "Payment terms: Net 30 days. Thank you for your business!",
      sentAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    };

    // Sample Invoice 3 - Draft
    const invoice3: Invoice = {
      id: 3,
      userId: demoUserId,
      invoiceNumber: "INV-003",
      clientName: "Local Restaurant",
      clientEmail: "owner@localrestaurant.com",
      companyName: "Local Restaurant",
      addressLine1: "123 Main Street",
      city: "Downtown",
      country: "United States",
      clientPhone: "+1 (555) 123-7890",
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      items: JSON.stringify([
        {
          name: "Menu Design",
          description: "Complete menu redesign with printing setup",
          quantity: 1,
          rate: 850.00,
          amount: 850.00
        },
        {
          name: "Business Card Design",
          description: "Professional business card design",
          quantity: 1,
          rate: 250.00,
          amount: 250.00
        }
      ]),
      subtotal: "1100.00",
      discount: "0",
      vat: "20",
      deposit: "300",
      total: "1020.00",
      status: "draft",
      notes: "Project includes 3 revision rounds. Deposit required before work begins.",
      sentAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.invoices.set(1, invoice1);
    this.invoices.set(2, invoice2);
    this.invoices.set(3, invoice3);
    this.currentInvoiceId = 4;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.firebaseUid === firebaseUid);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      isAdmin: insertUser.isAdmin ?? true,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getInvoices(userId: number): Promise<Invoice[]> {
    return Array.from(this.invoices.values())
      .filter(invoice => invoice.createdBy === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getInvoice(id: number, userId: number): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(id);
    return invoice?.createdBy === userId ? invoice : undefined;
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const id = this.currentInvoiceId++;
    const now = new Date();
    
    const invoice: Invoice = {
      ...insertInvoice,
      id,
      status: "draft",
      clientPhone: insertInvoice.clientPhone || null,
      companyName: insertInvoice.companyName || null,
      notes: insertInvoice.notes || null,
      pdfUrl: null,
      sentAt: null,
      discount: insertInvoice.discount || "0",
      vat: insertInvoice.vat || "0",
      deposit: insertInvoice.deposit || "0",
      createdAt: now,
      updatedAt: now,
    };
    
    this.invoices.set(id, invoice);
    
    // Update next invoice number in settings
    if (this.settings) {
      this.settings.nextInvoiceNumber++;
    }
    
    return invoice;
  }

  async updateInvoice(id: number, updateData: Partial<Invoice>, userId: number): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(id);
    if (!invoice || invoice.createdBy !== userId) {
      return undefined;
    }

    const updatedInvoice: Invoice = {
      ...invoice,
      ...updateData,
      updatedAt: new Date(),
    };

    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  async deleteInvoice(id: number, userId: number): Promise<boolean> {
    const invoice = this.invoices.get(id);
    if (!invoice || invoice.createdBy !== userId) {
      return false;
    }

    return this.invoices.delete(id);
  }

  async getInvoiceStats(userId: number): Promise<{
    totalInvoices: number;
    totalIncome: number;
    outstanding: number;
    deposited: number;
  }> {
    const userInvoices = Array.from(this.invoices.values())
      .filter(invoice => invoice.createdBy === userId);

    const totalInvoices = userInvoices.length;
    const totalIncome = userInvoices
      .filter(invoice => invoice.status === "paid")
      .reduce((sum, invoice) => sum + parseFloat(invoice.total), 0);
    
    const outstanding = userInvoices
      .filter(invoice => ["pending", "sent", "overdue"].includes(invoice.status))
      .reduce((sum, invoice) => sum + parseFloat(invoice.total), 0);
    
    const deposited = userInvoices
      .reduce((sum, invoice) => sum + parseFloat(invoice.deposit), 0);

    return {
      totalInvoices,
      totalIncome,
      outstanding,
      deposited,
    };
  }

  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return Array.from(this.emailTemplates.values())
      .sort((a, b) => a.isDefault ? -1 : b.isDefault ? 1 : 0);
  }

  async getEmailTemplate(id: number): Promise<EmailTemplate | undefined> {
    return this.emailTemplates.get(id);
  }

  async getDefaultEmailTemplate(): Promise<EmailTemplate | undefined> {
    return Array.from(this.emailTemplates.values())
      .find(template => template.isDefault);
  }

  async createEmailTemplate(insertTemplate: InsertEmailTemplate): Promise<EmailTemplate> {
    const id = this.currentTemplateId++;
    const now = new Date();
    
    const template: EmailTemplate = {
      ...insertTemplate,
      id,
      isDefault: insertTemplate.isDefault ?? false,
      createdAt: now,
      updatedAt: now,
    };
    
    this.emailTemplates.set(id, template);
    return template;
  }

  async updateEmailTemplate(id: number, updateData: Partial<EmailTemplate>): Promise<EmailTemplate | undefined> {
    const template = this.emailTemplates.get(id);
    if (!template) {
      return undefined;
    }

    const updatedTemplate: EmailTemplate = {
      ...template,
      ...updateData,
      updatedAt: new Date(),
    };

    this.emailTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async getSettings(): Promise<Settings | undefined> {
    return this.settings;
  }

  async updateSettings(updateData: Partial<Settings>): Promise<Settings> {
    if (!this.settings) {
      throw new Error("Settings not initialized");
    }

    this.settings = {
      ...this.settings,
      ...updateData,
      updatedAt: new Date(),
    };

    return this.settings;
  }

  // Client operations
  async getClients(userId: number): Promise<Client[]> {
    return Array.from(this.clients.values())
      .filter(client => client.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getClient(id: number, userId: number): Promise<Client | undefined> {
    const client = this.clients.get(id);
    return client && client.userId === userId ? client : undefined;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = this.currentClientId++;
    const now = new Date();
    
    const client: Client = {
      ...insertClient,
      id,
      createdAt: now,
      updatedAt: now,
    };
    
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: number, updateData: Partial<Client>, userId: number): Promise<Client | undefined> {
    const existingClient = this.clients.get(id);
    
    if (!existingClient || existingClient.userId !== userId) {
      return undefined;
    }
    
    const updatedClient: Client = {
      ...existingClient,
      ...updateData,
      id: existingClient.id,
      userId: existingClient.userId,
      createdAt: existingClient.createdAt,
      updatedAt: new Date(),
    };
    
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: number, userId: number): Promise<boolean> {
    const client = this.clients.get(id);
    
    if (!client || client.userId !== userId) {
      return false;
    }
    
    return this.clients.delete(id);
  }
}

export const storage = new MemStorage();
