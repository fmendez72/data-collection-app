# Political Data Collection Web Application

A serverless, client-side web application for systematic collection of political data through structured questionnaires. Built for researchers to collaborate on data collection for citizen-initiated democratic instruments across countries.

## Live Demo

- **Landing Page**: [https://fmendez72.github.io/data-collection-app/landing.html](https://fmendez72.github.io/data-collection-app/landing.html)
- **Application**: [https://fmendez72.github.io/data-collection-app/](https://fmendez72.github.io/data-collection-app/)
- **Admin Panel**: [https://fmendez72.github.io/data-collection-app/admin.html](https://fmendez72.github.io/data-collection-app/admin.html)

## Technology Stack

- **Frontend**: HTML5, CSS3, Bootstrap 5, JavaScript ES6 Modules
- **Grid Component**: Handsontable Community Edition (via CDN)
- **Backend**: Firebase Authentication & Firestore Database (v9 Modular SDK)
- **Hosting**: GitHub Pages

## Features

### For Coders (Data Entry Users)
- Secure email/password authentication
- Dashboard showing assigned questionnaires
- Interactive data grid with:
  - Dropdown answers for yes/no questions
  - Free text fields for open-ended responses
  - Source citation fields
  - Comment fields for notes
  - Definition tooltips on hover
- Draft saving (auto-saves progress)
- Final submission (locks the questionnaire)
- Status tracking (New, Draft, Submitted)

### For Administrators
- User management via CSV upload
- Template management (upload questionnaire CSVs)
- View all submitted responses
- Role-based access control

## Project Structure

```
data-collection-app/
├── landing.html              # Public landing page with project info
├── index.html                # Main application (requires login)
├── admin.html                # Admin panel for data management
├── app.js                    # Main application logic
├── firebase-config.js        # Firebase configuration
├── style.css                 # Main stylesheet
├── landing.css               # Landing page styles
│
├── config/
│   ├── users.csv            # User management template
│   └── README.md            # User management documentation
│
├── templates/
│   ├── ref-1.csv            # Referendum questionnaire template
│   ├── agenda-1.csv         # Agenda initiative questionnaire template
│   └── [more templates]     # Additional questionnaires
│
├── responses/
│   ├── drafts/              # Draft responses (Firestore backup)
│   └── submitted/           # Submitted responses (Firestore backup)
│
├── scripts/
│   └── admin.js             # Admin panel logic
│
├── README.md                # This file
├── SECURITY.md              # Security documentation
└── CLAUDE.md                # Project context for AI assistance
```

## Setup Instructions

### 1. Firebase Project Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/)
2. Enable **Email/Password** authentication:
   - Go to Authentication → Sign-in method
   - Enable Email/Password provider
3. Create **Firestore Database**:
   - Go to Firestore Database → Create Database
   - Start in Production mode
4. Get your Firebase config:
   - Go to Project Settings → Your apps → Web app
   - Copy the config object
5. Update [firebase-config.js](firebase-config.js) with your credentials

### 2. Configure Firestore Security Rules

Go to Firestore Database → Rules and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.token.email == userId;
      allow write: if request.auth != null &&
                      get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.role == 'admin';
    }

    // Templates collection
    match /templates/{templateId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                      get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.role == 'admin';
    }

    // Responses collection
    match /responses/{responseId} {
      allow read: if request.auth != null &&
                     (request.auth.token.email == resource.data.user_email ||
                      get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.role == 'admin');

      allow create: if request.auth != null &&
                       request.auth.token.email == request.resource.data.user_email;

      allow update: if request.auth != null &&
                       request.auth.token.email == resource.data.user_email &&
                       resource.data.status != 'submitted';

      allow delete: if false; // Never allow deletion
    }
  }
}
```

### 3. Create Admin Account

1. Go to Firebase Console → Authentication → Users
2. Click "Add user"
3. Email: `admin@example.com` (or your email)
4. Password: Create a secure password
5. Create the user account

### 4. Initialize Admin User in Firestore

Manually create the first admin user document:

1. Go to Firestore Database
2. Create collection: `users`
3. Document ID: `admin@example.com` (your admin email)
4. Fields:
   ```
   email: "admin@example.com"
   assigned_jobs: [] (array)
   role: "admin"
   created_at: (current timestamp)
   ```

### 5. Deploy to GitHub Pages

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Political Data Collection App"

# Add remote (create repo on GitHub first)
git remote add origin https://github.com/YOUR_USERNAME/data-collection-app.git

# Push
git branch -M main
git push -u origin main
```

