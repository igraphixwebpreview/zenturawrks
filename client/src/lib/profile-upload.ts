import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { storage, auth, db } from "./firebase";

interface UploadResult {
  url: string;
  path: string;
}

interface ImageDimensions {
  width: number;
  height: number;
}

export interface UserProfile {
  photoURL: string | null;
  photoPath: string | null;
  displayName: string | null;
  lastUpdated: number;
  photoMetadata?: {
    width: number;
    height: number;
    size: number;
    format: string;
  };
  email: string | null;
  isAdmin?: boolean;
  createdAt?: number | Date | null;
}

const MAX_IMAGE_DIMENSION = 1024; // Maximum width/height for profile pictures
const COMPRESSION_QUALITY = 0.8; // JPEG compression quality (0-1)

// Browser compatibility checks
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
const isIE = /MSIE|Trident/.test(navigator.userAgent);

// Check if browser supports modern image features
const supportsModernImageFeatures = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    return !!(ctx && typeof ctx.drawImage === 'function' && typeof canvas.toBlob === 'function');
  } catch (e) {
    return false;
  }
};

// Check if browser supports WebP
const supportsWebP = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !window.createImageBitmap) return false;
  
  try {
    const webpData = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
    const blob = await fetch(webpData).then(r => r.blob());
    await createImageBitmap(blob);
    return true;
  } catch (e) {
    return false;
  }
};

// Get the best supported image format for the browser
const getBestImageFormat = async (): Promise<string> => {
  try {
    if (await supportsWebP()) return 'image/webp';
  } catch (e) {
    console.warn('WebP support check failed, falling back to JPEG');
  }
  
  // Fallback to JPEG for all browsers
  return 'image/jpeg';
};

const optimizeImage = async (file: File): Promise<{ blob: Blob; metadata: UserProfile['photoMetadata'] }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        img.src = e.target?.result as string;
        
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions while maintaining aspect ratio
          if (width > height && width > MAX_IMAGE_DIMENSION) {
            height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
            width = MAX_IMAGE_DIMENSION;
          } else if (height > MAX_IMAGE_DIMENSION) {
            width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
            height = MAX_IMAGE_DIMENSION;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Failed to get canvas context');
          }
          
          // Handle transparency differently based on browser
          if (isSafari || isIE) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
          }
          
          // Draw the image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Get the best format for the browser
          const format = await getBestImageFormat();
          
          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve({
                  blob,
                  metadata: {
                    width,
                    height,
                    size: blob.size,
                    format: format.split('/')[1]
                  }
                });
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            format,
            COMPRESSION_QUALITY
          );
        };
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(img.src);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export const uploadProfilePicture = async (file: File): Promise<UploadResult> => {
  if (!auth.currentUser) {
    throw new Error("No authenticated user");
  }

  try {
    // Check browser compatibility
    if (!supportsModernImageFeatures()) {
      throw new Error("Your browser doesn't support modern image features. Please use a modern browser.");
    }

    // Validate the file first
    validateImageFile(file);

    // Optimize the image
    const { blob, metadata } = await optimizeImage(file);
    const format = await getBestImageFormat();
    const compressedFile = new File([blob], file.name, {
      type: format,
      lastModified: Date.now(),
    });

    // Create a unique filename with timestamp to prevent caching issues
    const timestamp = Date.now();
    const extension = format.split('/')[1];
    const fileName = `${auth.currentUser.uid}_${timestamp}.${extension}`;
    const storagePath = `profile-pictures/${fileName}`;
    
    // Upload file to Firebase Storage
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, compressedFile);
    const downloadURL = await getDownloadURL(storageRef);

    // Update the user's profile with the new photoURL
    await updateProfile(auth.currentUser, { photoURL: downloadURL });

    // Update Firestore user document
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userData: Partial<UserProfile> = {
      photoURL: downloadURL,
      photoPath: storagePath,
      lastUpdated: timestamp,
      photoMetadata: metadata
    };
    await setDoc(userRef, userData, { merge: true });

    // Force refresh the auth token to ensure the new photoURL is available
    await auth.currentUser.getIdToken(true);

    return {
      url: downloadURL,
      path: storagePath
    };
  } catch (error) {
    console.error("Upload error:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to upload profile picture: ${error.message}`);
    }
    throw new Error("Failed to upload profile picture");
  }
};

