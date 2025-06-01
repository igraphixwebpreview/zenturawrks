import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  User as FirebaseUser,
  sendEmailVerification,
  applyActionCode,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithCredential,
  EmailAuthProvider,
  UserCredential,
  FacebookAuthProvider,
  OAuthProvider,
  updateProfile
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  updateDoc
} from "firebase/firestore";
import { auth, db } from "./firebase";

export interface User {
  id: string;
  email: string;
  firebaseUid: string;
  isAdmin: boolean;
  createdAt: Date;
  photoURL?: string | null;
  displayName?: string;
}

interface LoginHistory {
  ip: string;
  timestamp: Date;
  deviceInfo: string;
  location?: string;
  isVerified: boolean;
}

export const signIn = async (email: string, password: string): Promise<{ user: FirebaseUser; isSuspicious: boolean; isFirstLoginAttempt: boolean }> => {
  try {
    console.log("Starting sign in process...");
    
    // First authenticate the user
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("Firebase authentication successful for user:", user.uid);

    // Get IP address
    console.log("Fetching IP address...");
    const response = await fetch('https://api.ipify.org?format=json');
    const { ip } = await response.json();
    console.log("Current IP address:", ip);
    
    // Get device info
    const deviceInfo = `${navigator.userAgent} - ${navigator.platform}`;
    console.log("Current device info:", deviceInfo);
    
    // Get all previous login attempts to determine if this is the first one
    console.log("Checking previous login attempts...");
    const loginHistoryRef = collection(db, 'users', user.uid, 'loginHistory');
    const q = query(
      loginHistoryRef,
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    console.log("Found", querySnapshot.size, " previous login attempts.");
    
    // Determine if this is the very first login attempt
    const isFirstLoginAttempt = querySnapshot.size === 0;
    console.log("Is this the first login attempt?", isFirstLoginAttempt);

    // Determine if the current IP has been verified before (excluding the potential current unverified attempt)
     // We need to fetch login history *again* but specifically look for verified IPs.
     // This avoids a race condition where the attempt just recorded might not be verified yet.
    const verifiedLoginHistoryQ = query(
        loginHistoryRef,
        where('isVerified', '==', true),
        where('ip', '==', ip),
        orderBy('timestamp', 'desc'),
        limit(1) // We only need to know if at least one verified login from this IP exists
    );

    const verifiedLoginHistorySnapshot = await getDocs(verifiedLoginHistoryQ);
    const hasPreviouslyVerifiedIp = !verifiedLoginHistorySnapshot.empty;
    console.log("Has a previously verified login from this IP?", hasPreviouslyVerifiedIp);
    
    let isSuspicious = false;

    // --- Modified Logic for Suspicious Check --- 
    // The first login attempt is never suspicious.
    // For subsequent logins, it's suspicious if the current IP has NOT been previously verified.
    if (!isFirstLoginAttempt) {
         isSuspicious = !hasPreviouslyVerifiedIp;
         console.log("It is not the first login attempt. Is suspicious based on previously verified IP:", isSuspicious);
    } else {
        console.log("It is the first login attempt, marking as non-suspicious.");
         isSuspicious = false; // Explicitly set to false for first login
    }

    // Record this login attempt
    console.log("Recording new login attempt...");
    await setDoc(doc(loginHistoryRef), {
      ip,
      deviceInfo,
      timestamp: serverTimestamp(),
      // Mark as verified during recording if it's the first attempt OR if the IP was previously verified
      // NOTE: If it's the first attempt, we mark it as verified here so checkSuspiciousSignIn works for subsequent logins.
      isVerified: isFirstLoginAttempt || hasPreviouslyVerifiedIp
    });
    console.log("Login attempt recorded");
    console.log("Returning isSuspicious:", isSuspicious, "isFirstLoginAttempt:", isFirstLoginAttempt);

    // Return both user, isSuspicious flag, and isFirstLoginAttempt flag
    return { user, isSuspicious, isFirstLoginAttempt };
  } catch (error) {
    console.error("Sign in error:", error);
    throw error;
  }
};

export const signUp = async (email: string, password: string, displayName?: string): Promise<FirebaseUser> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;
  
  // Update display name if provided
  if (displayName) {
    await updateProfile(firebaseUser, {
      displayName: displayName
    });
  }
  
  await createUserProfile(firebaseUser);
  
  // Send verification email immediately after creation
  // Keep the user signed in after creation so sendEmailVerification can be called
  await sendEmailVerification(firebaseUser);
  
  // IMPORTANT: DO NOT sign the user out immediately after sending verification email here.
  // The ProtectedRoute will handle restricting access until verified.
  // The login form will manage the state transition to the verification message view.

  return firebaseUser;
};

export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

