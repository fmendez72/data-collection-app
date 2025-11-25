# Quick Start Guide

## For First-Time Setup

### 1. Create Admin Account in Firebase
1. Go to Firebase Console → Authentication → Users
2. Click "Add user"
3. Email: `your-admin-email@example.com`
4. Password: Create a strong password
5. Click "Add user"

### 2. Create Admin User Document in Firestore
1. Go to Firebase Console → Firestore Database
2. Click "Start collection"
3. Collection ID: `users`
4. Document ID: `your-admin-email@example.com` (must match Firebase Auth email)
5. Add fields:
   ```
   email: "your-admin-email@example.com" (string)
   assigned_jobs: [] (array - leave empty)
   role: "admin" (string)
   created_at: "2025-01-25T12:00:00Z" (string)
   ```
6. Save

### 3. Set Firestore Security Rules
1. Go to Firebase Console → Firestore Database → Rules
2. Copy the rules from README.md (section "Configure Firestore Security Rules")
3. Paste and Publish

### 4. Login to Admin Panel
1. Open your deployed site: `https://YOUR_USERNAME.github.io/data-collection-app/admin.html`
2. Login with your admin credentials
3. You're now ready to manage users and templates!

## For Adding Users

### Method 1: Via Admin Panel (Recommended)
1. Edit `config/users.csv` locally
2. Add users with format:
   ```csv
   user_email,password,assigned_jobs,role,created_date
   alice@example.com,password123,"ref-1,agenda-1",coder,2025-01-25
   ```
3. Login to Admin Panel
4. Upload CSV via "User Management" section
5. Users are automatically created in Firebase Auth + Firestore

### Method 2: Manual Creation
1. Firebase Console → Authentication → Add user manually
2. Firestore Database → `users` collection → Add document manually
3. More tedious, not recommended for bulk operations

## For Adding Questionnaires

1. Create CSV file in `templates/` folder (e.g., `my-questionnaire.csv`)
2. Format:
   ```csv
   id,Answer,Item,Sources,Definition
   1,"[""Yes"",""No""]",Question text here,,Definition shown on hover
   2,,Open-ended question (free text answer),,Another definition
   ```
3. Login to Admin Panel
4. Go to "Template Management"
5. Enter:
   - Job ID: `my-questionnaire` (filename without .csv)
   - Title: "My Questionnaire"
   - Description: "Description of the questionnaire"
6. Upload the CSV file
7. Done! Users assigned to `my-questionnaire` will now see it

## For Testing

1. Create a test user via Admin Panel:
   ```csv
   test@example.com,test123,ref-1,coder,2025-01-25
   ```
2. Upload templates `ref-1.csv` and/or `agenda-1.csv`
3. Login to main app (index.html) as test@example.com
4. You should see your assigned job(s)
5. Select a job, fill out some data, click "Save Draft"
6. Reload page - your draft should persist
7. Click "Submit Final" - job becomes read-only

## Troubleshooting First-Time Setup

### "Permission denied" when creating first admin user document
- You may need to temporarily set Firestore rules to allow writes
- Set rules to test mode, create admin doc, then restore production rules

### Admin Panel shows "Access denied"
- Check that user document exists in Firestore `users` collection
- Verify `role` field is exactly `"admin"` (lowercase)
- Check browser console for detailed error messages

### Templates not showing for coder
- Verify `assigned_jobs` array in user document matches template `job_id`
- Check template was uploaded successfully (view in Firestore `templates` collection)
- Ensure job_id in CSV matches job_id in Firestore

### CSV upload does nothing
- Check browser console for errors
- Verify CSV format (no extra spaces, proper quotes)
- Make sure you're logged in as admin

## Next Steps

Once setup is complete:
1. Create your user accounts (coders)
2. Create your questionnaire templates
3. Assign jobs to users via `assigned_jobs` array
4. Users can login and start data entry
5. Monitor submissions via Admin Panel → "Load All Responses"

## Need Help?

- See [README.md](README.md) for full documentation
- See [SECURITY.md](SECURITY.md) for security best practices
- See [CLAUDE.md](CLAUDE.md) for technical architecture details
