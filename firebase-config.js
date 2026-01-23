// Initialize Database with proper structure
async function initializeDatabase() {
    console.log('Initializing database...');
    
    // Create default collections if they don't exist
    const collections = ['messages', 'users', 'groups', 'groupMembers'];
    
    for (const collectionName of collections) {
        try {
            // Try to read from collection to see if it exists
            const snapshot = await db.collection(collectionName).limit(1).get();
            console.log(`✅ Collection "${collectionName}" exists`);
        } catch (error) {
            console.log(`📂 Creating collection: ${collectionName}`);
            // Collection will be created automatically on first write
        }
    }
    
    // Create global chat if it doesn't exist
    const globalGroupRef = db.collection('groups').doc('global');
    const globalGroup = await globalGroupRef.get();
    
    if (!globalGroup.exists) {
        await globalGroupRef.set({
            name: 'Global Chat',
            description: 'Public chat room for all users',
            createdBy: 'system',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            members: ['all'],
            isPublic: true
        });
        console.log('✅ Created global chat');
    }
    
    console.log('Database initialization complete');
}
// Fix: Enhanced presence tracking
function setupPresenceTracking() {
    if (!currentUser) return;
    
    const userRef = db.collection('users').doc(currentUser.uid);
    const connectedRef = db.ref('.info/connected');
    
    // Update user status when online
    userRef.update({
        isOnline: true,
        lastSeen: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        console.log('✅ User status set to online');
    }).catch(error => {
        console.error('❌ Error updating user status:', error);
    });
    
    // Set up disconnect handler
    const unsubscribe = auth.onAuthStateChanged((user) => {
        if (!user) {
            // User signed out
            userRef.update({
                isOnline: false,
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    });
    
    // Handle page/tab close
    window.addEventListener('beforeunload', () => {
        userRef.update({
            isOnline: false,
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        });
    });
    
    return unsubscribe;
}