// Re-add sendVerificationEmail function so it can be called from LoginForm
export const sendVerificationEmail = async (): Promise<void> => {
  console.log("Attempting to send verification email...");
  if (auth.currentUser) {
    console.log("auth.currentUser is present. Sending email...");
    await sendEmailVerification(auth.currentUser);
    console.log("sendEmailVerification called.");
  } else {
    console.error("No authenticated user to send verification email.");
    throw new Error("No authenticated user to send verification email.");
  }
};

export const verifyEmail = async (code: string): Promise<void> => {
  await applyActionCode(auth, code);
};

export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    return methods.length > 0;
  } catch (error) {
    console.error("Error checking email:", error);
    return false;
  }
};

export const requestPasswordReset = async (email: string): Promise<void> => {
  await firebaseSendPasswordResetEmail(auth, email);
};

export const handleGoogleSignIn = async (): Promise<{ isNewUser: boolean; user: FirebaseUser }> => {
  const provider = new GoogleAuthProvider();
  try {
    const result: UserCredential = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;
    const isNewUser = (result as any).additionalUserInfo?.isNewUser ?? false;

    if (isNewUser) {
      await createUserProfile(firebaseUser);
    } else {
      // For existing users, preserve their original profile picture
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.photoURL) {
          // Update the user's profile to keep their original photo
          await updateProfile(firebaseUser, {
            photoURL: userData.photoURL
          });
        }
      }
    }
    return { isNewUser, user: firebaseUser };
  } catch (error: any) {
    if (error.code === 'auth/account-exists-with-different-credential') {
      const email = error.customData.email;
      const pendingCred = error.credential;
      throw new Error(`An account already exists with this email using a different sign-in method. Please sign in with your existing method (${error.customData.providerId}) and link your Google account.`);
    }
    throw error; // Re-throw other errors
  }
};

// Function to link Google account after email/password sign-in
export const linkGoogleAccount = async (email: string, password?: string): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error("No authenticated user.");
  }

  const previousProviderData = auth.currentUser.providerData;

  const googleProvider = new GoogleAuthProvider();
  await (auth.currentUser as any).linkWithPopup(googleProvider);
};

export const handleFacebookSignIn = async (): Promise<{ isNewUser: boolean; user: FirebaseUser }> => {
  const provider = new FacebookAuthProvider();
   try {
    const result: UserCredential = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;
    const isNewUser = (result as any).additionalUserInfo?.isNewUser ?? false;

    if (isNewUser) {
      await createUserProfile(firebaseUser);
    }
    return { isNewUser, user: firebaseUser };
  } catch (error: any) {
     if (error.code === 'auth/account-exists-with-different-credential') {
      throw new Error(`An account already exists with this email using a different sign-in method. Please sign in with your existing method (${error.customData.providerId}) and link your Facebook account.`);
    }
    throw error; // Re-throw other errors
  }
};

export const handleAppleSignIn = async (): Promise<{ isNewUser: boolean; user: FirebaseUser }> => {
  const provider = new OAuthProvider('apple.com');
   try {
    const result: UserCredential = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;
    const isNewUser = (result as any).additionalUserInfo?.isNewUser ?? false;

    if (isNewUser) {
      await createUserProfile(firebaseUser);
    }
    return { isNewUser, user: firebaseUser };
  } catch (error: any) {
    if (error.code === 'auth/account-exists-with-different-credential') {
      throw new Error(`An account already exists with this email using a different sign-in method. Please sign in with your existing method (${error.customData.providerId}) and link your Apple account.`);
    }
    throw error; // Re-throw other errors
  }
};

