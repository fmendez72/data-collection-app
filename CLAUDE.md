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

## Troubleshooting Common Issues

### Admin Panel: "Access denied. Admin privileges required"
**Symptoms**: Admin can't log into admin panel, or gets logged out when creating users.

**Causes & Solutions**:
1. **User document missing `role: "admin"`**
   - Go to Firestore → `users` collection → Find user document
   - Verify `role` field is exactly `"admin"` (lowercase)

2. **User document doesn't exist in Firestore**
   - User exists in Firebase Auth but not in Firestore `users` collection
   - Manually create document with ID = email address
   - Add fields: `email`, `assigned_jobs: []`, `role: "admin"`, `created_at`

3. **Automatic logout when creating users (expected behavior)**
   - Firebase's `createUserWithEmailAndPassword()` logs you in as the newly created user
   - This is a Firebase limitation, not a bug
   - Solution: Just log back in as admin after user creation completes
   - Warning message added to admin.html to inform users

### Coder Panel: "Failed to load jobs"
**Symptoms**: Coder logs in successfully but jobs don't load, shows "Missing or insufficient permissions".

**Causes & Solutions**:
1. **Firestore Security Rules too restrictive**
   - Ensure rules allow authenticated users to read templates:
   ```javascript
   match /templates/{templateId} {
     allow read: if request.auth != null;
   }
   ```

2. **User document missing or malformed**
   - Check Firestore → `users` collection → user email document
   - Verify `assigned_jobs` is an array of job IDs (e.g., `["ref-1", "agenda-1"]`)
   - Job IDs must match template document IDs in `templates` collection

3. **Templates not uploaded**
   - Verify templates exist in Firestore `templates` collection
   - Template `job_id` field must match the job ID in user's `assigned_jobs` array

4. **Rules not published or propagated**
   - After updating Firestore Rules, click "Publish" and wait 30-60 seconds
   - Try in fresh incognito window to avoid cache

### Handsontable: Dropdowns not showing
**Symptoms**: Answer column shows text input instead of dropdown.

**Solution**: This was fixed in v2.1. Ensure you're using the latest version from GitHub.

