import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  DocumentData 
} from "firebase/firestore";
import { db } from "../client/src/lib/firebase";
import { IStorage } from "./storage";
import { User, InsertUser, Invoice, InsertInvoice, Client, InsertClient, EmailTemplate, InsertEmailTemplate, Settings, InsertSettings } from "../shared/schema";

export class FirebaseStorage implements IStorage {
  // Collections
  private usersCollection = collection(db, "users");
  private invoicesCollection = collection(db, "invoices");
  private clientsCollection = collection(db, "clients");
  private emailTemplatesCollection = collection(db, "email_templates");
  private settingsCollection = collection(db, "settings");

  // Helper function to convert Firestore data
  private convertFirestoreDoc(doc: DocumentData, id: string): any {
    const data = doc.data();
    // Convert Firestore Timestamps to Date objects
    Object.keys(data).forEach(key => {
      if (data[key] instanceof Timestamp) {
        data[key] = data[key].toDate();
      }
    });
    return { id, ...data };
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      const userDoc = await getDoc(doc(this.usersCollection, id.toString()));
      if (userDoc.exists()) {
        return this.convertFirestoreDoc(userDoc, id.toString()) as User;
      }
      return undefined;
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    try {
      const q = query(this.usersCollection, where("firebaseUid", "==", firebaseUid));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return this.convertFirestoreDoc(userDoc, userDoc.id) as User;
      }
      return undefined;
    } catch (error) {
      console.error("Error getting user by Firebase UID:", error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const userData = {
        ...user,
        createdAt: Timestamp.now(),
      };
      const docRef = await addDoc(this.usersCollection, userData);
      return {
        id: parseInt(docRef.id),
        ...userData,
        createdAt: userData.createdAt.toDate(),
      } as User;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  // Invoice operations
  async getInvoices(userId: number): Promise<Invoice[]> {
    try {
      const q = query(
        this.invoicesCollection, 
        where("createdBy", "==", userId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => 
        this.convertFirestoreDoc(doc, doc.id) as Invoice
      );
    } catch (error) {
      console.error("Error getting invoices:", error);
      return [];
    }
  }

  async getInvoice(id: number, userId: number): Promise<Invoice | undefined> {
    try {
      const invoiceDoc = await getDoc(doc(this.invoicesCollection, id.toString()));
      if (invoiceDoc.exists()) {
        const invoice = this.convertFirestoreDoc(invoiceDoc, id.toString()) as Invoice;
        if (invoice.createdBy === userId) {
          return invoice;
        }
      }
      return undefined;
    } catch (error) {
      console.error("Error getting invoice:", error);
      return undefined;
    }
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    try {
      const invoiceData = {
        ...invoice,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      const docRef = await addDoc(this.invoicesCollection, invoiceData);
      return {
        id: parseInt(docRef.id),
        ...invoiceData,
        createdAt: invoiceData.createdAt.toDate(),
        updatedAt: invoiceData.updatedAt.toDate(),
      } as Invoice;
    } catch (error) {
      console.error("Error creating invoice:", error);
      throw error;
    }
  }

  async updateInvoice(id: number, updateData: Partial<Invoice>, userId: number): Promise<Invoice | undefined> {
    try {
      const invoiceRef = doc(this.invoicesCollection, id.toString());
      const invoiceDoc = await getDoc(invoiceRef);
      
      if (invoiceDoc.exists()) {
        const invoice = this.convertFirestoreDoc(invoiceDoc, id.toString()) as Invoice;
        if (invoice.createdBy === userId) {
          const updatedData = {
            ...updateData,
            updatedAt: Timestamp.now(),
          };
          await updateDoc(invoiceRef, updatedData);
          return {
            ...invoice,
            ...updateData,
            updatedAt: new Date(),
          } as Invoice;
        }
      }
      return undefined;
    } catch (error) {
      console.error("Error updating invoice:", error);
      return undefined;
    }
  }

  async deleteInvoice(id: number, userId: number): Promise<boolean> {
    try {
      const invoiceDoc = await getDoc(doc(this.invoicesCollection, id.toString()));
      if (invoiceDoc.exists()) {
        const invoice = this.convertFirestoreDoc(invoiceDoc, id.toString()) as Invoice;
        if (invoice.createdBy === userId) {
          await deleteDoc(doc(this.invoicesCollection, id.toString()));
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error deleting invoice:", error);
      return false;
    }
  }

  async getInvoiceStats(userId: number): Promise<{
    totalInvoices: number;
    totalIncome: number;
    outstanding: number;
    deposited: number;
  }> {
    try {
      const invoices = await this.getInvoices(userId);
      
      const totalInvoices = invoices.length;
      const totalIncome = invoices.reduce((sum, inv) => sum + parseFloat(inv.total), 0);
      const outstanding = invoices
        .filter(inv => inv.status === "sent" || inv.status === "overdue")
        .reduce((sum, inv) => sum + parseFloat(inv.total), 0);
      const deposited = invoices
        .filter(inv => inv.status === "paid")
        .reduce((sum, inv) => sum + parseFloat(inv.total), 0);

      return {
        totalInvoices,
        totalIncome,
        outstanding,
        deposited,
      };
    } catch (error) {
      console.error("Error getting invoice stats:", error);
      return {
        totalInvoices: 0,
        totalIncome: 0,
        outstanding: 0,
        deposited: 0,
      };
    }
  }

  // Client operations
  async getClients(userId: number): Promise<Client[]> {
    try {
      const q = query(
        this.clientsCollection, 
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => 
        this.convertFirestoreDoc(doc, doc.id) as Client
      );
    } catch (error) {
      console.error("Error getting clients:", error);
      return [];
    }
  }

  async getClient(id: number, userId: number): Promise<Client | undefined> {
    try {
      const clientDoc = await getDoc(doc(this.clientsCollection, id.toString()));
      if (clientDoc.exists()) {
        const client = this.convertFirestoreDoc(clientDoc, id.toString()) as Client;
        if (client.userId === userId) {
          return client;
        }
      }
      return undefined;
    } catch (error) {
      console.error("Error getting client:", error);
      return undefined;
    }
  }

  async createClient(client: InsertClient): Promise<Client> {
    try {
      const clientData = {
        ...client,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      const docRef = await addDoc(this.clientsCollection, clientData);
      return {
        id: parseInt(docRef.id),
        ...clientData,
        createdAt: clientData.createdAt.toDate(),
        updatedAt: clientData.updatedAt.toDate(),
      } as Client;
    } catch (error) {
      console.error("Error creating client:", error);
      throw error;
    }
  }

  async updateClient(id: number, updateData: Partial<Client>, userId: number): Promise<Client | undefined> {
    try {
      const clientRef = doc(this.clientsCollection, id.toString());
      const clientDoc = await getDoc(clientRef);
      
      if (clientDoc.exists()) {
        const client = this.convertFirestoreDoc(clientDoc, id.toString()) as Client;
        if (client.userId === userId) {
          const updatedData = {
            ...updateData,
            updatedAt: Timestamp.now(),
          };
          await updateDoc(clientRef, updatedData);
          return {
            ...client,
            ...updateData,
            updatedAt: new Date(),
          } as Client;
        }
      }
      return undefined;
    } catch (error) {
      console.error("Error updating client:", error);
      return undefined;
    }
  }

  async deleteClient(id: number, userId: number): Promise<boolean> {
    try {
      const clientDoc = await getDoc(doc(this.clientsCollection, id.toString()));
      if (clientDoc.exists()) {
        const client = this.convertFirestoreDoc(clientDoc, id.toString()) as Client;
        if (client.userId === userId) {
          await deleteDoc(doc(this.clientsCollection, id.toString()));
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error deleting client:", error);
      return false;
    }
  }

  // Email template operations
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    try {
      const q = query(this.emailTemplatesCollection, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => 
        this.convertFirestoreDoc(doc, doc.id) as EmailTemplate
      );
    } catch (error) {
      console.error("Error getting email templates:", error);
      return [];
    }
  }

  async getEmailTemplate(id: number): Promise<EmailTemplate | undefined> {
    try {
      const templateDoc = await getDoc(doc(this.emailTemplatesCollection, id.toString()));
      if (templateDoc.exists()) {
        return this.convertFirestoreDoc(templateDoc, id.toString()) as EmailTemplate;
      }
      return undefined;
    } catch (error) {
      console.error("Error getting email template:", error);
      return undefined;
    }
  }

  async getDefaultEmailTemplate(): Promise<EmailTemplate | undefined> {
    try {
      const q = query(this.emailTemplatesCollection, where("isDefault", "==", true));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const templateDoc = querySnapshot.docs[0];
        return this.convertFirestoreDoc(templateDoc, templateDoc.id) as EmailTemplate;
      }
      return undefined;
    } catch (error) {
      console.error("Error getting default email template:", error);
      return undefined;
    }
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    try {
      const templateData = {
        ...template,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      const docRef = await addDoc(this.emailTemplatesCollection, templateData);
      return {
        id: parseInt(docRef.id),
        ...templateData,
        createdAt: templateData.createdAt.toDate(),
        updatedAt: templateData.updatedAt.toDate(),
      } as EmailTemplate;
    } catch (error) {
      console.error("Error creating email template:", error);
      throw error;
    }
  }

  async updateEmailTemplate(id: number, updateData: Partial<EmailTemplate>): Promise<EmailTemplate | undefined> {
    try {
      const templateRef = doc(this.emailTemplatesCollection, id.toString());
      const templateDoc = await getDoc(templateRef);
      
      if (templateDoc.exists()) {
        const template = this.convertFirestoreDoc(templateDoc, id.toString()) as EmailTemplate;
        const updatedData = {
          ...updateData,
          updatedAt: Timestamp.now(),
        };
        await updateDoc(templateRef, updatedData);
        return {
          ...template,
          ...updateData,
          updatedAt: new Date(),
        } as EmailTemplate;
      }
      return undefined;
    } catch (error) {
      console.error("Error updating email template:", error);
      return undefined;
    }
  }

  // Settings operations
  async getSettings(): Promise<Settings | undefined> {
    try {
      const q = query(this.settingsCollection);
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const settingsDoc = querySnapshot.docs[0];
        return this.convertFirestoreDoc(settingsDoc, settingsDoc.id) as Settings;
      }
      return undefined;
    } catch (error) {
      console.error("Error getting settings:", error);
      return undefined;
    }
  }

  async updateSettings(updateData: Partial<Settings>): Promise<Settings> {
    try {
      const q = query(this.settingsCollection);
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const settingsDoc = querySnapshot.docs[0];
        const settingsRef = doc(this.settingsCollection, settingsDoc.id);
        const updatedData = {
          ...updateData,
          updatedAt: Timestamp.now(),
        };
        await updateDoc(settingsRef, updatedData);
        
        const settings = this.convertFirestoreDoc(settingsDoc, settingsDoc.id) as Settings;
        return {
          ...settings,
          ...updateData,
          updatedAt: new Date(),
        } as Settings;
      } else {
        // Create new settings if none exist
        const settingsData = {
          ...updateData,
          updatedAt: Timestamp.now(),
        };
        const docRef = await addDoc(this.settingsCollection, settingsData);
        return {
          id: parseInt(docRef.id),
          ...settingsData,
          updatedAt: new Date(),
        } as Settings;
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      throw error;
    }
  }
}