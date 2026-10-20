# VINASTRA AEROSPACE — DEPLOYMENT GUIDE

**Last Updated:** October 20, 2026  
**Platform Version:** 2.0.0  
**Deployment Target:** Production (Vercel + Firebase)

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### 1. Environment Variables (CRITICAL)

Before deploying, ensure all environment variables are configured:

#### Firebase Configuration
- [ ] `FIREBASE_CLIENT_ADMIN_PROJECT_ID` - Client project ID
- [ ] `FIREBASE_CLIENT_ADMIN_CLIENT_EMAIL` - Client admin service account email
- [ ] `FIREBASE_CLIENT_ADMIN_PRIVATE_KEY` - Client admin private key (full string with \n)
- [ ] `FIREBASE_ADMIN_PROJECT_ID` - Server project ID (optional, for admin portal)
- [ ] `FIREBASE_ADMIN_CLIENT_EMAIL` - Server admin service account email
- [ ] `FIREBASE_ADMIN_PRIVATE_KEY` - Server admin private key

#### Security Configuration
- [ ] `JWT_SECRET` - Generate with: `openssl rand -hex 32`
- [ ] `SESSION_EXPIRY_HOURS` - Default: 24
- [ ] `BCRYPT_ROUNDS` - Default: 12

#### Email Service (Optional - Required for password reset)
- [ ] `SMTP_HOST` - SMTP server host
- [ ] `SMTP_PORT` - SMTP port (usually 587)
- [ ] `SMTP_USER` - SMTP username
- [ ] `SMTP_PASS` - SMTP password
- [ ] `SUPPORT_EMAIL` - Support email address

### 2. Firebase Console Setup

#### Client Project (`vinastra-aerospace-clientside`)

1. **Enable Authentication**
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable "Email/Password" provider
   - Add authorized domains (localhost, vinastra-aerospace.vercel.app)

2. **Configure Firestore Database**
   - Go to Firestore → Create database
   - Start in production mode
   - Choose location (recommended: asia-south1 for India)

3. **Enable Storage**
   - Go to Storage → Get started
   - Configure security rules for file uploads

4. **Create Service Account**
   - Go to Project Settings → Service accounts
   - Click "Generate new private key"
   - Save securely (this goes in `.env`)

#### Server Project (`vinastra-aerospace-serverside`) - Optional

Follow same steps as client project for admin-specific data.

### 3. Firebase Security Rules

#### Firestore Rules (Client Project)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Projects accessible based on role
    match /projects/{projectId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['ADMIN', 'FOUNDER', 'ENGINEER', 'RESEARCHER'];
    }
    
    // Documents with access level checks
    match /documents/{documentId} {
      allow read: if request.auth != null && 
        resource.data.accessLevel in ['PUBLIC', 'INTERNAL'] ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['ADMIN', 'FOUNDER', 'ENGINEER'];
      allow write: if request.auth != null;
    }
    
    // Research submissions - authors can write, reviewers can read
    match /researchSubmissions/{submissionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (resource.data.authorUserId == request.auth.uid ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['ADMIN', 'FOUNDER', 'RESEARCHER']);
    }
    
    // Engineering reviews - restricted to engineering team
    match /engineeringReviews/{reviewId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['ADMIN', 'FOUNDER', 'ENGINEER'];
    }
    
    // Subsystems - read for all authenticated, write for engineering
    match /spaceFactorySubsystems/{subsystemId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['ADMIN', 'FOUNDER', 'ENGINEER', 'RD_LEAD'];
    }
  }
}
```

#### Storage Rules (Client Project)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Public files
    match /public/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Internal files - authenticated users
    match /internal/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Confidential files - restricted access
    match /confidential/{allPaths=**} {
      allow read: if request.auth != null && 
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role in ['ADMIN', 'FOUNDER', 'ENGINEER'];
      allow write: if request.auth != null && 
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role in ['ADMIN', 'FOUNDER', 'ENGINEER'];
    }
  }
}
```

---

## 🚀 DEPLOYMENT STEPS

### Option 1: Deploy to Vercel (Recommended)

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Login to Vercel

```bash
vercel login
```

#### Step 3: Configure Environment Variables

In Vercel Dashboard:

1. Go to your project → Settings → Environment Variables
2. Add each variable from `.env` file
3. **IMPORTANT:** For private keys, paste the entire key including `\n` characters

#### Step 4: Deploy

```bash
# Production deployment
vercel --prod

# Preview deployment
vercel
```

#### Step 5: Configure Custom Domain (Optional)

1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add your custom domain (e.g., vinastra.space)
3. Update DNS records as instructed

### Option 2: Deploy to Firebase Hosting

#### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

#### Step 2: Login to Firebase

```bash
firebase login
```

#### Step 3: Initialize Firebase Hosting

```bash
firebase init hosting
```

Select:
- Use an existing project: `vinastra-aerospace-clientside`
- Public directory: `.` (root)
- Single-page app: No
- Overwrite index.html: No

#### Step 4: Configure `firebase.json`

