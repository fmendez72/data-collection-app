# Security Configuration

## Why Firebase API Keys Are Public

The Firebase API keys in `firebase-config.js` are **safe to be public**. This is by design.

Unlike traditional API keys, Firebase client API keys are not used to control access to your backend resources. They simply identify your Firebase project to Google's servers.

### Real Security Measures

Your data is protected by three layers:

#### 1. Firestore Security Rules

Configure these in Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Jobs collection
    match /jobs/{jobId} {
      // Users can only read jobs assigned to them
      allow read: if request.auth != null &&
                     resource.data.assigned_to == request.auth.token.email;

      // Users can only update their own jobs
      allow update: if request.auth != null &&
                       resource.data.assigned_to == request.auth.token.email;

      // Allow creation (for mock data generator and admin functions)
      // In production, you might want to restrict this to admin users only
      allow create: if request.auth != null;

      // Prevent deletion
      allow delete: if false;
    }
  }
}
```

#### 2. Firebase Authentication

- Only authenticated users can access the app
- Email/Password authentication requires valid credentials
- User emails are verified server-side by Firebase

#### 3. Authorized Domains

Configure in Firebase Console → Authentication → Settings → Authorized Domains:

**Allowed domains:**
- `localhost` (for local development)
- `fmendez72.github.io` (for your GitHub Pages deployment)

**What this prevents:**
- Someone can't copy your code and run it on their own domain
- Even with your API keys, unauthorized domains are blocked

## Production Security Checklist

### Before Going Live:

- [ ] Set proper Firestore Security Rules (see above)
- [ ] Add only your deployment domain to Authorized Domains
- [ ] Remove mock data generator button (or restrict to admin users)
- [ ] Consider adding App Check for additional security
- [ ] Enable Firebase monitoring and alerts

### Firestore Security Rules - Production Example

For production, tighten the rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /jobs/{jobId} {
      // Read: Only assigned user
      allow read: if request.auth != null &&
                     resource.data.assigned_to == request.auth.token.email;

      // Update: Only assigned user, only specific fields
      allow update: if request.auth != null &&
                       resource.data.assigned_to == request.auth.token.email &&
                       // Only allow updating these fields
                       request.resource.data.keys().hasOnly([
                         'saved_response_json',
                         'status',
                         'assigned_to',
                         'title',
                         'description',
                         'template_json'
                       ]) &&
                       // Prevent changing assignment
                       request.resource.data.assigned_to == resource.data.assigned_to;

      // Create: Restrict to specific admin email(s)
      allow create: if request.auth != null &&
                       request.auth.token.email == 'admin@yourdomain.com';

      // Delete: Admin only
      allow delete: if request.auth != null &&
                       request.auth.token.email == 'admin@yourdomain.com';
    }
  }
}
```

## What Should NEVER Be Public

While Firebase API keys are safe, **never commit these** to version control:

- Private keys for service accounts (`.json` files)
- OAuth client secrets
- Third-party API keys (Stripe, AWS, etc.)
- User passwords or authentication tokens
- Environment-specific secrets

## Additional Security Measures

### 1. App Check (Recommended for Production)

Add Firebase App Check to prevent abuse:

```html
<!-- Add to index.html -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-check.js"></script>
```

```javascript
// Add to firebase-config.js
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
  isTokenAutoRefreshEnabled: true
});
```

### 2. Rate Limiting

Firebase automatically rate-limits authentication attempts, but monitor for abuse in Firebase Console.

### 3. User Management

- Regularly audit user accounts
- Disable unused accounts
- Use strong password requirements
- Consider email verification

## Monitoring

Enable these in Firebase Console:

1. **Authentication logs** - Track login attempts
2. **Firestore usage monitoring** - Detect unusual activity
3. **Budget alerts** - Get notified of unexpected usage spikes

## References

- [Firebase Security Documentation](https://firebase.google.com/docs/rules)
- [Firebase API Key Best Practices](https://firebase.google.com/docs/projects/api-keys)
- [Firestore Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
