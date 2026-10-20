# VINASTRA AEROSPACE — FIREBASE SETUP GUIDE

**Last Updated:** October 20, 2026  
**Status:** Configuration Required  

---

## OVERVIEW

VINASTRA AEROSPACE uses a **dual Firebase architecture** to separate client-facing and administrative operations:

1. **Firebase Integration A (Client-Side):** `vinastra-aerospace-clientside`
   - User authentication for students, researchers, investors
   - User profiles and university collaboration data
   - Research submissions and project tracking
   - **Status:** ✅ CONFIGURED (credentials provided)

2. **Firebase Integration B (Admin/Server-Side):** `vinastra-aerospace-serverside`
   - Mission Control Admin Portal
   - Privileged administrative operations
   - Confidential engineering data
   - Audit logging and security oversight
   - **Status:** ⚠️ REQUIRES SERVICE ACCOUNT

---

## PHASE 1: FIREBASE CONSOLE SETUP (BOTH PROJECTS)

### Step 1.1: Enable Authentication

For **both** Firebase projects:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select the project
3. Navigate to **Authentication** → **Sign-in method**
4. Enable the following providers:
   - ✅ **Email/Password** (required)
   - ✅ **Google** (optional, for SSO)
5. Under **Authorized domains**, add:
   - `vinastra-aerospace.vercel.app`
   - `localhost` (for development)
   - Any other custom domains

### Step 1.2: Create Firestore Database

For **both** Firebase projects:

1. Navigate to **Firestore Database**
2. Click **Create database**
3. Select **Production mode** (we'll add security rules later)
4. Choose a location close to your users (e.g., `asia-south1` for India)

### Step 1.3: Configure Firebase Storage

For **both** Firebase projects (optional but recommended):

1. Navigate to **Storage**
2. Click **Get started**
3. Select **Production mode**
4. Choose the same location as Firestore

---

## PHASE 2: CLIENT FIREBASE SETUP (`vinastra-aerospace-clientside`)

### Step 2.1: Configure Security Rules

1. In Firebase Console, go to **Firestore** → **Rules**
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection: Users can read/write their own profile
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Institutions: Public read, admin write
    match /institutions/{instId} {
      allow read: if request.auth != null;
      allow write: if false; // Only via Admin SDK
    }
    
    // Projects: Role-based access
    match /projects/{projectId} {
      allow read: if request.auth != null && 
        (resource.data.confidentialityLevel == 'PUBLIC' ||
         resource.data.confidentialityLevel == 'INVESTOR_SAFE' ||
         request.auth.uid in resource.data.members);
      allow write: if false; // Only via Admin SDK or Cloud Functions
    }
    
    // Research Submissions: Author and reviewers only
    match /researchSubmissions/{subId} {
      allow read: if request.auth != null && 
        (resource.data.authorUserId == request.auth.uid ||
         request.auth.token.role in ['ADMIN', 'RESEARCHER', 'RD_LEAD']);
      allow create: if request.auth != null && 
        request.resource.data.authorUserId == request.auth.uid;
      allow update: if request.auth != null && 
        (resource.data.authorUserId == request.auth.uid ||
         request.auth.token.role in ['ADMIN', 'RESEARCHER']);
    }
    
    // Documents: Access-level based restrictions
    match /documents/{docId} {
      allow read: if request.auth != null && 
        (resource.data.accessLevel == 'PUBLIC' ||
         (resource.data.accessLevel == 'INVESTOR_SAFE' && 
          request.auth.token.role == 'INVESTOR') ||
         request.auth.token.role in ['ADMIN', 'FOUNDER', 'ENGINEER']);
      allow write: if false; // Only via Admin SDK
    }
    
    // Audit logs: Admin only
    match /auditLogs/{logId} {
      allow read, write: if false; // Only via Admin SDK
    }
  }
}
```

3. Click **Publish**

### Step 2.2: Configure Storage Rules

1. Go to **Storage** → **Rules**
2. Add the following rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // User profile images
    match /users/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Document uploads
    match /documents/{documentId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.token.role in ['ADMIN', 'ENGINEER', 'RESEARCHER'];
    }
    
    // Research submissions
    match /research/{submissionId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

3. Click **Publish**

### Step 2.3: Create Initial Data

1. Go to **Firestore** → **Data**
2. Create the following collections manually (optional - can use seed data):

**Collection: `institutions`**

Document ID: `inst-iit-bombay`
```json
{
  "code": "IITB-SRL",
  "name": "IIT Bombay — Space Robotics & Autonomous Systems Lab",
  "domain": "iitb.ac.in",
  "type": "UNIVERSITY",
  "status": "ACTIVE",
  "createdAt": "2026-10-20T00:00:00Z"
}
```

---

## PHASE 3: ADMIN FIREBASE SETUP (`vinastra-aerospace-serverside`)

### Step 3.1: Create Service Account

**CRITICAL:** This step is required for the Mission Control Admin Portal to function.

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `vinastra-aerospace-serverside`
3. Navigate to **Project Settings** → **Service accounts**
4. Click **Generate new private key**
5. ⚠️ **SAVE THIS FILE SECURELY** - It contains sensitive credentials
6. **NEVER commit this file to git or share it publicly**

### Step 3.2: Extract Credentials

From the downloaded JSON file, extract the following values:

- `project_id` → `FIREBASE_ADMIN_PROJECT_ID`
- `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`
- `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY`

### Step 3.3: Set Environment Variables

**For Local Development:**

Create a `.env` file in the project root (already in `.gitignore`):

```bash
# Server Configuration
PORT=4174
NODE_ENV=development
JWT_SECRET=your-secure-random-string-here

