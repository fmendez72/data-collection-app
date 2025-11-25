# User Management Configuration

## users.csv Format

This CSV file manages user accounts and job assignments.

### Columns

- **user_email**: User's email address (used for Firebase Authentication)
- **password**: Initial password assigned by admin
- **assigned_jobs**: Comma-separated job IDs (must match template filenames without .csv extension)
- **role**: Either "admin" or "coder"
  - `admin`: Full access, can manage users and view all responses
  - `coder`: Can only view and complete assigned jobs
- **created_date**: When the user was added (YYYY-MM-DD format)

### Example

```csv
user_email,password,assigned_jobs,role,created_date
admin@example.com,admin123,"ref-1,agenda-1",admin,2025-01-15
alice@example.com,alice456,ref-1,coder,2025-01-16
bob@example.com,bob789,"ref-1,agenda-1",coder,2025-01-16
```

### Usage

1. Edit this CSV file to add/modify users
2. Go to the Admin Panel: `admin.html`
3. Login with admin credentials
4. Click "Upload Users CSV" and select this file
5. Users will be created in Firebase Authentication and Firestore

### Security Notes

- Store this file securely (it contains passwords)
- This file is in `.gitignore` by default (except the template)
- Users should change their password after first login (future enhancement)
- Use strong passwords in production
