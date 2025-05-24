// Simple script to initialize Firestore collections
// Run this in your browser console on the app page

const initializeDatabase = async () => {
  try {
    console.log('Initializing database collections...');
    
    // Create a test user document
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        firebaseUid: 'test-uid-' + Date.now(),
        isAdmin: false
      })
    });
    
    if (response.ok) {
      console.log('✅ Database initialized successfully!');
    } else {
      console.error('❌ Failed to initialize database:', await response.text());
    }
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  }
};

// Run the initialization
initializeDatabase();