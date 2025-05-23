import { 
  users, 
  invoices, 
  emailTemplates, 
  settings,
  type User, 
  type InsertUser,
  type Invoice,
  type InsertInvoice,
  type EmailTemplate,
  type InsertEmailTemplate,
  type Settings,
  type InsertSettings
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
  private settings: Settings | undefined;
  private currentUserId: number;
  private currentInvoiceId: number;
  private currentTemplateId: number;

  constructor() {
    this.users = new Map();
    this.invoices = new Map();
    this.emailTemplates = new Map();
    this.currentUserId = 1;
    this.currentInvoiceId = 1;
    this.currentTemplateId = 1;
    
    // Initialize default settings
    this.settings = {
      id: 1,
      companyName: "iGraphix Marketing & Co.",
      companyAddress: "123 Business Street\nBusiness City, BC 12345\nCountry",
      companyPhone: "+1 (555) 123-4567",
      companyEmail: "info@igraphix.com",
      invoicePrefix: "INV-",
      nextInvoiceNumber: 1,
      defaultVat: "20.00",
      paymentTerms: 30,
      updatedAt: new Date(),
    };
    
    // Initialize default email template
    const defaultTemplate: EmailTemplate = {
      id: this.currentTemplateId++,
      name: "Default Invoice Template",
      subject: "Your Invoice from iGraphix Marketing & Co. - [Invoice #{invoice_number}]",
      body: `Dear {client_name},

Please find attached your invoice #{invoice_number} for the services rendered.

You can download your invoice using the button below. Thank you for your business.

Invoice Details:
- Invoice Number: {invoice_number}
- Invoice Date: {invoice_date}
- Due Date: {due_date}
- Amount: {total_amount}

Best regards,
iGraphix Marketing & Co.`,
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.emailTemplates.set(defaultTemplate.id, defaultTemplate);
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
}

export const storage = new MemStorage();
