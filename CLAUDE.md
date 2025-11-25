# CLAUDE.md - Project Context

> **Purpose**: This file provides comprehensive context for AI assistants (like Claude) to understand the project when starting a new chat session. Keep this file updated as the project evolves.

## Project Overview

**Name**: Political Data Collection Web Application
**Type**: Serverless Single Page Application (SPA)
**Purpose**: Systematic collection of political science data on citizen-initiated democratic instruments across countries
**Hosting**: GitHub Pages
**Repository**: https://github.com/fmendez72/data-collection-app

## Tech Stack

### Frontend
- **HTML5** - Structure
- **CSS3** with **Bootstrap 5** (via CDN) - Styling
- **JavaScript ES6 Modules** - Logic (no build tools, no Node.js)
- **Handsontable Community Edition** (via CDN) - Data grid component

### Backend (Serverless)
- **Firebase Authentication** (v9 Modular SDK) - Email/password auth
- **Firebase Firestore** (v9 Modular SDK) - NoSQL database
- **GitHub Pages** - Static hosting

### Key Constraint
- **NO BUILD TOOLS**: Pure client-side JavaScript, no Webpack, Vite, or Node.js backend
- All dependencies loaded via CDN
- ES6 modules imported directly from Firebase CDN

## Architecture

### File Structure

```
data-collection-app/
├── landing.html              # Public-facing landing page (no auth required)
├── index.html                # Main app (requires authentication)
├── admin.html                # Admin panel (admin role required)
├── app.js                    # Main application logic
├── firebase-config.js        # Firebase initialization & config
├── style.css                 # Main styles + login/dashboard
├── landing.css               # Landing page styles
│
├── config/
│   ├── users.csv            # User management template (email, password, jobs, role)
│   └── README.md            # User management documentation
│
├── templates/
│   ├── ref-1.csv            # Referendum questionnaire template
│   ├── agenda-1.csv         # Agenda initiative template
│   └── [more].csv           # Additional questionnaire templates
│
├── responses/
│   ├── drafts/              # Local backup of draft responses (gitignored)
│   └── submitted/           # Local backup of submitted responses (gitignored)
│
├── scripts/
│   └── admin.js             # Admin panel logic (CSV parsing, Firestore uploads)
│
├── README.md                # User-facing documentation
├── SECURITY.md              # Security best practices
└── CLAUDE.md                # This file - AI assistant context
```

### Data Flow

1. **Admin Workflow**:
   - Admin logs in → Admin Panel (admin.html)
   - Uploads `users.csv` → Creates Firebase Auth accounts + Firestore `users` documents
   - Uploads template CSVs → Creates Firestore `templates` documents
   - Views submitted responses from coders

2. **Coder Workflow**:
   - Coder logs in → Dashboard (index.html)
   - Sees assigned jobs (from `users.assigned_jobs` array)
   - Selects job → Loads template into Handsontable
   - Fills questionnaire → Saves draft or submits final
   - Draft: Can re-edit later
   - Submitted: Read-only, no further changes

3. **Firestore Collections**:
   - `users`: User profiles (email, assigned_jobs[], role)
   - `templates`: Questionnaire templates (job_id, title, questions[])
   - `responses`: User responses (response_id, user_email, job_id, status, data[])

## Key Features

### 1. User Management (CSV-based)
- Admin creates `config/users.csv` with columns: `user_email`, `password`, `assigned_jobs`, `role`, `created_date`
- Admin uploads CSV via Admin Panel → Creates Firebase Auth accounts + Firestore user docs
- `assigned_jobs` is comma-separated list matching template job_ids

### 2. Template Management (CSV-based)
- Questionnaire templates stored as CSV files in `templates/` folder
- CSV format:
  - Columns: `id`, `Answer`, `Item`, `Sources`, `Definition`
  - `Answer` column:
    - Dropdown: `["Yes","No"]` (JSON array)
    - Free text: empty
  - `Definition` shown as tooltip (hover over Item)
