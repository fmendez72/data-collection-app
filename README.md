# Data Collection Web Application

A serverless, client-side web application for collecting political data through structured questionnaires, hosted on GitHub Pages.

## Technology Stack

- **Frontend**: HTML5, CSS3, Bootstrap 5, JavaScript ES6 Modules
- **Grid Component**: Handsontable Community Edition
- **Backend**: Firebase Authentication & Firestore Database

## Files Structure

```
data-collection-app/
├── index.html           # Main HTML file with UI structure
├── style.css            # Custom styling
├── firebase-config.js   # Firebase configuration (YOU MUST EDIT THIS)
├── app.js              # Main application logic
└── README.md           # This file
```

## Setup Instructions

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project" and follow the wizard
3. Once created, click on the Web icon (`</>`) to add a web app
4. Register your app with a nickname (e.g., "Data Collection App")
5. Copy the Firebase configuration object

### Step 2: Configure Firebase in Your Code

Open `firebase-config.js` and replace the placeholder values:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};
```

### Step 3: Enable Firebase Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** authentication
3. Click on **Users** tab → **Add User**
4. Create test user accounts (email + password)

### Step 4: Set Up Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create Database**
3. Start in **Test Mode** (for development) or **Production Mode** (recommended)
4. If using Production Mode, set these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /jobs/{jobId} {
      allow read: if request.auth != null &&
                     resource.data.assigned_to == request.auth.token.email;
      allow update: if request.auth != null &&
                       resource.data.assigned_to == request.auth.token.email;
      allow write: if request.auth != null; // For mock data generator
    }
  }
}
```

### Step 5: Test Locally

1. You **cannot** simply open `index.html` in your browser due to CORS restrictions with ES6 modules
2. Use a local web server:

**Option A: Python**
```bash
# Python 3
python -m http.server 8000

# Then visit: http://localhost:8000
```

**Option B: VS Code Live Server Extension**
- Install "Live Server" extension in VS Code
- Right-click `index.html` → "Open with Live Server"

**Option C: Node.js http-server**
```bash
npx http-server -p 8000
```

3. Login with the test user you created
4. Click "Generate Mock Data" to create sample jobs
5. Select a job and test the data entry workflow

## Deployment to GitHub Pages

### Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it (e.g., `data-collection-app`)
3. Make it **Public** (required for GitHub Pages free tier)

### Step 2: Push Your Code

```bash
# Initialize git (if not already)
cd data-collection-app
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Data Collection App"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/data-collection-app.git

# Push to main branch
git branch -M main
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages** (in the left sidebar)
3. Under **Source**, select:
   - Branch: `main`
   - Folder: `/ (root)`
4. Click **Save**
5. Wait 1-2 minutes for deployment
6. Your app will be available at: `https://YOUR_USERNAME.github.io/data-collection-app/`

### Step 4: Configure Firebase Authorized Domains

**IMPORTANT**: This step is required for Firebase Authentication to work on GitHub Pages.

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Authentication** → **Settings** → **Authorized Domains**
4. Click **Add Domain**
5. Add your GitHub Pages domain:
   ```
   YOUR_USERNAME.github.io
   ```
6. Save

### Step 5: Test Your Deployed App

1. Visit `https://YOUR_USERNAME.github.io/data-collection-app/`
2. Login with your test credentials
3. Generate mock data and test the full workflow

## Important Notes

### Security Considerations

1. **API Keys in Public Repos**: Firebase API keys in `firebase-config.js` are safe to expose in public repositories. They are designed for client-side use. Security is enforced through:
   - Firestore Security Rules
   - Firebase Authentication
   - Authorized Domains whitelist

2. **Firestore Security Rules**: Always configure proper security rules in production to restrict access based on authentication.

3. **HTTPS**: GitHub Pages serves content over HTTPS by default, which is required for many modern web APIs.

### Handsontable License

This app uses Handsontable Community Edition with the `non-commercial-and-evaluation` license key. For commercial use, you must purchase a license from [Handsontable](https://handsontable.com/pricing).

### Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge) with ES6 module support
- JavaScript must be enabled
- Cookies must be enabled for authentication

## Usage Workflow

1. **Login**: User authenticates with email/password
2. **View Jobs**: Dashboard shows all jobs assigned to the user's email
3. **Select Job**: Click a job to open it in the data entry grid
4. **Enter Data**: Fill out the Handsontable grid
   - **ID**: Auto-filled, read-only
   - **Item**: Question text, read-only
   - **Answer**: Dropdown (Yes/No)
   - **Source**: Free text for URLs/citations
   - **Definition**: Helper text, read-only
   - **Comment**: Free text for notes
5. **Save Draft**: Saves progress, can continue later
6. **Submit Final**: Locks the job (read-only), marks as submitted

## Troubleshooting

### "Module not found" errors
- Ensure you're running a local web server (not opening `index.html` directly)
- Check that all file paths are correct

### Firebase authentication fails
- Verify Firebase config in `firebase-config.js`
- Check that Email/Password auth is enabled in Firebase Console
- Verify your domain is in Firebase Authorized Domains list

### Jobs not loading
- Check browser console for errors
- Verify Firestore security rules allow reading jobs
- Ensure you've created jobs assigned to your email address

### Handsontable not displaying
- Check browser console for JavaScript errors
- Verify Handsontable CDN is accessible
- Ensure container div has proper dimensions

## Support

For issues with:
- **Firebase**: [Firebase Documentation](https://firebase.google.com/docs)
- **Handsontable**: [Handsontable Docs](https://handsontable.com/docs/)
- **GitHub Pages**: [GitHub Pages Docs](https://docs.github.com/en/pages)

## License

This project uses:
- Handsontable Community Edition (Non-commercial license)
- Firebase SDK (Apache License 2.0)
- Bootstrap 5 (MIT License)