**How to verify**:
1. Check [app.js:378-392](app.js#L378-L392) contains the `cells()` callback
2. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
3. Check that template CSV has proper dropdown format: `"[""Yes"",""No""]"`

### Handsontable: Tooltips not showing
**Symptoms**: Hovering over Item column doesn't show definition.

**Solution**: This was fixed in v2.1. Ensure tooltip code targets `coords.col === 1`.

**How to verify**:
1. Check [app.js:393-401](app.js#L393-L401) has `coords.col === 1`
2. Verify template CSV has definitions in the "Definition" column
3. Hard refresh browser

### Data Loss: Edits not saved on submit
**Symptoms**: User's last edit before clicking Submit Final is lost.

**Solution**: This was fixed in v2.1. The `finishEditing()` call ensures active edits are committed.

**How to verify**:
1. Check [app.js:460-464](app.js#L460-L464) has `finishEditing()` call
2. Test: Edit a cell, don't press Enter, click Submit Final immediately
3. Check Firestore to verify the edit was saved

## Known Limitations & Future Enhancements

### Current Limitations
1. No pagination for large questionnaires (all questions loaded at once)
2. Response viewing in admin panel shows JSON in alert (not ideal UX)
3. No CSV export of responses (manual Firestore export needed)
4. No email verification or password reset flow
5. No audit log of who changed what when
6. UI needs improvement: inconsistent font weights, too many colors
7. Admin user creation causes temporary logout (Firebase limitation)

### Planned Enhancements
1. Export responses to CSV from admin panel
2. Better response viewer (table/modal instead of alert)
3. Email notifications when job assigned
4. Progress indicators (% complete)
5. Auto-save drafts every N seconds
6. Undo/redo functionality
7. Bulk template upload (multiple CSVs at once)
8. User self-service password reset
9. UI/UX improvements: consistent typography, simplified color scheme

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

## Critical Bugs Fixed (Post-Deployment)

### Bug #1: Data Loss on Submit (2025-01-25)
**Issue**: When user edited a cell and clicked Submit Final without pressing Enter first, the edit was lost.

**Root Cause**: Handsontable doesn't commit active cell edits until user presses Enter or clicks away. Calling `getData()` while editor is active returns old data.

**Fix**: Added `finishEditing()` call before `getData()` in both Save Draft and Submit Final handlers.

**Code Location**: [app.js:417-421](app.js#L417-L421) and [app.js:460-464](app.js#L460-L464)

```javascript
// Force Handsontable to commit any active cell edits before saving
const activeEditor = hotInstance.getActiveEditor();
if (activeEditor) {
  activeEditor.finishEditing();
}
```

### Bug #2: Dropdowns Not Working (2025-01-25)
**Issue**: Dropdown options not showing in Answer column. All questions had same dropdown or no dropdown.

**Root Cause**: Code used `forEach` loop to override `columns[2]` for each question, resulting in only the last question's dropdown being applied to all rows.

**Fix**: Replaced column-wide configuration with `cells()` callback for per-row dropdown configuration.

**Code Location**: [app.js:378-392](app.js#L378-L392)

```javascript
cells: function(row, col) {
  const cellProperties = {};

  if (col === 2 && currentTemplate.questions[row]) {
    const question = currentTemplate.questions[row];
    if (question.answer_type === 'dropdown' && question.answer_options.length > 0) {
      cellProperties.type = 'dropdown';
      cellProperties.source = question.answer_options;
      cellProperties.strict = false; // Allow typing to filter
    }
  }

  return cellProperties;
}
```

### Bug #3: Definition Tooltips Not Showing (2025-01-25)
**Issue**: Hovering over questions didn't show definition tooltips.

**Root Cause**: Tooltip code checked `coords.col >= 0` (any column) instead of specifically targeting the Item column.

**Fix**: Changed hover target to `coords.col === 1` (Item column only).

**Code Location**: [app.js:393-401](app.js#L393-L401)

```javascript
afterOnCellMouseOver: function(_event, coords, TD) {
  // Show definition as tooltip on Item column hover
  if (coords.row >= 0 && coords.col === 1) {
    const definition = this.getDataAtCell(coords.row, 4);
    if (definition) {
      TD.title = definition;
    }
  }
}
```

### Bug #4: Comment Column Not Editable (2025-01-25)
**Issue**: Users couldn't type in Comment column.

**Root Cause**: Same as Bug #2 - the broken dropdown configuration was interfering with all column settings.

**Fix**: Fixed by implementing proper `cells()` callback (see Bug #2 fix).

## Version History

### v2.1 (2025-01-25) - Bug Fixes
- Fixed data loss on submit (finishEditing before getData)
- Fixed per-row dropdown configuration (cells callback)
- Fixed definition tooltips (target Item column specifically)
- Fixed Comment column editability
- All core Handsontable features now working correctly

### v2.0 (2025-01-25) - Major Overhaul
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
- **"Dropdowns not working"** → Verify cells() callback in app.js (fixed in v2.1)
- **"Data not saving"** → Check finishEditing() is called before getData() (fixed in v2.1)
- **"UI needs improvement"** → See "Planned Enhancements" section

### Files You'll Most Often Edit

- **app.js** - Main logic, grid config, save/submit handlers
- **scripts/admin.js** - CSV parsing, Firestore uploads
- **style.css** - UI styling, login page, grid appearance
- **README.md** - User documentation
- **CLAUDE.md** (this file) - Project context for future sessions

## Important Implementation Notes

### Handsontable Configuration
- **Per-row dropdowns**: MUST use `cells()` callback, NOT column-wide config
- **Tooltip display**: Target `coords.col === 1` (Item column), read from column 4 (Definition)
- **Data commit**: ALWAYS call `finishEditing()` before `getData()`
- **Read-only state**: Check `currentJob.status === 'submitted'` before configuring grid

### Firebase Auth & Firestore
- **Document IDs**: Use email addresses as document IDs in `users` collection
- **Security Rules**: Authenticated users can read templates, only admins can write
- **User creation**: Causes automatic login as new user (expected Firebase behavior)
- **Rule propagation**: Wait 30-60 seconds after publishing rules

### CSV Format
- **Dropdown options**: Must be JSON array string: `"[""Yes"",""No""]"`
- **Assigned jobs**: Comma-separated in quotes: `"ref-1,agenda-1"`
- **Empty fields**: Leave blank, don't use "null" or "undefined"

### Deployment
- Changes to HTML/CSS/JS require git push to GitHub
- GitHub Pages deploys automatically in 1-2 minutes
- Hard refresh required to see changes (Ctrl+Shift+R or Cmd+Shift+R)
- Firebase data (Firestore, Auth) is live immediately, no deployment needed

---

**Last Updated**: 2025-01-25
**Current Version**: v2.1
**Maintainer**: Fernando Mendez
**Status**: Production - All critical bugs fixed, UI improvements pending
