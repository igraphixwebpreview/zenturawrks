import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface DefaultSettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  companyLogo?: string;
  taxId?: string;
  bankDetails?: string;
  paymentTerms?: string;
  notes?: string;
  currency: string;
  language: string;
  dateFormat: string;
  timezone: string;
}

const DEFAULT_SETTINGS: DefaultSettings = {
  companyName: '',
  companyAddress: '',
  companyPhone: '',
  companyEmail: '',
  companyWebsite: '',
  currency: 'USD',
  language: 'en',
  dateFormat: 'MM/DD/YYYY',
  timezone: 'UTC'
};

export function useDefaultSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<DefaultSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeSettings = async () => {
      if (!user?.uid) {
        setSettings(DEFAULT_SETTINGS);
        setIsLoading(false);
        return;
      }

      try {
        const settingsRef = doc(db, 'settings', user.uid);
        
        // First try to get the document
        const docSnap = await getDoc(settingsRef);
        
        if (!docSnap.exists()) {
          // If it doesn't exist, create it with default settings
          await setDoc(settingsRef, DEFAULT_SETTINGS);
          setSettings(DEFAULT_SETTINGS);
        } else {
          // If it exists, set the settings from the document
          setSettings(docSnap.data() as DefaultSettings);
        }

        // Then set up the real-time listener
        unsubscribe = onSnapshot(settingsRef, 
          (doc) => {
            if (doc.exists()) {
              setSettings(doc.data() as DefaultSettings);
            }
            setIsLoading(false);
          },
          (err) => {
            console.error('Error in settings subscription:', err);
            setError(err);
            setIsLoading(false);
          }
        );
      } catch (err) {
        console.error('Error initializing settings:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    };

    initializeSettings();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.uid]);

  const updateSettings = async (newSettings: Partial<DefaultSettings>) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      const settingsRef = doc(db, 'settings', user.uid);
      await setDoc(settingsRef, { ...settings, ...newSettings }, { merge: true });
    } catch (err) {
      console.error('Error updating settings:', err);
      setError(err as Error);
      throw err;
    }
  };

  return {
    settings,
    isLoading,
    error,
    updateSettings
  };
} 