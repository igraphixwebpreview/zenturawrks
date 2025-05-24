import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { storage, auth } from "./firebase";

export const uploadProfilePicture = async (file: File): Promise<string> => {
  if (!auth.currentUser) {
    throw new Error("No authenticated user");
  }

  try {
    console.log("Using local data URL approach for immediate results");
    
    // Convert file to data URL for immediate display
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const dataURL = e.target?.result as string;
          console.log("File converted to data URL successfully");
          
          // Update the user's profile with the data URL
          await updateProfile(auth.currentUser!, {
            photoURL: dataURL
          });
          console.log("Profile updated successfully with data URL");
          
          resolve(dataURL);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
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
  } catch (error) {
    console.error("Error updating display name:", error);
    throw error;
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