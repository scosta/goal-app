# Firebase Authentication Setup Guide

This guide explains how to set up Firebase Authentication for the Goal App.

## Overview

The application uses Firebase Authentication for user management. This includes:
- User registration (email/password)
- User login
- Password reset
- JWT token verification on the backend

## Frontend Setup

### 1. Firebase Configuration

Create a `.env` file in the project root with your Firebase configuration:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# For local development with emulator
VITE_USE_FIREBASE_EMULATOR=true
VITE_FIREBASE_AUTH_EMULATOR_HOST=http://localhost:9099
```

### 2. Get Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Go to Project Settings > General
4. Scroll down to "Your apps" and click the web icon (`</>`)
5. Copy the configuration values

### 3. Enable Authentication Methods

1. In Firebase Console, go to Authentication > Sign-in method
2. Enable "Email/Password" provider
3. Optionally enable other providers (Google, etc.)

## Backend Setup

### 1. Service Account (Production)

For production, you need a Firebase service account:

1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate new private key"
3. Save the JSON file securely
4. Set the environment variable:

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

Or add to your `.env` file:
```bash
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

### 2. Development Mode

For local development, you can:

**Option A: Use a test service account**
- Create a separate Firebase project for testing
- Use its service account key locally

**Option B: Use Firebase Auth Emulator**
- The frontend can connect to the emulator
- The backend will need special handling (see below)

**Note:** Firebase Admin SDK doesn't natively support the Auth emulator. For local development, you may want to:
1. Use a test Firebase project with a service account
2. Or implement a development mode that bypasses token verification (not recommended for production)

## Running with Emulators

### Start Firebase Emulators

```bash
firebase emulators:start --project test-project
```

This will start:
- Firestore emulator on port 8081
- Auth emulator on port 9099
- Emulator UI on port 4000

### Frontend Configuration

Set in `.env`:
```bash
VITE_USE_FIREBASE_EMULATOR=true
VITE_FIREBASE_AUTH_EMULATOR_HOST=http://localhost:9099
```

### Backend Configuration

The backend will automatically detect if Firebase Auth is available. If initialization fails, it will log a warning and continue without authentication (development mode only).

## Testing Authentication

### 1. Register a User

1. Start the application
2. Navigate to `/register`
3. Fill in the registration form
4. Submit to create an account

### 2. Login

1. Navigate to `/login`
2. Enter your email and password
3. You'll be redirected to the home page

### 3. Access Protected Routes

All routes except `/login`, `/register`, and `/forgot-password` are protected. You must be logged in to access them.

## API Usage

### Authenticated Requests

All API requests automatically include the Firebase ID token in the `Authorization` header:

```
Authorization: Bearer <firebase-id-token>
```

The backend middleware verifies this token and extracts the user ID, which is then available in handlers via:

```go
uid := c.GetString("uid")
```

## Troubleshooting

### "Authorization header required"

- Make sure you're logged in on the frontend
- Check that the token is being sent in requests (check browser DevTools > Network)

### "Invalid or expired token"

- The token may have expired - try logging out and back in
- Check that Firebase Auth is properly initialized on the backend
- Verify your service account credentials (production)

### Backend can't initialize Firebase Auth

- Check that `GOOGLE_APPLICATION_CREDENTIALS` is set correctly
- Verify the service account JSON file is valid
- For development, the app will continue without auth (with warnings)

### Emulator not working

- Make sure the Firebase emulators are running
- Check that `VITE_USE_FIREBASE_EMULATOR=true` is set
- Verify the emulator host URL is correct

## Security Notes

1. **Never commit service account keys to version control**
2. **Use environment variables for all sensitive configuration**
3. **In production, always use proper Firebase service account credentials**
4. **The Auth emulator is for development only - never use it in production**

## Next Steps

- Add social login providers (Google, Facebook, etc.)
- Implement email verification
- Add role-based access control (RBAC)
- Implement refresh token rotation