export const deleteProfilePicture = async (storagePath: string): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error("No authenticated user");
  }

  try {
    // Delete the file from Firebase Storage
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);

    // Update the user's profile to remove the photoURL
    await updateProfile(auth.currentUser, { photoURL: null });

    // Update Firestore user document
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userData: Partial<UserProfile> = {
      photoURL: null,
      photoPath: null,
      lastUpdated: Date.now()
    };
    await updateDoc(userRef, userData);
  } catch (error) {
    console.error("Delete error:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to delete profile picture: ${error.message}`);
    }
    throw new Error("Failed to delete profile picture");
  }
};

export const subscribeToProfileUpdates = (
  userId: string,
  callback: (profile: UserProfile) => void
): (() => void) => {
  const userRef = doc(db, 'users', userId);
  
  // Set up real-time listener
  const unsubscribe = onSnapshot(userRef, async (doc) => {
    if (doc.exists()) {
      const data = doc.data() as UserProfile;
      console.log("Profile data received:", data);
      
      // If we have a photoURL in Firestore, use it
      if (data.photoURL) {
        callback(data);
        
        // Update auth profile if needed
        if (auth.currentUser && data.photoURL !== auth.currentUser.photoURL) {
          await updateProfile(auth.currentUser, { photoURL: data.photoURL });
        }
      } else if (auth.currentUser?.photoURL) {
        // If no photoURL in Firestore but we have one in auth, update Firestore
        const updatedData = {
          ...data,
          photoURL: auth.currentUser.photoURL,
          lastUpdated: Date.now()
        };
        await setDoc(userRef, updatedData, { merge: true });
        callback(updatedData);
      } else {
        // No photoURL anywhere, just callback with existing data
        callback(data);
      }
    } else {
      console.log("No profile data found for user:", userId);
      // If we have auth data but no Firestore doc, create it
      if (auth.currentUser) {
        const initialData: UserProfile = {
          photoURL: auth.currentUser.photoURL,
          photoPath: null,
          displayName: auth.currentUser.displayName,
          lastUpdated: Date.now(),
          email: auth.currentUser.email,
        };
        await setDoc(userRef, initialData);
        callback(initialData);
      }
    }
  }, (error) => {
    console.error("Error in profile subscription:", error);
  });

  return unsubscribe;
};

export const getStoredProfilePicture = async (): Promise<string | null> => {
  if (!auth.currentUser) {
    return null;
  }

  try {
    // First check Firestore for the most up-to-date information
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data() as UserProfile;
      
      // If Firestore has a photoURL, use it
      if (data.photoURL) {
        // Update auth profile if needed
        if (data.photoURL !== auth.currentUser.photoURL) {
          await updateProfile(auth.currentUser, { photoURL: data.photoURL });
        }
        return data.photoURL;
      }
    }
    
    // If no photoURL in Firestore but we have one in auth, update Firestore
    if (auth.currentUser.photoURL) {
      const userData: Partial<UserProfile> = {
        photoURL: auth.currentUser.photoURL,
        lastUpdated: Date.now()
      };
      await setDoc(userRef, userData, { merge: true });
      return auth.currentUser.photoURL;
    }
    
    // No photoURL anywhere
    return null;
  } catch (error) {
    console.error("Error getting stored profile picture:", error);
    return auth.currentUser.photoURL;
  }
};

export const updateDisplayName = async (displayName: string): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error("No authenticated user");
  }

  try {
    // Update the user's profile with the new display name
    await updateProfile(auth.currentUser, {
      displayName: displayName
    });

    // Update Firestore user document
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userData: Partial<UserProfile> = {
      displayName,
      lastUpdated: Date.now()
    };
    await setDoc(userRef, userData, { merge: true });
  } catch (error) {
    console.error("Error updating display name:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to update display name: ${error.message}`);
    }
    throw new Error("Failed to update display name");
  }
};

export const validateImageFile = (file: File): boolean => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Please select a valid image file (JPEG, PNG, GIF, or WebP)");
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    throw new Error("Image file must be smaller than 5MB");
  }

  return true;
};

export const getInitials = (name: string | null | undefined): string => {
  if (!name) return '?';
  
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export const getProfilePictureUrl = async ({ photoURL }: { photoURL: string | null }): Promise<string> => {
  if (!photoURL) return '';
  
  // If it's already a full URL, return it as is
  if (photoURL.startsWith('http://') || photoURL.startsWith('https://')) {
    return photoURL;
  }
  
  // If it's a Firebase Storage path, get the download URL
  if (photoURL.startsWith('gs://')) {
    try {
      const storageRef = ref(storage, photoURL.replace('gs://', ''));
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error getting download URL:', error);
      return '';
    }
  }
  
  return photoURL;
};