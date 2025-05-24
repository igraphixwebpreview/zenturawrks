import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { signIn, signUp, signOut, createUserProfile, getUserProfile, type User } from "@/lib/firebase-auth";
import { auth } from "@/lib/firebase";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        // Create user object directly from Firebase Auth data
        const userProfile: User = {
          id: 1, // Simple ID for compatibility
          email: firebaseUser.email || '',
          firebaseUid: firebaseUser.uid,
          isAdmin: true, // Set as admin for now
          createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
          photoURL: firebaseUser.photoURL || null,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User'
        };
        setUser(userProfile);
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [queryClient]);

  const handleSignIn = async (email: string, password: string) => {
    await signIn(email, password);
  };

  const handleSignUp = async (email: string, password: string) => {
    await signUp(email, password);
  };

  const handleSignOut = async () => {
    await signOut();
    queryClient.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user: (user as User) || null,
        loading,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