# Firebase Admin (Server-Side Only)
FIREBASE_ADMIN_PROJECT_ID=vinastra-aerospace-serverside
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@vinastra-aerospace-serverside.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Email Service (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**For Vercel Deployment:**

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable from above
4. For `FIREBASE_ADMIN_PRIVATE_KEY`, paste the entire key including newlines as `\n`

### Step 3.4: Configure Admin Firestore Security Rules

1. In Firebase Console for `vinastra-aerospace-serverside`
2. Go to **Firestore** → **Rules**
3. Add the following rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // All collections require admin authentication via Admin SDK
    // These rules are intentionally restrictive
    // Server-side code bypasses these rules when using Admin SDK
    
    match /{document=**} {
      allow read, write: if false; // All access via Admin SDK only
    }
  }
}
```

**Note:** The Admin SDK bypasses these rules when authenticated with a service account. These restrictive rules provide defense-in-depth.

### Step 3.5: Enable Required APIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `vinastra-aerospace-serverside`
3. Navigate to **APIs & Services** → **Library**
4. Enable the following APIs:
   - ✅ Firebase Admin SDK API
   - ✅ Cloud Firestore API
   - ✅ Firebase Rules API (optional)
   - ✅ Cloud Storage API (if using Firebase Storage)

---

## PHASE 4: SECURITY CONFIGURATION

### Step 4.1: Restrict API Keys

**For Client Firebase (`vinastra-aerospace-clientside`):**

1. Go to **Project Settings** → **General**
2. Scroll down to **Your apps**
3. Find your web app and click the settings gear
4. Under **API restrictions**:
   - Select **HTTP referrers**
   - Add allowed domains:
     - `vinastra-aerospace.vercel.app/*`
     - `localhost/*`
     - `*.vercel.app/*` (if needed for preview deployments)
5. Under **API restrictions**:
   - Select **Restrict key**
   - Enable only: Firebase Services, Cloud Firestore, Firebase Authentication

### Step 4.2: Configure Authorized Domains

For both projects:

1. Go to **Authentication** → **Settings** → **Authorized domains**
2. Add all domains where the app will be hosted:
   - `vinastra-aerospace.vercel.app`
   - `localhost`
   - Any custom domains

---

## PHASE 5: TESTING & VERIFICATION

### Step 5.1: Test Client Firebase Integration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:4174/login/`

3. Try to create a new account:
   - Fill in the registration form
   - Check Firebase Console → Authentication → Users for the new user
   - Check Firebase Console → Firestore → `users` collection for the profile

4. If you see an error "configuration-not-found":
   - Ensure Email/Password auth is enabled in Firebase Console
   - Check authorized domains

### Step 5.2: Test Admin Firebase Integration

1. Set the environment variables (see Step 3.3)

2. Add a test endpoint to verify admin SDK:
   ```javascript
   // In backend/api.js, add a test endpoint
   if (pathname === '/api/admin/test' && method === 'GET') {
     try {
       const { checkAdminStatus } = await import('../src/lib/firebase/admin.js');
       const status = checkAdminStatus();
       return sendJson(response, 200, status);
     } catch (error) {
       return sendJson(response, 500, { error: error.message });
     }
   }
   ```

3. Call the endpoint:
   ```bash
   curl http://localhost:4174/api/admin/test
   ```

4. Expected response:
   ```json
   {
     "isInitialized": true,
     "hasError": false,
     "hasCredentials": true,
     "projectId": "vinastra-aerospace-serverside"
   }
   ```

---

## PHASE 6: PRODUCTION DEPLOYMENT CHECKLIST

Before deploying to production, ensure:

### Client Firebase (`vinastra-aerospace-clientside`)
- [ ] Email/Password authentication enabled
- [ ] Firestore database created
- [ ] Storage bucket configured
- [ ] Security rules deployed (not in test mode)
- [ ] API key restricted to authorized domains
- [ ] Authorized domains configured

### Admin Firebase (`vinastra-aerospace-serverside`)
- [ ] Service account created
- [ ] Private key secured (not in git)
- [ ] Environment variables set in Vercel
- [ ] Firestore database created
- [ ] Restrictive security rules deployed
- [ ] Required APIs enabled in Google Cloud

### Application Code
- [ ] `src/lib/firebase/client.js` properly configured
- [ ] `src/lib/firebase/admin.js` properly configured
- [ ] Environment variables documented in `.env.example`
- [ ] No credentials hardcoded in source code
- [ ] No service account key committed to git

---

## TROUBLESHOOTING

### Issue: "Firebase: Error (auth/configuration-not-found)"

**Cause:** Email/Password authentication not enabled  
**Solution:** Enable in Firebase Console → Authentication → Sign-in method

### Issue: "Firebase: Error (auth/unauthorized-domain)"

**Cause:** Domain not in authorized domains list  
**Solution:** Add domain in Firebase Console → Authentication → Settings → Authorized domains

### Issue: "Missing or insufficient permissions" (Firestore)

**Cause:** Security rules blocking access  
**Solution:** 
- Check Firestore rules in Firebase Console
- Ensure user is authenticated before accessing data
- Verify the user's role/custom claims

### Issue: "Credential implementation provided not loaded"

**Cause:** Service account credentials missing or invalid  
**Solution:** 
- Check environment variables are set correctly
- Ensure private key includes `\n` for newlines
- Verify service account has not been deleted

### Issue: "Firebase Admin initialization failed"

**Cause:** Invalid or missing service account  
**Solution:** 
- Regenerate service account key
- Ensure all three environment variables are set
- Check private key format (should start with `-----BEGIN PRIVATE KEY-----`)

---

## NEXT STEPS

After completing Firebase setup:

1. **Migrate data** from JSON database to Firestore (if desired)
2. **Set up email service** for password resets and notifications
3. **Implement file uploads** using Firebase Storage
4. **Add real-time listeners** for live dashboard updates
5. **Set up Firebase Functions** (optional, for server-side logic)

---

## SUPPORT

If you encounter issues during setup:

1. Check Firebase Console logs for errors
2. Review browser console for client-side errors
3. Check server logs for Admin SDK errors
4. Consult Firebase documentation: https://firebase.google.com/docs

---

**Document Version:** 1.0  
**Last Updated:** October 20, 2026
