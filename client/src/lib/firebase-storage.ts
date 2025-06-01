import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  setDoc
} from "firebase/firestore";
import { db } from "./firebase";
import type { User, Invoice, Client, EmailTemplate, Settings } from "@shared/schema";

// Firebase-specific types that match our schema
type FirebaseUser = Omit<User, "id" | "createdAt"> & {
  id: string;
  createdAt: Timestamp;
};

type FirebaseInvoice = Omit<Invoice, "id" | "createdAt" | "updatedAt"> & {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

type FirebaseClient = Omit<Client, "id" | "createdAt" | "updatedAt"> & {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

type FirebaseEmailTemplate = Omit<EmailTemplate, "id" | "createdAt" | "updatedAt"> & {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

type FirebaseSettings = Omit<Settings, "id" | "updatedAt"> & {
  id: string;
  userId: string;
  updatedAt: Timestamp;
};

// Collections
const COLLECTIONS = {
  users: "users",
  invoices: "invoices", 
  clients: "clients",
  emailTemplates: "email_templates",
  settings: "settings"
};

// Helper function to convert Firebase data to schema types
const convertToSchemaType = <T extends { id: string; createdAt: Timestamp; updatedAt?: Timestamp }>(
  data: T,
  type: "user" | "invoice" | "client" | "emailTemplate" | "settings"
): any => {
  const base = {
    id: 1, // We'll use a fixed ID since we're using Firebase
    createdAt: data.createdAt.toDate(),
    ...(data.updatedAt && { updatedAt: data.updatedAt.toDate() })
  };

  switch (type) {
    case "user":
      return {
        ...base,
        email: (data as FirebaseUser).email,
        firebaseUid: (data as FirebaseUser).firebaseUid,
        isAdmin: (data as FirebaseUser).isAdmin
      } as User;
    case "invoice":
      return {
        ...base,
        ...(data as FirebaseInvoice)
      } as Invoice;
    case "client":
      return {
        ...base,
        ...(data as FirebaseClient)
      } as Client;
    case "emailTemplate":
      return {
        ...base,
        ...(data as FirebaseEmailTemplate)
      } as EmailTemplate;
    case "settings":
      return {
        ...base,
        ...(data as FirebaseSettings)
      } as Settings;
  }
};

// User operations
export const createUser = async (userData: Omit<User, "id" | "createdAt">): Promise<User> => {
  const docRef = await addDoc(collection(db, COLLECTIONS.users), {
    ...userData,
    createdAt: serverTimestamp()
  });
  
  const userDoc = await getDoc(docRef);
  return { id: docRef.id, ...userDoc.data(), createdAt: userDoc.data()?.createdAt?.toDate() } as User;
};

export const getUser = async (uid: string): Promise<User | null> => {
  const userRef = doc(db, COLLECTIONS.users, uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    const data = userSnap.data();
    return {
      id: userSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate()
    } as User;
  }
  
  return null;
};

// Invoice operations
export const createInvoice = async (invoiceData: Omit<Invoice, "id" | "createdAt" | "updatedAt">): Promise<Invoice> => {
  const docRef = await addDoc(collection(db, COLLECTIONS.invoices), {
    ...invoiceData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  
  const invoiceDoc = await getDoc(docRef);
  const data = invoiceDoc.data();
  return {
    id: docRef.id,
    ...data,
    createdAt: data?.createdAt?.toDate(),
    updatedAt: data?.updatedAt?.toDate()
  } as Invoice;
};

export const getInvoices = async (userId: string): Promise<Invoice[]> => {
  const q = query(
    collection(db, COLLECTIONS.invoices),
    where("createdBy", "==", userId),
    orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate()
  })) as Invoice[];
};

export const updateInvoice = async (invoiceId: string, updates: Partial<Invoice>): Promise<void> => {
  const invoiceRef = doc(db, COLLECTIONS.invoices, invoiceId);
  await updateDoc(invoiceRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

export const deleteInvoice = async (invoiceId: string): Promise<void> => {
  const invoiceRef = doc(db, COLLECTIONS.invoices, invoiceId);
  await deleteDoc(invoiceRef);
};

// Client operations
export const createClient = async (clientData: Omit<Client, "id" | "createdAt" | "updatedAt">): Promise<Client> => {
  const docRef = await addDoc(collection(db, COLLECTIONS.clients), {
    ...clientData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  
  const clientDoc = await getDoc(docRef);
  const data = clientDoc.data();
  return {
    id: docRef.id,
    ...data,
    createdAt: data?.createdAt?.toDate(),
    updatedAt: data?.updatedAt?.toDate()
  } as Client;
};

export const getClients = async (userId: string): Promise<Client[]> => {
  const q = query(
    collection(db, COLLECTIONS.clients),
    where("userId", "==", userId),
    orderBy("name")
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate()
  })) as Client[];
};

export const updateClient = async (clientId: string, updates: Partial<Client>): Promise<void> => {
  const clientRef = doc(db, COLLECTIONS.clients, clientId);
  await updateDoc(clientRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

export const deleteClient = async (clientId: string): Promise<void> => {
  const clientRef = doc(db, COLLECTIONS.clients, clientId);
  await deleteDoc(clientRef);
};

// Email Template operations
export const createEmailTemplate = async (templateData: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">): Promise<EmailTemplate> => {
  const docRef = await addDoc(collection(db, COLLECTIONS.emailTemplates), {
    ...templateData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  
  const templateDoc = await getDoc(docRef);
  const data = templateDoc.data();
  return {
    id: docRef.id,
    ...data,
    createdAt: data?.createdAt?.toDate(),
    updatedAt: data?.updatedAt?.toDate()
  } as EmailTemplate;
};

export const getEmailTemplates = async (): Promise<EmailTemplate[]> => {
  const q = query(collection(db, COLLECTIONS.emailTemplates), orderBy("name"));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate()
  })) as EmailTemplate[];
};

export const updateEmailTemplate = async (templateId: string, updates: Partial<EmailTemplate>): Promise<void> => {
  const templateRef = doc(db, COLLECTIONS.emailTemplates, templateId);
  await updateDoc(templateRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

export const deleteEmailTemplate = async (templateId: string): Promise<void> => {
  const templateRef = doc(db, COLLECTIONS.emailTemplates, templateId);
  await deleteDoc(templateRef);
};

// Settings operations
export const getSettings = async (userId: string): Promise<Settings | null> => {
  try {
    console.log("Getting settings for user:", userId);
    const q = query(
      collection(db, COLLECTIONS.settings),
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    console.log("Settings query result:", querySnapshot.empty ? "No settings found" : "Settings found");
    
    if (querySnapshot.empty) {
      console.log("Creating default settings for user:", userId);
      // Create default settings if none exist
      const defaultSettings = {
        userId,
        companyName: "Your Company",
        companyAddress: "123 Business Street\nCity, State 12345",
        companyPhone: "+1 (555) 123-4567",
        companyEmail: "",
        invoicePrefix: "INV-",
        nextInvoiceNumber: 1,
        defaultVat: "0.00",
        paymentTerms: 30,
        updatedAt: serverTimestamp()
      };
      
      // Create a new document with a fixed ID for settings
      const docRef = doc(db, COLLECTIONS.settings, userId);
      await setDoc(docRef, defaultSettings);
      
      // Return the default settings directly without querying again
      return {
        id: 1,
        companyName: defaultSettings.companyName,
        companyAddress: defaultSettings.companyAddress,
        companyPhone: defaultSettings.companyPhone,
        companyEmail: defaultSettings.companyEmail,
        invoicePrefix: defaultSettings.invoicePrefix,
        nextInvoiceNumber: defaultSettings.nextInvoiceNumber,
        defaultVat: defaultSettings.defaultVat,
        paymentTerms: defaultSettings.paymentTerms,
        updatedAt: new Date()
      } as Settings;
    }
    
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    console.log("Retrieved settings data:", data);
    
    // Convert defaultVat to a string with 2 decimal places
    const defaultVat = data.defaultVat ? parseFloat(data.defaultVat).toFixed(2) : "0.00";
    
    return {
      id: 1,
      companyName: data.companyName || "Your Company",
      companyAddress: data.companyAddress || "123 Business Street\nCity, State 12345",
      companyPhone: data.companyPhone || "+1 (555) 123-4567",
      companyEmail: data.companyEmail || "",
      invoicePrefix: data.invoicePrefix || "INV-",
      nextInvoiceNumber: data.nextInvoiceNumber || 1,
      defaultVat,
      paymentTerms: data.paymentTerms || 30,
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as Settings;
  } catch (error) {
    console.error("Error in getSettings:", error);
    throw error;
  }
};

export const updateSettings = async (userId: string, settingsData: Partial<Settings>): Promise<Settings> => {
  try {
    console.log("Updating settings for user:", userId);
    
    // Convert defaultVat to a string with 2 decimal places
    const defaultVat = settingsData.defaultVat ? parseFloat(settingsData.defaultVat.toString()).toFixed(2) : "0.00";
    
    // Use the user's ID as the document ID for settings
    const docRef = doc(db, COLLECTIONS.settings, userId);
    
    // Try to get the existing document
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      // Create new settings
      await setDoc(docRef, {
        ...settingsData,
        defaultVat,
        userId,
        updatedAt: serverTimestamp()
      });
    } else {
      // Update existing settings
      await updateDoc(docRef, {
        ...settingsData,
        defaultVat,
        updatedAt: serverTimestamp()
      });
    }
    
    // Get the updated document
    const updatedDoc = await getDoc(docRef);
    const data = updatedDoc.data();
    
    return {
      id: 1,
      companyName: data?.companyName || "Your Company",
      companyAddress: data?.companyAddress || "123 Business Street\nCity, State 12345",
      companyPhone: data?.companyPhone || "+1 (555) 123-4567",
      companyEmail: data?.companyEmail || "",
      invoicePrefix: data?.invoicePrefix || "INV-",
      nextInvoiceNumber: data?.nextInvoiceNumber || 1,
      defaultVat: data?.defaultVat || "0.00",
      paymentTerms: data?.paymentTerms || 30,
      updatedAt: data?.updatedAt?.toDate() || new Date()
    } as Settings;
  } catch (error) {
    console.error("Error in updateSettings:", error);
    throw error;
  }
};