- Admin uploads template CSV → Creates Firestore `templates` document

### 3. Data Entry (Handsontable Grid)
- 6 columns: ID (read-only), Item (read-only), Answer (editable), Source (editable), Definition (hidden, shown as tooltip), Comment (editable)
- Dropdowns auto-configured from template CSV
- Real-time save drafts
- Submit final locks the grid (read-only)

### 4. Status Tracking
- **New**: Template loaded, no data entered yet
- **Draft**: User saved progress (can edit)
- **Submitted**: Final submission (read-only, no edits)

## Firebase Configuration

### Project Details
- Project ID: `data-collector-2025`
- Auth Domain: `data-collector-2025.firebaseapp.com`
- API Keys in `firebase-config.js` (safe to commit - see SECURITY.md)

### Firestore Security Rules
- Users can only read their own `users` document
- Users can only read templates
- Users can only create/update their own responses (before submission)
- Admins can read/write everything
- No deletions allowed

### Firebase Auth
- Email/Password provider enabled
- Authorized domains: `localhost`, `fmendez72.github.io`

## Important Design Decisions

### 1. Definition Column Hidden
- Originally shown as 6th visible column
- Now hidden (width: 1px, class: d-none)
- Displayed as HTML tooltip on hover (using Handsontable's `afterOnCellMouseOver` hook)
- **Reason**: Cleaner UI, less horizontal scrolling

### 2. CSV-based Management
- No admin UI for creating users/templates manually
- All management via CSV upload
- **Reason**: Scalability, bulk operations, offline editing

### 3. Response ID Format
- `{user_email}_{job_id}` (e.g., `alice@example.com_ref-1`)
- Ensures one response per user per job
- **Reason**: Simple, predictable, prevents duplicates

### 4. No Build Tools
- Direct ES6 module imports from CDN
- **Reason**: Simplicity, no dependency management, easy deployment

### 5. Landing Page Separate
- `landing.html` is public-facing, no auth required
- Links to `index.html` (Sign In) and `admin.html` (Admin Panel)
- **Reason**: Professional presentation, SEO, public project info

## Common Tasks

### Adding a New User
1. Edit `config/users.csv`
2. Add row: `email,password,job-ids,role,date`
3. Upload via Admin Panel → User Management

### Adding a New Questionnaire
1. Create CSV in `templates/` folder (e.g., `new-quest.csv`)
2. Format: `id,Answer,Item,Sources,Definition`
3. Login to Admin Panel
4. Template Management → Enter Job ID (filename without .csv), Title, Description
5. Upload CSV file

### Viewing Responses
1. Login to Admin Panel
2. Click "Load All Responses"
3. View submitted data (JSON format in alert, can be enhanced)

### Troubleshooting Auth Issues
1. Check Firebase Authorized Domains (must include deployment domain)
2. Verify user exists in Firebase Auth
3. Verify user document exists in Firestore `users` collection
4. Check Firestore Security Rules

## Known Limitations & Future Enhancements

### Current Limitations
1. No pagination for large questionnaires (all questions loaded at once)
2. Response viewing in admin panel shows JSON in alert (not ideal UX)
3. No CSV export of responses (manual Firestore export needed)
4. No email verification or password reset flow
5. No audit log of who changed what when
6. Handsontable dropdown limited to same options for all rows (can't vary per question yet)

### Planned Enhancements
1. Export responses to CSV from admin panel
2. Better response viewer (table/modal instead of alert)
3. Email notifications when job assigned
4. Progress indicators (% complete)
5. Auto-save drafts every N seconds
6. Undo/redo functionality
7. Bulk template upload (multiple CSVs at once)
8. User self-service password reset

## Code Style & Conventions

### JavaScript
- ES6 modules, `import`/`export`
- `async`/`await` for Firebase operations
- Descriptive function names: `loadUserProfile()`, `renderJobsList()`
- Comments for major sections (separated by `// ====`)
- No unused imports/variables (keep code clean)

### CSS
- Bootstrap utility classes where possible
- Custom classes prefixed with component (e.g., `.badge-new`, `.hero-section`)
- Responsive design (mobile-first)
- Gradient backgrounds for auth screens

### HTML
- Semantic elements (`<nav>`, `<section>`, `<article>`)
- Bootstrap grid system (`container`, `row`, `col-*`)
- Accessibility: `aria-label`, `role` attributes

### Naming Conventions
- Files: kebab-case (`admin-panel.html`)
- Functions: camelCase (`loadAssignedJobs()`)
- Constants: UPPER_SNAKE_CASE (`API_KEY`)
- CSS classes: kebab-case (`.login-screen`)
- Firestore collections: lowercase (`users`, `templates`, `responses`)
- Firestore document IDs: lowercase with underscores (`user@example.com_ref-1`)

## Testing Locally

```bash
# Start local server (required for ES6 modules)
python -m http.server 8000

# Or use VS Code Live Server extension
```

**Never open `index.html` directly** - ES6 modules require HTTP server

## Deployment

```bash
# Commit changes
git add .
git commit -m "Description of changes"

# Push to GitHub
git push origin main

# GitHub Pages auto-deploys from main branch
# Wait 1-2 minutes, then check: https://fmendez72.github.io/data-collection-app/
```

## Security Notes

- **Firebase API keys are PUBLIC** (by design, safe to commit)
- Security enforced by Firestore Rules + Auth + Authorized Domains
- Never commit actual `config/users.csv` with real passwords to public repo
- Use `.gitignore` for `responses/` folder (local backups only)

## Contact & Maintenance

- **Project Owner**: Fernando Mendez (fmendez72)
- **GitHub**: https://github.com/fmendez72/data-collection-app
- **Live Site**: https://fmendez72.github.io/data-collection-app/

## Version History

### v2.0 (2025-01-25) - Current
- Complete architecture overhaul
- CSV-based user/template management
- Admin panel with bulk upload
- Landing page + improved UI
- Definition tooltips (hidden column)
- Better Firestore data model (users, templates, responses)

### v1.0 (2025-01-24) - Initial
- Basic auth + data entry
- Mock data generator
- Single hardcoded questionnaire

---

## For AI Assistants (like Claude)

When helping with this project:

1. **Respect the "no build tools" constraint** - Never suggest Webpack, Vite, npm packages, etc.
2. **Use Firebase v9 Modular SDK syntax** - `import { ... } from 'firebase/...'`
3. **Import from CDN** - All Firebase imports from `https://www.gstatic.com/firebasejs/9.22.0/...`
4. **Maintain file structure** - Don't create new top-level files without discussion
5. **Follow naming conventions** - See "Code Style & Conventions" above
6. **Update this file** - If you make significant changes, update CLAUDE.md
7. **Check README.md** - User-facing docs should match implementation
8. **Security first** - Always consider Firestore Security Rules impact

### Common User Requests

- **"Add a new feature"** → Check if it fits the CSV-based workflow
- **"The grid is too wide"** → Adjust column widths in `app.js` (Handsontable config)
- **"Can't see definitions"** → They're tooltips (hover over Item column)
- **"CSV upload fails"** → Check CSV format, verify admin role in Firestore
- **"Auth error"** → Check Authorized Domains in Firebase Console
- **"Jobs not showing"** → Check user's `assigned_jobs` array in Firestore matches template `job_id`

### Files You'll Most Often Edit

- **app.js** - Main logic, grid config, save/submit handlers
- **admin.js** - CSV parsing, Firestore uploads
- **style.css** - UI styling, login page, grid appearance
- **README.md** - User documentation
- **CLAUDE.md** (this file) - Project context for future sessions

---

**Last Updated**: 2025-01-25
**Current Version**: v2.0
**Maintainer**: Fernando Mendez
