import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { storage, auth } from "./firebase";

export const uploadProfilePicture = async (file: File): Promise<string> => {
  if (!auth.currentUser) {
    throw new Error("No authenticated user");
  }

  try {
    console.log("Starting upload process...");
    console.log("User:", auth.currentUser.uid);
    console.log("File details:", { name: file.name, size: file.size, type: file.type });
    
    // Create a unique filename with timestamp
    const timestamp = Date.now();
    const fileName = `profile-pictures/${auth.currentUser.uid}/${timestamp}-${file.name}`;
    console.log("Upload path:", fileName);
    
    // Create a storage reference
    const storageRef = ref(storage, fileName);
    console.log("Storage reference created");
    
    // Upload the file
    console.log("Starting file upload...");
    const snapshot = await uploadBytes(storageRef, file);
    console.log("File uploaded successfully:", snapshot.metadata);
    
    // Get the download URL
    console.log("Getting download URL...");
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log("Download URL obtained:", downloadURL);
    
    // Update the user's profile with the new photo URL
    console.log("Updating user profile...");
    await updateProfile(auth.currentUser, {
      photoURL: downloadURL
    });
    console.log("Profile updated successfully");
    
    return downloadURL;
  } catch (error) {
    console.error("Detailed upload error:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
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