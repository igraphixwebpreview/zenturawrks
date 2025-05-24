import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  User as FirebaseUser 
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { auth, db } from "./firebase";

export interface User {
  id: string;
  email: string;
  firebaseUid: string;
  displayName?: string;
  createdAt: Date;
}

export const signIn = async (email: string, password: string): Promise<FirebaseUser> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const signUp = async (email: string, password: string): Promise<FirebaseUser> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await createUserProfile(userCredential.user);
  return userCredential.user;
};

export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

export const createUserProfile = async (firebaseUser: FirebaseUser): Promise<void> => {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    const userData = {
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      createdAt: serverTimestamp(),
    };
    
    await setDoc(userRef, userData);
  }
};

export const getUserProfile = async (uid: string): Promise<User | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        id: uid,
        email: data.email,
        firebaseUid: uid,
        displayName: data.displayName,
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
};

export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};