Then enable GitHub Pages:
1. Repository Settings → Pages
2. Source: Deploy from branch `main`, folder `/ (root)`
3. Save and wait 1-2 minutes

### 6. Configure Firebase Authorized Domains

**CRITICAL STEP** - Without this, authentication won't work on GitHub Pages:

1. Firebase Console → Authentication → Settings → Authorized domains
2. Click "Add domain"
3. Add: `YOUR_USERNAME.github.io`
4. Save

## Usage Workflow

### For Administrators

1. **Access Admin Panel**: Navigate to `admin.html`
2. **Login** with admin credentials
3. **Upload User Management CSV**:
   - Edit [config/users.csv](config/users.csv) with user emails, passwords, and job assignments
   - Upload via Admin Panel → User Management
4. **Upload Template CSVs**:
   - Add questionnaire CSV files to `templates/` folder
   - Upload via Admin Panel → Template Management
   - Specify Job ID, Title, and Description
5. **View Responses**: Click "Load All Responses" to see submitted data

### For Coders (Data Entry)

1. **Access Application**: Navigate to `index.html`
2. **Login** with assigned credentials
3. **View Dashboard**: See all assigned jobs
4. **Select Job**: Click on a job to open the data entry grid
5. **Enter Data**:
   - Fill out answers (dropdowns or text fields)
   - Add source citations
   - Add comments as needed
   - Hover over "Item" column to see definitions
6. **Save Draft**: Click "Save Draft" to save progress (can continue later)
7. **Submit Final**: Click "Submit Final" when complete (locks the job)

## CSV File Formats

### User Management CSV ([config/users.csv](config/users.csv))

```csv
user_email,password,assigned_jobs,role,created_date
alice@example.com,password123,"ref-1,agenda-1",coder,2025-01-15
bob@example.com,password456,ref-1,coder,2025-01-16
admin@example.com,admin123,"ref-1,agenda-1",admin,2025-01-10
```

### Questionnaire Template CSV

```csv
id,Answer,Item,Sources,Definition
1,"[""Yes"",""No""]",Is there a citizen-initiated referendum?,,Long definition explaining the concept
2,"[""Yes"",""No""]",Is there an explicit legal basis?,,Another detailed definition
3,,What is the total number of signatures required?,,Free text answer field
```

**Column Descriptions**:
- `id`: Question number (must be unique)
- `Answer`:
  - For dropdown: `["Yes","No"]` (JSON array)
  - For free text: Leave empty
- `Item`: The question text
- `Sources`: Leave empty (coder fills in)
- `Definition`: Hover tooltip text explaining the question

## Firestore Data Model

### Collections

**users**
```json
{
  "email": "coder@example.com",
  "assigned_jobs": ["ref-1", "agenda-1"],
  "role": "coder",
  "created_at": "2025-01-15T10:00:00Z"
}
```

**templates**
```json
{
  "job_id": "ref-1",
  "title": "Referendum Questionnaire",
  "description": "National level referendum questions",
  "questions": [
    {
      "id": "1",
      "item": "Is there a citizen-initiated referendum?",
      "answer_type": "dropdown",
      "answer_options": ["Yes", "No"],
      "source": "",
      "definition": "Long definition text",
      "comment": ""
    }
  ],
  "created_at": "2025-01-15T10:00:00Z",
  "version": 1
}
```

**responses**
```json
{
  "response_id": "coder@example.com_ref-1",
  "user_email": "coder@example.com",
  "job_id": "ref-1",
  "status": "draft",
  "data": [
    {
      "id": "1",
      "item": "Is there a citizen-initiated referendum?",
      "answer": "Yes",
      "source": "Constitution Article 12",
      "definition": "Long definition text",
      "comment": "Verified with legal expert"
    }
  ],
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-15T14:30:00Z",
  "submitted_at": null
}
```

