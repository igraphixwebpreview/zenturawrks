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
  Timestamp
} from "firebase/firestore";
import { db } from "./firebase";
import type { User, Invoice, Client, EmailTemplate, Settings } from "@shared/schema";

// Collections
const COLLECTIONS = {
  users: "users",
  invoices: "invoices", 
  clients: "clients",
  emailTemplates: "emailTemplates",
  settings: "settings"
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
  const q = query(
    collection(db, COLLECTIONS.settings),
    where("userId", "==", userId)
  );
  
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  
  const doc = querySnapshot.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    updatedAt: data.updatedAt?.toDate()
  } as Settings;
};

export const updateSettings = async (userId: string, settingsData: Partial<Settings>): Promise<Settings> => {
  // First try to find existing settings
  const existingSettings = await getSettings(userId);
  
  if (existingSettings) {
    // Update existing
    const settingsRef = doc(db, COLLECTIONS.settings, existingSettings.id);
    await updateDoc(settingsRef, {
      ...settingsData,
      updatedAt: serverTimestamp()
    });
    
    const updatedDoc = await getDoc(settingsRef);
    const data = updatedDoc.data();
    return {
      id: updatedDoc.id,
      ...data,
      updatedAt: data?.updatedAt?.toDate()
    } as Settings;
  } else {
    // Create new
    const docRef = await addDoc(collection(db, COLLECTIONS.settings), {
      ...settingsData,
      userId,
      updatedAt: serverTimestamp()
    });
    
    const settingsDoc = await getDoc(docRef);
    const data = settingsDoc.data();
    return {
      id: docRef.id,
      ...data,
      updatedAt: data?.updatedAt?.toDate()
    } as Settings;
  }
};