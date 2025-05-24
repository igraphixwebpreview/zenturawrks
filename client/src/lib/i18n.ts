// Simple internationalization system
export interface Translations {
  [key: string]: string;
}

export const translations: Record<string, Translations> = {
  en: {
    "app.title": "Invoice Generator",
    "onboarding.setup.title": "Set Up Your Invoice Generator",
    "onboarding.setup.subtitle": "Let's personalize your workspace in just a few steps",
    "profile.setup.title": "Set Up Your Profile",
    "profile.setup.subtitle": "Choose your preferred language and set up your professional profile",
    "profile.language": "Preferred Language",
    "profile.displayName": "Display Name",
    "profile.picture": "Profile Picture",
    "button.next": "Next",
    "button.back": "Back",
    "button.continue": "Continue",
    "button.launch": "Launch InvoiceGen"
  },
  es: {
    "app.title": "Generador de Facturas",
    "onboarding.setup.title": "Configura Tu Generador de Facturas",
    "onboarding.setup.subtitle": "Personalicemos tu espacio de trabajo en unos pocos pasos",
    "profile.setup.title": "Configura Tu Perfil",
    "profile.setup.subtitle": "Elige tu idioma preferido y configura tu perfil profesional",
    "profile.language": "Idioma Preferido",
    "profile.displayName": "Nombre Completo",
    "profile.picture": "Foto de Perfil",
    "button.next": "Siguiente",
    "button.back": "Atrás",
    "button.continue": "Continuar",
    "button.launch": "Lanzar InvoiceGen"
  },
  fr: {
    "app.title": "Générateur de Factures",
    "onboarding.setup.title": "Configurez Votre Générateur de Factures",
    "onboarding.setup.subtitle": "Personnalisons votre espace de travail en quelques étapes",
    "profile.setup.title": "Configurez Votre Profil",
    "profile.setup.subtitle": "Choisissez votre langue préférée et configurez votre profil professionnel",
    "profile.language": "Langue Préférée",
    "profile.displayName": "Nom Complet",
    "profile.picture": "Photo de Profil",
    "button.next": "Suivant",
    "button.back": "Retour",
    "button.continue": "Continuer",
    "button.launch": "Lancer InvoiceGen"
  },
  de: {
    "app.title": "Rechnungsgenerator",
    "onboarding.setup.title": "Richte Deinen Rechnungsgenerator Ein",
    "onboarding.setup.subtitle": "Lass uns deinen Arbeitsplatz in wenigen Schritten personalisieren",
    "profile.setup.title": "Richte Dein Profil Ein",
    "profile.setup.subtitle": "Wähle deine bevorzugte Sprache und richte dein professionelles Profil ein",
    "profile.language": "Bevorzugte Sprache",
    "profile.displayName": "Vollständiger Name",
    "profile.picture": "Profilbild",
    "button.next": "Weiter",
    "button.back": "Zurück",
    "button.continue": "Fortfahren",
    "button.launch": "InvoiceGen Starten"
  },
  ja: {
    "app.title": "請求書ジェネレーター",
    "onboarding.setup.title": "請求書ジェネレーターのセットアップ",
    "onboarding.setup.subtitle": "数ステップでワークスペースをカスタマイズしましょう",
    "profile.setup.title": "プロフィールの設定",
    "profile.setup.subtitle": "希望する言語を選択し、プロフェッショナルなプロフィールを設定してください",
    "profile.language": "希望言語",
    "profile.displayName": "表示名",
    "profile.picture": "プロフィール写真",
    "button.next": "次へ",
    "button.back": "戻る",
    "button.continue": "続行",
    "button.launch": "InvoiceGenを起動"
  }
};

let currentLanguage = 'en';

export function setLanguage(languageCode: string) {
  if (translations[languageCode]) {
    currentLanguage = languageCode;
    localStorage.setItem('app-language', languageCode);
  }
}

export function getCurrentLanguage(): string {
  return currentLanguage;
}

export function t(key: string): string {
  return translations[currentLanguage]?.[key] || translations['en'][key] || key;
}

// Initialize language from localStorage
const savedLanguage = localStorage.getItem('app-language');
if (savedLanguage && translations[savedLanguage]) {
  currentLanguage = savedLanguage;
}