import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './use-auth';
import { subscribeToProfileUpdates, type UserProfile, getStoredProfilePicture, getProfilePictureUrl } from '@/lib/profile-upload';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Cache for profile picture URLs
const profilePictureCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

export function useProfilePicture() {
  const { user } = useAuth();
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [profileMetadata, setProfileMetadata] = useState<UserProfile['photoMetadata'] | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Refs must be declared before any hooks that might use them
  const retryCount = useRef(0);
  const subscriptionRef = useRef<(() => void) | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current();
      subscriptionRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const getCachedProfilePicture = useCallback(async (photoURL: string): Promise<string> => {
    const cached = profilePictureCache.get(photoURL);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_DURATION) {
      return cached.url;
    }

    try {
      const url = await getProfilePictureUrl({ photoURL });
      if (isMounted.current) {
        profilePictureCache.set(photoURL, { url, timestamp: now });
      }
      return url;
    } catch (error) {
      console.error("Error getting profile picture URL:", error);
      throw error;
    }
  }, []);

  const setupProfileSubscription = useCallback(async () => {
    if (!user?.uid) {
      console.log("useProfilePicture: No user UID, returning.");
      setProfilePictureUrl(null);
      setProfileMetadata(null);
      setProfile(null);
      setIsLoading(false);
      return;
    }

    cleanup();

    console.log("useProfilePicture: User UID available, setting up subscription.", user.uid);

    try {
      console.log("useProfilePicture: Initializing profile.");
      const profileRef = doc(db, "profiles", user.uid);
      
      subscriptionRef.current = onSnapshot(profileRef, 
        async (doc) => {
          if (!isMounted.current) return;

          if (doc.exists()) {
            const data = doc.data();
            setProfile(data as UserProfile);
            
            if (data.photoURL) {
              try {
                const url = await getCachedProfilePicture(data.photoURL);
                if (!isMounted.current) return;
                
                console.log("useProfilePicture: profilePictureUrl state changed:", url);
                setProfilePictureUrl(url);
                setProfileMetadata(data.photoMetadata || null);
                retryCount.current = 0; // Reset retry count on success
              } catch (err) {
                if (!isMounted.current) return;
                
                console.error("Error getting profile picture URL:", err);
                if (retryCount.current < MAX_RETRIES) {
                  retryCount.current++;
                  console.log(`Retrying profile picture load (attempt ${retryCount.current}/${MAX_RETRIES})...`);
                  retryTimeoutRef.current = setTimeout(setupProfileSubscription, RETRY_DELAY);
                } else {
                  setError(err as Error);
                  setProfilePictureUrl(null);
                  setProfileMetadata(null);
                }
              }
            } else {
              setProfilePictureUrl(null);
              setProfileMetadata(null);
            }
          } else {
            setProfile(null);
            setProfilePictureUrl(null);
            setProfileMetadata(null);
          }
          setIsLoading(false);
        },
        (err) => {
          if (!isMounted.current) return;
          
          console.error("Error in profile subscription:", err);
          setError(err);
          setIsLoading(false);
        }
      );
    } catch (err) {
      if (!isMounted.current) return;
      
      console.error("Error setting up profile subscription:", err);
      setError(err as Error);
      setIsLoading(false);
    }
  }, [user?.uid, getCachedProfilePicture, cleanup]);

  // Setup subscription
  useEffect(() => {
    setupProfileSubscription();
    return () => {
      isMounted.current = false;
      cleanup();
    };
  }, [setupProfileSubscription, cleanup]);

  // Debug logging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("useProfilePicture: profilePictureUrl state changed:", profilePictureUrl);
    }
  }, [profilePictureUrl]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("useProfilePicture: profile state changed:", profile);
    }
  }, [profile]);

  return {
    profilePicture: profilePictureUrl,
    profileMetadata,
    profile,
    isLoading,
    error
  };
} 