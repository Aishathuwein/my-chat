# 🔥 FIREBASE SETUP INSTRUCTIONS

## Step 1: Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Name: `secure-chat-app`
4. Disable Google Analytics
5. Click "Create project"

## Step 2: Add Web App
1. Click "</>" (Web icon)
2. App nickname: `secure-chat-web`
3. Click "Register app"
4. COPY THE CONFIG (important!)

## Step 3: Enable Authentication
1. Left sidebar → "Build" → "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password"
5. Enable "Google" (optional)
6. Click "Save"

## Step 4: Enable Firestore Database
1. Left sidebar → "Build" → "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode"
4. Choose location nearest to you
5. Click "Enable"

## Step 5: Enable Storage
1. Left sidebar → "Build" → "Storage"
2. Click "Get started"
3. Click "Next" → "Done"

## Step 6: Add Authorized Domains
1. Authentication → Settings
2. Scroll to "Authorized domains"
3. Click "Add domain"
4. Add: `localhost`
5. Add: `your-app.vercel.app` (after deployment)

## Step 7: Update Firestore Rules
Go to Firestore → Rules tab, paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /chats/{chatId} {
      allow read, write: if request.auth != null;
    }
  }
}