## Security

### Firebase API Keys Are Safe to Expose

The Firebase API keys in [firebase-config.js](firebase-config.js) are **designed to be public**. Security is enforced by:

1. **Firestore Security Rules** - Control database access at the document level
2. **Firebase Authentication** - Verify user identity
3. **Authorized Domains** - Whitelist allowed domains

See [SECURITY.md](SECURITY.md) for detailed security information.

### Best Practices

- ✅ Commit Firebase config to version control
- ✅ Use strong passwords for user accounts
- ✅ Configure proper Firestore Security Rules
- ✅ Add only your deployment domain to Authorized Domains
- ❌ Don't commit actual user CSV with passwords to public repos
- ❌ Don't share admin credentials publicly

## Troubleshooting

### Authentication fails with "auth/unauthorized-domain"

**Solution**: Add your deployment domain to Firebase Authorized Domains
- Firebase Console → Authentication → Settings → Authorized Domains
- Add `YOUR_USERNAME.github.io`

### "Permission denied" errors in Firestore

**Solution**: Check Firestore Security Rules
- Ensure rules are properly configured
- Check that user document exists in `users` collection
- Verify user has correct `role` field

### Jobs not loading for coder

**Solution**: Check user assignment
- Verify user document in Firestore has `assigned_jobs` array
- Ensure templates exist in `templates` collection with matching job IDs
- Check browser console for errors

### CSV upload fails in Admin Panel

**Solution**: Verify CSV format
- Check that CSV has correct headers
- Ensure no special characters or formatting issues
- Verify you're logged in as admin (check `role` field in Firestore)

### Handsontable not displaying

**Solution**: Check CDN and browser console
- Verify CDN links are accessible
- Check browser console for JavaScript errors
- Ensure proper license key (non-commercial usage)

## Development

### Local Testing

You cannot open `index.html` directly in a browser (ES6 module restrictions). Use a local server:

```bash
# Python 3
python -m http.server 8000

# Then visit: http://localhost:8000
```

Or use VS Code's "Live Server" extension.

### Adding New Templates

1. Create CSV file in `templates/` folder (e.g., `new-template.csv`)
2. Login to Admin Panel ([admin.html](admin.html))
3. Go to Template Management
4. Enter Job ID (filename without .csv): `new-template`
5. Enter Title and Description
6. Upload the CSV file

### Assigning Jobs to Users

1. Edit [config/users.csv](config/users.csv)
2. Add job IDs to `assigned_jobs` column (comma-separated)
3. Upload via Admin Panel → User Management

## License & Credits

### Handsontable
This project uses [Handsontable Community Edition](https://handsontable.com/) under a non-commercial license. For commercial use, purchase a license from Handsontable.

### Firebase
This project uses Firebase services subject to [Firebase Terms of Service](https://firebase.google.com/terms).

### Bootstrap
This project uses [Bootstrap 5](https://getbootstrap.com/) licensed under the MIT License.

## Contributing

This is a research project. For access or questions, contact the project administrator.

## Support

- **Firebase Issues**: [Firebase Documentation](https://firebase.google.com/docs)
- **Handsontable Issues**: [Handsontable Docs](https://handsontable.com/docs/)
- **GitHub Pages Issues**: [GitHub Pages Docs](https://docs.github.com/en/pages)

## Version History

- **v2.0** (2025-01) - Complete architecture overhaul
  - Scalable CSV-based user and template management
  - Admin panel with bulk upload
  - Improved UI with landing page
  - Definition tooltips instead of visible column
  - Better Firestore data model

- **v1.0** (2025-01) - Initial release
  - Basic authentication and data entry
  - Mock data generator

---

**Project**: Political Data Collection Application
**Repository**: [https://github.com/fmendez72/data-collection-app](https://github.com/fmendez72/data-collection-app)
**Live Demo**: [https://fmendez72.github.io/data-collection-app/](https://fmendez72.github.io/data-collection-app/)
