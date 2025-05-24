import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { storage, auth } from "./firebase";

export const uploadProfilePicture = async (file: File): Promise<string> => {
  if (!auth.currentUser) {
    throw new Error("No authenticated user");
  }

  try {
    // Create a unique filename with timestamp
    const timestamp = Date.now();
    const fileName = `profile-pictures/${auth.currentUser.uid}/${timestamp}-${file.name}`;
    
    // Create a storage reference
    const storageRef = ref(storage, fileName);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Update the user's profile with the new photo URL
    await updateProfile(auth.currentUser, {
      photoURL: downloadURL
    });
    
    return downloadURL;
  } catch (error) {
    console.error("Error uploading profile picture:", error);
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