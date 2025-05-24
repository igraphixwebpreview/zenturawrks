# Firebase Database Setup Guide

This guide will help you set up Firebase for your Invoice Generator project. Follow these steps to migrate from in-memory storage to a persistent Firebase Firestore database.

## Prerequisites

1. A Google account
2. Access to the [Firebase Console](https://console.firebase.google.com/)

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "invoice-generator")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Set Up Firestore Database

1. In your Firebase project console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development) or "Start in production mode"
4. Select a location for your database (choose closest to your users)
5. Click "Done"

## Step 3: Configure Authentication

1. Go to "Authentication" in the Firebase console
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable "Email/Password" authentication
5. Optionally enable other providers (Google, etc.)

## Step 4: Get Your Firebase Configuration

1. Go to Project Settings (gear icon in the sidebar)
2. Scroll down to "Your apps" section
3. Click "Add app" and select the Web platform (</>)
4. Register your app with a nickname (e.g., "Invoice Generator Web")
5. Copy the configuration values

## Step 5: Configure Environment Variables

1. Copy `.env.example` to `.env`
2. Fill in your Firebase configuration values:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
```

## Step 6: Set Up Firestore Security Rules

In the Firebase console, go to Firestore Database > Rules and update with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can only access their own invoices
    match /invoices/{invoiceId} {
      allow read, write: if request.auth != null && 
        resource.data.createdBy == request.auth.uid;
    }
    
    // Users can only access their own clients
    match /clients/{clientId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Email templates are shared (read-only for all authenticated users)
    match /email_templates/{templateId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null; // Adjust based on your needs
    }
    
    // Settings are shared
    match /settings/{settingId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Step 7: Enable Firebase Storage Mode

The application is set up to automatically detect if Firebase credentials are available and switch to Firebase storage. Once you've configured the environment variables, restart the application and it will use Firebase instead of in-memory storage.

## Collection Structure

The application will automatically create these Firestore collections:

- `users` - User profiles and authentication data
- `invoices` - Invoice documents with all details
- `clients` - Client information
- `email_templates` - Email templates for different invoice types
- `settings` - Application settings

## Benefits of Firebase Integration

✅ **Persistent Data**: Your data persists across sessions and deployments
✅ **Real-time Updates**: Multiple users can collaborate in real-time
✅ **Scalability**: Automatically scales with your user base
✅ **Security**: Built-in authentication and security rules
✅ **Backup**: Automatic backups and data recovery
✅ **Multi-device**: Access your data from any device

## Troubleshooting

### Common Issues:

1. **"Firebase: Error (auth/invalid-api-key)"**
   - Check that your API key is correct in the `.env` file
   - Ensure the API key hasn't been restricted in the Firebase console

2. **"Permission denied" errors**
   - Check your Firestore security rules
   - Ensure the user is properly authenticated

3. **"Project not found"**
   - Verify your project ID is correct
   - Make sure the project exists in the Firebase console

### Getting Help:

- Check the browser console for detailed error messages
- Verify all environment variables are set correctly
- Ensure your Firebase project has Firestore enabled

## Next Steps

Once Firebase is configured, your invoice generator will have:
- Persistent data storage
- User authentication
- Real-time synchronization
- Scalable infrastructure

Your existing data and functionality will work exactly the same, but now with the power of Firebase backing it up!