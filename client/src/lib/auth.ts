import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { auth } from "./firebase";
import { apiRequest } from "./queryClient";

export interface User {
  id: number;
  email: string;
  firebaseUid: string;
  isAdmin: boolean;
  createdAt: Date;
}

export const signIn = async (email: string, password: string): Promise<void> => {
  await signInWithEmailAndPassword(auth, email, password);
};

export const signUp = async (email: string, password: string): Promise<void> => {
  await createUserWithEmailAndPassword(auth, email, password);
};

export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

export const getCurrentUser = (): Promise<FirebaseUser | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

export const registerUser = async (firebaseUser: FirebaseUser): Promise<User> => {
  const token = await firebaseUser.getIdToken();
  
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-firebase-uid": firebaseUser.uid,
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      email: firebaseUser.email,
      firebaseUid: firebaseUser.uid,
    }),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to register user");
  }

  return response.json();
};

export const setupAuthHeaders = async (): Promise<Record<string, string>> => {
  const firebaseUser = await getCurrentUser();
  if (!firebaseUser) {
    throw new Error("No authenticated user");
  }

  const token = await firebaseUser.getIdToken();
  return {
    "x-firebase-uid": firebaseUser.uid,
    "Authorization": `Bearer ${token}`,
  };
};
