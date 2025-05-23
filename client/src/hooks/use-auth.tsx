import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { signIn, signOut, registerUser, type User } from "@/lib/auth";
import { auth } from "@/lib/firebase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: !!firebaseUser,
    retry: false,
  });

  useEffect(() => {
    // For demo mode without Firebase, create a mock user
    const mockUser = {
      id: 1,
      email: "admin@demo.com",
      firebaseUid: "demo-uid",
      isAdmin: true,
      createdAt: new Date(),
    };
    
    // Simulate loading time
    setTimeout(() => {
      setFirebaseUser({ uid: "demo-uid", email: "admin@demo.com" } as any);
      setLoading(false);
    }, 1000);
  }, [queryClient]);

  const handleSignIn = async (email: string, password: string) => {
    await signIn(email, password);
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