export const createUserProfile = async (firebaseUser: FirebaseUser): Promise<void> => {
  console.log("Creating user profile for:", firebaseUser.uid);
  
  // Create user document
  const userRef = doc(db, 'users', firebaseUser.uid);
  await setDoc(userRef, {
    email: firebaseUser.email,
    firebaseUid: firebaseUser.uid,
    isAdmin: false,
    createdAt: serverTimestamp(),
    displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
    photoURL: firebaseUser.photoURL
  });

  // Create default settings
  const settingsRef = doc(db, 'settings', firebaseUser.uid);
  await setDoc(settingsRef, {
    userId: firebaseUser.uid,
    companyName: "Your Company",
    companyAddress: "123 Business Street\nCity, State 12345",
    companyPhone: "+1 (555) 123-4567",
    companyEmail: firebaseUser.email || "",
    invoicePrefix: "INV-",
    nextInvoiceNumber: 1,
    defaultVat: "0",
    paymentTerms: 30,
    updatedAt: serverTimestamp()
  });

  console.log("User profile and settings created successfully");
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
        isAdmin: data.isAdmin || false,
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

export const reloadCurrentUser = async (): Promise<void> => {
  if (auth.currentUser) {
    await auth.currentUser.reload();
    console.log("User reloaded:", auth.currentUser);
  } else {
    console.warn("No current user to reload.");
  }
};

export const checkSuspiciousSignIn = async (user: FirebaseUser): Promise<boolean> => {
  try {
    if (!user?.uid) {
      console.error("No user UID provided for suspicious sign-in check");
      return false;
    }

    // Get current IP
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    const currentIP = data.ip;
    console.log("Current IP:", currentIP);

    // Get user's last known IP from Firestore
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log("No existing user document, creating new one");
      // First time user, store current IP
      const userData = {
        lastKnownIP: currentIP,
        lastSignIn: serverTimestamp(),
        emailVerified: user.emailVerified,
        isAdmin: false,
        email: user.email,
        firebaseUid: user.uid,
        createdAt: serverTimestamp()
      };
      
      await setDoc(userRef, userData);
      return false;
    }

    const userData = userDoc.data();
    const lastKnownIP = userData?.lastKnownIP;

    // Update last known IP and sign-in time
    const updateData = {
      lastKnownIP: currentIP,
      lastSignIn: serverTimestamp(),
      emailVerified: user.emailVerified
    };

    await updateDoc(userRef, updateData);

    // If no last known IP, this is first sign-in
    if (!lastKnownIP) {
      console.log("No last known IP found, treating as first sign-in");
      return false;
    }

    // Check if IP has changed
    const isSuspicious = lastKnownIP !== currentIP;
    
    if (isSuspicious) {
      console.log(`Suspicious sign-in detected for user ${user.uid}:`);
      console.log(`Previous IP: ${lastKnownIP}`);
      console.log(`Current IP: ${currentIP}`);
    }

    return isSuspicious;
  } catch (error) {
    console.error('Error checking suspicious sign-in:', error);
    // Return false on error to prevent blocking legitimate users
    return false;
  }
};

export const recordLoginAttempt = async (userId: string, ip: string, deviceInfo: string): Promise<void> => {
  try {
    console.log("Creating login history document for user:", userId);
    const loginHistoryRef = collection(db, 'users', userId, 'loginHistory');
    const docRef = doc(loginHistoryRef);
    console.log("Document reference created:", docRef.id);
    
    const loginData = {
      ip,
      timestamp: serverTimestamp(),
      deviceInfo,
      isVerified: false
    };
    console.log("Login data to be saved:", loginData);
    
    await setDoc(docRef, loginData);
    console.log("Login history document created successfully");
  } catch (error) {
    console.error("Error recording login attempt:", error);
    throw error; // Re-throw to handle in the calling function
  }
};

export const markLoginAsVerified = async (userId: string, ip: string): Promise<void> => {
  try {
    console.log("Marking login as verified for user:", userId, "IP:", ip);
    const loginHistoryRef = collection(db, 'users', userId, 'loginHistory');
    const q = query(
      loginHistoryRef,
      where('ip', '==', ip),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const loginDoc = querySnapshot.docs[0];
      console.log("Found login document to verify:", loginDoc.id);
      const loginData = loginDoc.data();
      await setDoc(doc(loginHistoryRef, loginDoc.id), {
        ...loginData,
        isVerified: true,
        verifiedAt: serverTimestamp()
      });
      console.log("Login marked as verified with timestamp");
    } else {
      console.log("No matching login document found to verify");
      // Create a new verified login record if none exists
      await setDoc(doc(loginHistoryRef), {
        ip,
        timestamp: serverTimestamp(),
        deviceInfo: `${navigator.userAgent} - ${navigator.platform}`,
        isVerified: true,
        verifiedAt: serverTimestamp()
      });
      console.log("Created new verified login record");
    }
  } catch (error) {
    console.error("Error marking login as verified:", error);
    throw error;
  }
};

export const clearLoginHistory = async (userId: string): Promise<void> => {
  try {
    console.log("Clearing login history for user:", userId);
    const loginHistoryRef = collection(db, 'users', userId, 'loginHistory');
    const q = query(loginHistoryRef);
    const querySnapshot = await getDocs(q);
    
    // Delete all documents in the collection
    const deletePromises = querySnapshot.docs.map(doc => 
      setDoc(doc.ref, { _deleted: true })
    );
    
    await Promise.all(deletePromises);
    console.log("Login history cleared successfully");
  } catch (error) {
    console.error("Error clearing login history:", error);
    throw error;
  }
};

export async function isIPVerified(userId: string, ip: string): Promise<boolean> {
  try {
    console.log("Checking if IP is verified:", ip);
    
    // Query the login history for this IP
    const loginHistoryRef = collection(db, 'users', userId, 'loginHistory');
    const q = query(
      loginHistoryRef,
      where('ip', '==', ip),
      where('isVerified', '==', true),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    const isVerified = !querySnapshot.empty;
    
    console.log("IP verification status:", isVerified);
    return isVerified;
  } catch (error) {
    console.error("Error checking IP verification status:", error);
    return false;
  }
}