```json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**",
      ".env",
      "backend/**",
      "data/**",
      "tests/**"
    ],
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

#### Step 5: Deploy

```bash
firebase deploy --only hosting
```

### Option 3: Deploy to Custom Server (VPS)

#### Step 1: Prepare Server

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt-get install -y nginx
```

#### Step 2: Clone Repository

```bash
git clone https://github.com/yourusername/vinastra-aerospace.git
cd vinastra-aerospace
```

#### Step 3: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your values
nano .env
```

#### Step 4: Start with PM2

```bash
# Install dependencies
npm install

# Start application
pm2 start server.js --name vinastra-aerospace

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

#### Step 5: Configure Nginx

```nginx
# /etc/nginx/sites-available/vinastra.space
server {
    listen 80;
    server_name vinastra.space www.vinastra.space;

    location / {
        proxy_pass http://localhost:4174;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/vinastra.space /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### Step 6: SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d vinastra.space -d www.vinastra.space

# Auto-renewal
sudo certbot renew --dry-run
```

---

## ✅ POST-DEPLOYMENT VERIFICATION

### 1. Health Check

```bash
curl https://your-domain.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "vinastra-aerospace",
  "timestamp": "2026-10-20T...",
  "engine": "ASCS-Node20-ESM"
}
```

### 2. Test Authentication

```bash
# Register test user
curl -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"testpass123","role":"student"}'

# Login
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'
```

### 3. Test Firebase Integration

```bash
# Check Firebase status
curl https://your-domain.com/api/auth/me \
  -H "Cookie: vinastra_session=YOUR_TOKEN"
```

### 4. Test Space Factory API

```bash
curl https://your-domain.com/api/space-factory/subsystems \
  -H "Cookie: vinastra_session=YOUR_TOKEN"
```

---

## 🔧 TROUBLESHOOTING

### Common Issues

#### 1. Firebase Admin Initialization Error

**Error:** `Missing required environment variables`

**Solution:** Ensure all Firebase environment variables are set in Vercel Dashboard or `.env` file. For private keys, ensure `\n` characters are preserved.

#### 2. Authentication Token Invalid

**Error:** `Session expired. Please log in again.`

**Solution:** 
- Check `JWT_SECRET` is consistent across deployments
- Verify cookie settings in browser
- Check token expiry time

#### 3. Firestore Permission Denied

**Error:** `Missing or insufficient permissions`

**Solution:**
- Verify Firestore security rules are deployed
- Check user authentication token
- Verify user role in database

#### 4. File Upload Not Working

**Error:** `Storage not initialized`

**Solution:**
- Enable Firebase Storage in Firebase Console
- Verify storage bucket name in environment variables
- Check storage security rules

#### 5. Vercel Deployment Timeout

**Error:** `Serverless Function Execution Timed Out`

**Solution:**
- Increase function timeout in `vercel.json`:
```json
{
  "functions": {
    "api/**/*.js": {
      "maxDuration": 30
    }
  }
}
```

---

## 📊 MONITORING & ANALYTICS

### Vercel Analytics

1. Go to Vercel Dashboard → Project → Analytics
2. Enable Web Analytics
3. Add analytics script to all HTML files:

```html
<script>
  window.va = window.va || function() {(window.vaq = window.vaq || []).push(arguments)};
  var script = document.createElement('script');
  script.src = '/_vercel/insights/script.js';
  script.defer = true;
  document.head.appendChild(script);
</script>
```

### Firebase Performance Monitoring

Add to client-side code:

```javascript
import { initializePerformance } from 'firebase/performance';

const perf = initializePerformance(firebaseApp);
```

### Error Tracking (Sentry)

```bash
npm install @sentry/node @sentry/browser
```

```javascript
// server.js
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});
```

---

## 🔄 CI/CD SETUP

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 📝 DEPLOYMENT NOTES

### Security Considerations

1. **Never commit `.env` file** - Already in `.gitignore`
2. **Rotate secrets regularly** - Especially after team member changes
3. **Use HTTPS only** - Configure in Vercel/Firebase settings
4. **Enable CORS restrictions** - Only allow your domain
5. **Monitor audit logs** - Check for suspicious activity

### Performance Optimization

1. **Enable caching** - Configure in `vercel.json` or Nginx
2. **Compress assets** - Use Brotli or Gzip
3. **Optimize images** - Use WebP format, lazy loading
4. **CDN configuration** - Leverage Vercel's edge network

### Backup Strategy

1. **Firestore backups** - Enable automated daily backups
2. **Code backups** - GitHub repository with tags for releases
3. **Environment backup** - Store `.env` securely (not in repo)

---

## 🎯 NEXT STEPS

After successful deployment:

1. ✅ Configure Firebase Security Rules
2. ✅ Set up email service (SendGrid/Resend)
3. ✅ Enable Firebase Firestore sync
4. ✅ Configure monitoring and analytics
5. ✅ Set up CI/CD pipeline
6. ✅ Create production test accounts
7. ✅ Conduct security audit
8. ✅ Document API endpoints for external users

---

**Deployment Status:** Ready for Production  
**Platform Readiness:** 85% Complete  
**Last Verified:** October 20, 2026

For support, contact: flight-ops@vinastra.space
