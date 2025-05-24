// Demo authentication system for development
import { User } from "@/lib/firebase-auth";

let currentDemoUser: User | null = null;

export const demoSignIn = async (email: string, password: string): Promise<User> => {
  // Simple demo authentication
  if (password.length >= 6) {
    const user: User = {
      id: email,
      email,
      firebaseUid: `demo-${email}`,
      displayName: email.split('@')[0],
      createdAt: new Date(),
    };
    currentDemoUser = user;
    localStorage.setItem('demo-user', JSON.stringify(user));
    return user;
  } else {
    throw new Error('Password must be at least 6 characters');
  }
};

export const demoSignUp = async (email: string, password: string): Promise<User> => {
  return demoSignIn(email, password);
};

export const demoSignOut = async (): Promise<void> => {
  currentDemoUser = null;
  localStorage.removeItem('demo-user');
};

export const getDemoUser = (): User | null => {
  if (currentDemoUser) return currentDemoUser;
  
  const stored = localStorage.getItem('demo-user');
  if (stored) {
    try {
      currentDemoUser = JSON.parse(stored);
      return currentDemoUser;
    } catch {
      localStorage.removeItem('demo-user');
    }
  }
  
  return null;
};